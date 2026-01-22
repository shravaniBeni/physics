require('dotenv').config();
const mongoose = require('mongoose');
const aiService = require('./services/aiService');
const Experiment = require('./models/Experiment');

async function testQuizGeneration() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Get the first experiment
    const experiment = await Experiment.findOne();
    if (!experiment) {
      console.log('No experiments found');
      return;
    }

    console.log(`Testing quiz generation for: ${experiment.title}`);
    console.log(`Category: ${experiment.category}`);
    console.log(`Difficulty: ${experiment.difficulty}`);

    // Test AI quiz generation
    const quizOptions = {
      numQuestions: 3,
      difficulty: experiment.difficulty,
      questionTypes: ['multiple-choice', 'true-false', 'numerical']
    };

    console.log('\nGenerating AI quiz...');
    const aiQuiz = await aiService.generateQuiz(experiment, quizOptions);
    
    console.log('\n✅ AI Quiz Generated Successfully!');
    console.log('Number of questions:', aiQuiz.length);
    
    aiQuiz.forEach((question, index) => {
      console.log(`\n--- Question ${index + 1} ---`);
      console.log('Type:', question.type);
      console.log('Question:', question.question);
      if (question.options) {
        console.log('Options:', question.options);
      }
      console.log('Correct Answer:', question.correctAnswer);
      console.log('Points:', question.points);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testQuizGeneration();