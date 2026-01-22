const express = require('express');
const QuizAttempt = require('../models/QuizAttempt');
const Experiment = require('../models/Experiment');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get quiz for experiment (original static quiz)
router.get('/experiment/:experimentId', auth, async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.experimentId).select('quiz title');
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Remove correct answers from quiz questions
    const quiz = experiment.quiz.map(q => ({
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points
    }));

    res.json({
      experimentId: experiment._id,
      experimentTitle: experiment.title,
      questions: quiz,
      isAIGenerated: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate AI quiz for experiment
router.post('/experiment/:experimentId/generate', auth, async (req, res) => {
  try {
    const { 
      numQuestions = 5, 
      difficulty, 
      questionTypes = ['multiple-choice', 'true-false', 'numerical'],
      focusAreas = []
    } = req.body;

    const experiment = await Experiment.findById(req.params.experimentId);
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Import AI service here to avoid circular dependency
    const aiService = require('../services/aiService');
    
    if (!aiService.isConfigured()) {
      return res.status(503).json({ 
        message: 'AI service not available',
        fallback: 'Using static quiz instead'
      });
    }

    const quizOptions = {
      numQuestions,
      difficulty: difficulty || experiment.difficulty,
      questionTypes,
      focusAreas
    };

    const aiQuiz = await aiService.generateQuiz(experiment, quizOptions);

    // Generate a unique quiz ID
    const quizId = `ai_${experiment._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Remove correct answers from AI-generated quiz questions for client
    const clientQuiz = aiQuiz.map(q => ({
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points || 1,
      unit: q.unit // for numerical questions
    }));

    res.json({
      experimentId: experiment._id,
      experimentTitle: experiment.title,
      questions: clientQuiz,
      isAIGenerated: true,
      generationOptions: quizOptions,
      quizId: quizId
    });

    // Store the full quiz temporarily (you might want to use Redis or similar in production)
    // For now, we'll store it in memory with the quizId
    global.tempAIQuizzes = global.tempAIQuizzes || {};
    global.tempAIQuizzes[quizId] = {
      quiz: aiQuiz,
      timestamp: Date.now(),
      experimentId: experiment._id
    };

    // Clean up old quizzes (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    Object.keys(global.tempAIQuizzes).forEach(id => {
      if (Date.now() - global.tempAIQuizzes[id].timestamp > oneHour) {
        delete global.tempAIQuizzes[id];
      }
    });

  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate AI quiz',
      error: error.message,
      fallback: 'Try using the static quiz instead'
    });
  }
});

// Generate adaptive AI quiz based on user performance
router.post('/experiment/:experimentId/adaptive', auth, async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.experimentId);
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Get user's previous performance
    const previousAttempts = await QuizAttempt.find({
      user_email: req.user.email,
      experiment_id: req.params.experimentId
    }).sort({ createdAt: -1 }).limit(5);

    const userPerformance = {
      previousScores: previousAttempts.map(attempt => attempt.percentage_score),
      weakAreas: req.body.weakAreas || [],
      strongAreas: req.body.strongAreas || [],
      preferredDifficulty: req.body.difficulty || experiment.difficulty
    };

    const aiService = require('../services/aiService');
    
    if (!aiService.isConfigured()) {
      return res.status(503).json({ 
        message: 'AI service not available for adaptive quizzes'
      });
    }

    const adaptiveQuiz = await aiService.generateAdaptiveQuiz(experiment, userPerformance);

    const quizId = `adaptive_${experiment._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clientQuiz = adaptiveQuiz.map(q => ({
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points || 1,
      unit: q.unit
    }));

    res.json({
      experimentId: experiment._id,
      experimentTitle: experiment.title,
      questions: clientQuiz,
      isAIGenerated: true,
      isAdaptive: true,
      userPerformance,
      quizId
    });

    // Store the full adaptive quiz temporarily
    global.tempAIQuizzes = global.tempAIQuizzes || {};
    global.tempAIQuizzes[quizId] = {
      quiz: adaptiveQuiz,
      timestamp: Date.now(),
      experimentId: experiment._id
    };

  } catch (error) {
    console.error('Adaptive quiz generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate adaptive quiz',
      error: error.message
    });
  }
});

// Submit quiz attempt (handles both static and AI-generated quizzes)
router.post('/submit', auth, async (req, res) => {
  try {
    const { experiment_id, answers, time_taken_seconds, quizId, isAIGenerated } = req.body;

    const experiment = await Experiment.findById(experiment_id);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    let quizQuestions;
    let quizType = 'static';

    if (isAIGenerated && quizId) {
      // Handle AI-generated quiz
      global.tempAIQuizzes = global.tempAIQuizzes || {};
      const storedQuizData = global.tempAIQuizzes[quizId];
      
      if (!storedQuizData) {
        return res.status(400).json({ 
          message: 'AI quiz session expired. Please generate a new quiz.',
          code: 'QUIZ_EXPIRED'
        });
      }
      
      quizQuestions = storedQuizData.quiz;
      quizType = quizId.startsWith('adaptive_') ? 'adaptive' : 'ai_generated';
    } else {
      // Handle static quiz
      quizQuestions = experiment.quiz;
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      return res.status(400).json({ message: 'No quiz questions found' });
    }

    // Calculate score
    let correct_answers = 0;
    let total_points = 0;
    const gradedAnswers = [];

    answers.forEach((userAnswer, index) => {
      const question = quizQuestions[index];
      if (!question) return;

      const isCorrect = checkAnswer(question, userAnswer);
      const pointsEarned = isCorrect ? (question.points || 1) : 0;

      gradedAnswers.push({
        question_index: index,
        question_text: question.question,
        user_answer: userAnswer,
        correct_answer: question.correctAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        explanation: question.explanation || ''
      });

      if (isCorrect) correct_answers++;
      total_points += pointsEarned;
    });

    const percentage_score = (correct_answers / quizQuestions.length) * 100;

    // Get attempt number
    const previousAttempts = await QuizAttempt.countDocuments({
      user_email: req.user.email,
      experiment_id
    });

    // Create quiz attempt
    const quizAttempt = new QuizAttempt({
      user_email: req.user.email,
      experiment_id,
      answers: gradedAnswers,
      total_questions: quizQuestions.length,
      correct_answers,
      total_points,
      percentage_score,
      time_taken_seconds,
      attempt_number: previousAttempts + 1,
      quiz_type: quizType,
      is_ai_generated: isAIGenerated || false
    });

    await quizAttempt.save();

    // Award points if score is above threshold (70%)
    let pointsAwarded = 0;
    if (percentage_score >= 70) {
      pointsAwarded = Math.floor(total_points * 10); // 10 points per quiz point
      
      // Bonus points for AI-generated quizzes
      if (isAIGenerated) {
        pointsAwarded = Math.floor(pointsAwarded * 1.2); // 20% bonus for AI quizzes
      }
      
      // Create point transaction
      const pointTransaction = new PointTransaction({
        user_email: req.user.email,
        points: pointsAwarded,
        type: 'quiz_completion',
        description: `${quizType === 'adaptive' ? 'Adaptive' : quizType === 'ai_generated' ? 'AI-Generated' : 'Standard'} quiz completed for ${experiment.title} (${percentage_score.toFixed(1)}%)`,
        experiment_id
      });

      await pointTransaction.save();

      // Update user total points
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalPoints: pointsAwarded }
      });
    }

    // Clean up temporary AI quiz data
    if (isAIGenerated && quizId && global.tempAIQuizzes) {
      delete global.tempAIQuizzes[quizId];
    }

    res.json({
      attempt: quizAttempt,
      pointsAwarded,
      detailedResults: gradedAnswers,
      performance: {
        percentage: percentage_score,
        correctAnswers: correct_answers,
        totalQuestions: quizQuestions.length,
        totalPoints: total_points,
        quizType
      }
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's quiz attempts
router.get('/attempts', auth, async (req, res) => {
  try {
    const { experiment_id } = req.query;
    
    let query = { user_email: req.user.email };
    if (experiment_id) query.experiment_id = experiment_id;

    const attempts = await QuizAttempt.find(query)
      .populate('experiment_id', 'title category')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if AI quiz session is valid
router.get('/session/:quizId', auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    
    global.tempAIQuizzes = global.tempAIQuizzes || {};
    const storedQuizData = global.tempAIQuizzes[quizId];
    
    if (!storedQuizData) {
      return res.status(404).json({ 
        valid: false,
        message: 'Quiz session not found or expired' 
      });
    }
    
    // Check if quiz is older than 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - storedQuizData.timestamp > oneHour) {
      delete global.tempAIQuizzes[quizId];
      return res.status(410).json({ 
        valid: false,
        message: 'Quiz session expired' 
      });
    }
    
    res.json({
      valid: true,
      experimentId: storedQuizData.experimentId,
      questionsCount: storedQuizData.quiz.length,
      timeRemaining: oneHour - (Date.now() - storedQuizData.timestamp)
    });
  } catch (error) {
    console.error('Quiz session check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz statistics and AI availability
router.get('/stats/:experimentId', auth, async (req, res) => {
  try {
    const experimentId = req.params.experimentId;
    
    // Get user's quiz attempts for this experiment
    const attempts = await QuizAttempt.find({
      user_email: req.user.email,
      experiment_id: experimentId
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalAttempts: attempts.length,
      bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage_score)) : 0,
      averageScore: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage_score, 0) / attempts.length : 0,
      lastAttempt: attempts.length > 0 ? attempts[0] : null,
      aiQuizAttempts: attempts.filter(a => a.is_ai_generated).length,
      staticQuizAttempts: attempts.filter(a => !a.is_ai_generated).length,
      recentScores: attempts.slice(0, 5).map(a => a.percentage_score)
    };

    // Check AI service availability
    const aiService = require('../services/aiService');
    const aiAvailable = aiService.isConfigured();

    // Analyze weak areas based on recent attempts
    const weakAreas = [];
    const strongAreas = [];
    
    if (attempts.length > 0) {
      const recentAttempts = attempts.slice(0, 3);
      const avgRecentScore = recentAttempts.reduce((sum, a) => sum + a.percentage_score, 0) / recentAttempts.length;
      
      if (avgRecentScore < 70) {
        weakAreas.push('conceptual understanding');
      }
      if (avgRecentScore > 85) {
        strongAreas.push('problem solving');
      }
    }

    res.json({
      stats,
      aiAvailable,
      recommendations: {
        weakAreas,
        strongAreas,
        suggestedDifficulty: stats.averageScore > 85 ? 'advanced' : stats.averageScore < 60 ? 'beginner' : 'intermediate',
        shouldUseAdaptive: attempts.length >= 2
      }
    });
  } catch (error) {
    console.error('Quiz stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check if answer is correct
function checkAnswer(question, userAnswer) {
  switch (question.type) {
    case 'multiple-choice':
      return question.correctAnswer === userAnswer;
    case 'true-false':
      return question.correctAnswer === userAnswer;
    case 'numerical':
      const tolerance = 0.01; // 1% tolerance for numerical answers
      return Math.abs(question.correctAnswer - userAnswer) <= Math.abs(question.correctAnswer * tolerance);
    default:
      return false;
  }
}

module.exports = router;