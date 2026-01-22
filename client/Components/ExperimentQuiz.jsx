import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Trophy,
  Zap,
  BookOpen,
  Sparkles,
  Brain,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ExperimentQuiz({ experiment }) {
  const [quizState, setQuizState] = useState('menu'); // menu, taking, completed
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeStarted, setTimeStarted] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizType, setQuizType] = useState('static'); // static, ai, adaptive
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Get quiz statistics
  const { data: quizStats, error: statsError } = useQuery({
    queryKey: ['quiz-stats', experiment?._id],
    queryFn: async () => {
      if (!experiment?._id) return null;
      try {
        return apiRequest(`${API_CONFIG.ENDPOINTS.QUIZ.GET}/../stats/${experiment._id}`);
      } catch (error) {
        console.error('Failed to load quiz stats:', error);
        // Return default stats if API fails
        return {
          stats: { totalAttempts: 0, bestScore: 0, averageScore: 0, aiQuizAttempts: 0 },
          aiAvailable: true,
          recommendations: { shouldUseAdaptive: false, suggestedDifficulty: 'intermediate', weakAreas: [], strongAreas: [] }
        };
      }
    },
    enabled: !!experiment?._id,
    retry: 1
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData) => {
      return apiRequest(API_CONFIG.ENDPOINTS.QUIZ.SUBMIT, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });
    },
    onSuccess: (data) => {
      setQuizState('completed');
      queryClient.invalidateQueries(['quiz-stats', experiment._id]);
      queryClient.invalidateQueries(['quiz-attempts']);
    },
    onError: (error) => {
      console.error('Quiz submission error:', error);
      
      // Handle specific error cases
      if (error.message.includes('quiz session expired')) {
        alert('Your quiz session has expired. Please generate a new quiz and try again.');
        resetQuiz();
      } else {
        alert('Failed to submit quiz. Please try again.');
      }
    }
  });

  // Generate AI quiz
  const generateAIQuiz = async (type = 'ai') => {
    setIsGenerating(true);
    try {
      const endpoint = type === 'adaptive' 
        ? `${API_CONFIG.ENDPOINTS.QUIZ.GET}/${experiment._id}/adaptive`
        : `${API_CONFIG.ENDPOINTS.QUIZ.GET}/${experiment._id}/generate`;
      
      const options = {
        numQuestions: 5,
        difficulty: experiment.difficulty,
        questionTypes: ['multiple-choice', 'true-false', 'numerical']
      };

      if (type === 'adaptive' && quizStats?.recommendations) {
        options.weakAreas = quizStats.recommendations.weakAreas;
        options.difficulty = quizStats.recommendations.suggestedDifficulty;
      }

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(options)
      });

      setQuizData(response);
      setQuizType(type);
      startQuiz();
    } catch (error) {
      console.error('Failed to generate AI quiz:', error);
      alert('Failed to generate AI quiz. Please try the standard quiz instead.');
      // Don't fallback automatically, let user choose
    } finally {
      setIsGenerating(false);
    }
  };

  // Load static quiz
  const loadStaticQuiz = async () => {
    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZ.GET}/${experiment._id}`);
      setQuizData(response);
      setQuizType('static');
      startQuiz();
    } catch (error) {
      console.error('Failed to load static quiz:', error);
    }
  };

  // Check quiz session validity periodically
  useEffect(() => {
    if (quizState === 'taking' && quizData?.quizId && quizData?.isAIGenerated) {
      const checkSession = async () => {
        try {
          await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZ.GET}/../session/${quizData.quizId}`);
        } catch (error) {
          console.warn('Quiz session check failed:', error);
          if (error.message.includes('expired') || error.message.includes('not found')) {
            alert('Your quiz session has expired. Returning to quiz menu.');
            resetQuiz();
          }
        }
      };

      // Check session every 5 minutes
      const interval = setInterval(checkSession, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [quizState, quizData]);

  const startQuiz = () => {
    setQuizState('taking');
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeStarted(Date.now());
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    // Auto-advance for multiple choice and true/false
    const question = quizData.questions[currentQuestion];
    if (question.type !== 'numerical') {
      setTimeout(() => {
        if (currentQuestion < quizData.questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          submitQuiz(newAnswers);
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(answers);
    }
  };

  const submitQuiz = (finalAnswers) => {
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000);
    
    console.log('Submitting quiz:', {
      experiment_id: experiment._id,
      answers: finalAnswers,
      time_taken_seconds: timeTaken,
      quizId: quizData.quizId,
      isAIGenerated: quizData.isAIGenerated || false
    });
    
    submitQuizMutation.mutate({
      experiment_id: experiment._id,
      answers: finalAnswers,
      time_taken_seconds: timeTaken,
      quizId: quizData.quizId,
      isAIGenerated: quizData.isAIGenerated || false
    });
  };

  const resetQuiz = () => {
    setQuizState('menu');
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeStarted(null);
    setQuizData(null);
  };

  if (!experiment) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading experiment data...</p>
        </div>
      </Card>
    );
  }

  // Quiz Menu
  if (quizState === 'menu') {
    return (
      <div className="space-y-6">
        {/* Quiz Statistics */}
        {quizStats && (
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Your Quiz Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{quizStats.stats.totalAttempts}</div>
                <div className="text-xs text-slate-400">Total Attempts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{quizStats.stats.bestScore.toFixed(0)}%</div>
                <div className="text-xs text-slate-400">Best Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{quizStats.stats.averageScore.toFixed(0)}%</div>
                <div className="text-xs text-slate-400">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{quizStats.stats.aiQuizAttempts}</div>
                <div className="text-xs text-slate-400">AI Quizzes</div>
              </div>
            </div>
          </Card>
        )}

        {/* Quiz Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Static Quiz */}
          <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Standard Quiz</h3>
              <p className="text-slate-400 text-sm mb-4">
                Pre-designed questions covering key concepts from this experiment.
              </p>
              <Button 
                onClick={loadStaticQuiz}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Standard Quiz
              </Button>
            </div>
          </Card>

          {/* AI Generated Quiz */}
          <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/30 transition-colors">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Generated Quiz</h3>
              <p className="text-slate-400 text-sm mb-4">
                Fresh questions generated by AI. Get unique questions every time!
              </p>
              <Button 
                onClick={() => generateAIQuiz('ai')}
                disabled={isGenerating || !quizStats?.aiAvailable}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Generate AI Quiz
              </Button>
              {!quizStats?.aiAvailable && (
                <p className="text-xs text-amber-400 mt-2">AI service unavailable</p>
              )}
            </div>
          </Card>

          {/* Adaptive Quiz */}
          <Card className="bg-slate-800/50 border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Adaptive Quiz</h3>
              <p className="text-slate-400 text-sm mb-4">
                Personalized questions based on your performance and weak areas.
              </p>
              <Button 
                onClick={() => generateAIQuiz('adaptive')}
                disabled={isGenerating || !quizStats?.aiAvailable || !quizStats?.recommendations?.shouldUseAdaptive}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Adaptive Quiz
              </Button>
              {!quizStats?.recommendations?.shouldUseAdaptive && (
                <p className="text-xs text-amber-400 mt-2">Take 2+ quizzes to unlock</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        {quizStats?.recommendations && (
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
            <div className="space-y-2">
              <p className="text-slate-300">
                <span className="text-cyan-400 font-medium">Suggested Difficulty:</span> {quizStats.recommendations.suggestedDifficulty}
              </p>
              {quizStats.recommendations.weakAreas.length > 0 && (
                <p className="text-slate-300">
                  <span className="text-amber-400 font-medium">Focus Areas:</span> {quizStats.recommendations.weakAreas.join(', ')}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Taking Quiz
  if (quizState === 'taking' && quizData) {
    const question = quizData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </span>
            <div className="flex items-center gap-2">
              {quizData.isAIGenerated && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {quizData.isAdaptive ? 'Adaptive AI' : 'AI Generated'}
                </Badge>
              )}
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                {Math.floor((Date.now() - timeStarted) / 1000)}s
              </span>
              {quizData.isAIGenerated && (
                <span className="text-xs text-green-400">Session Active</span>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {/* Question */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-6">{question.question}</h3>

          {/* Multiple Choice */}
          {question.type === 'multiple-choice' && (
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = answers[currentQuestion] === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(optionLetter)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    <span className="font-medium mr-3">{optionLetter}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true-false' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className={cn(
                  "flex-1 p-4 rounded-lg border transition-all",
                  answers[currentQuestion] === true
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500"
                )}
              >
                <CheckCircle2 className="w-5 h-5 mx-auto mb-2" />
                True
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className={cn(
                  "flex-1 p-4 rounded-lg border transition-all",
                  answers[currentQuestion] === false
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500"
                )}
              >
                <XCircle className="w-5 h-5 mx-auto mb-2" />
                False
              </button>
            </div>
          )}

          {/* Numerical */}
          {question.type === 'numerical' && (
            <div className="space-y-4">
              <Input
                type="number"
                step="any"
                placeholder="Enter your answer"
                value={answers[currentQuestion] || ''}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = parseFloat(e.target.value) || 0;
                  setAnswers(newAnswers);
                }}
                className="bg-slate-700 border-slate-600 text-white text-lg p-4"
              />
              {question.unit && (
                <p className="text-sm text-slate-400">Answer in {question.unit}</p>
              )}
              <Button 
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {currentQuestion < quizData.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Quiz Completed
  if (quizState === 'completed' && submitQuizMutation.data) {
    const result = submitQuizMutation.data;
    const percentage = result.performance.percentage;
    
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-slate-400 mb-6">
            {quizData.isAIGenerated ? 'AI-Generated' : 'Standard'} Quiz • {experiment.title}
          </p>
          
          <div className="text-6xl font-bold mb-4">
            <span className={cn(
              percentage >= 80 ? "text-green-400" :
              percentage >= 60 ? "text-amber-400" : "text-red-400"
            )}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-2xl font-bold text-white">{result.performance.correctAnswers}</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{result.performance.totalQuestions}</div>
              <div className="text-sm text-slate-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">+{result.pointsAwarded}</div>
              <div className="text-sm text-slate-400">Points</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={resetQuiz} variant="outline" className="border-slate-600 text-slate-300">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => generateAIQuiz('ai')} className="bg-gradient-to-r from-cyan-600 to-purple-600">
              <Sparkles className="w-4 h-4 mr-2" />
              New AI Quiz
            </Button>
          </div>
        </Card>

        {/* Detailed Results */}
        {result.detailedResults && (
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Results</h3>
            <div className="space-y-4">
              {result.detailedResults.map((answer, index) => (
                <div key={index} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      answer.is_correct ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {answer.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">{answer.question_text}</p>
                      <p className="text-sm text-slate-400 mb-1">
                        Your answer: <span className="text-slate-300">{answer.user_answer}</span>
                      </p>
                      <p className="text-sm text-slate-400 mb-2">
                        Correct answer: <span className="text-green-400">{answer.correct_answer}</span>
                      </p>
                      {answer.explanation && (
                        <p className="text-sm text-slate-300 bg-slate-700/50 rounded p-2">
                          {answer.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading quiz...</p>
      </div>
    </Card>
  );
}