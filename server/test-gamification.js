require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const PointTransaction = require('./models/PointTransaction');
const QuizAttempt = require('./models/QuizAttempt');
const Experiment = require('./models/Experiment');

async function testGamificationSystem() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Get or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        totalPoints: 0
      });
      await testUser.save();
      console.log('Created test user');
    }

    // Get an experiment
    const experiment = await Experiment.findOne();
    if (!experiment) {
      console.log('No experiments found');
      return;
    }

    console.log(`Using experiment: ${experiment.title}`);

    // Create a quiz attempt
    const quizAttempt = new QuizAttempt({
      user_email: testUser.email,
      experiment_id: experiment._id,
      answers: [
        {
          question_index: 0,
          question_text: 'Test question',
          user_answer: 'A',
          correct_answer: 'A',
          is_correct: true,
          points_earned: 2,
          explanation: 'Test explanation'
        }
      ],
      total_questions: 1,
      correct_answers: 1,
      total_points: 2,
      percentage_score: 100,
      time_taken_seconds: 30,
      attempt_number: 1,
      quiz_type: 'ai_generated',
      is_ai_generated: true
    });

    await quizAttempt.save();
    console.log('Created quiz attempt');

    // Award points for the quiz
    const pointsToAward = Math.floor(2 * 10 * 1.2); // 2 points * 10 multiplier * 1.2 AI bonus
    
    const pointTransaction = new PointTransaction({
      user_email: testUser.email,
      points: pointsToAward,
      type: 'quiz_completion',
      description: `AI-Generated quiz completed for ${experiment.title} (100.0%)`,
      experiment_id: experiment._id
    });

    await pointTransaction.save();
    console.log(`Created point transaction: +${pointsToAward} points`);

    // Update user total points
    await User.findByIdAndUpdate(testUser._id, {
      $inc: { totalPoints: pointsToAward }
    });

    console.log('Updated user total points');

    // Test leaderboard
    const pipeline = [
      {
        $group: {
          _id: '$user_email',
          totalPoints: { $sum: '$points' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 }
    ];

    const results = await PointTransaction.aggregate(pipeline);
    console.log('\nLeaderboard results:');
    console.log(results);

    // Get updated user
    const updatedUser = await User.findById(testUser._id);
    console.log(`\nUpdated user points: ${updatedUser.totalPoints}`);

    console.log('\n✅ Gamification system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testGamificationSystem();