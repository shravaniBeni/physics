const mongoose = require('mongoose');
const { seedExperiments } = require('./experiments');
const DailyChallenge = require('../models/DailyChallenge');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/physics-pocket-lab', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const seedDailyChallenges = async () => {
  try {
    // Clear existing challenges
    await DailyChallenge.deleteMany({});
    
    const today = new Date();
    const challenges = [];
    
    // Create challenges for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const challenge = {
        date: dateString,
        title: `Day ${i + 1} Challenge`,
        description: `Complete any experiment with 80% accuracy`,
        type: 'quiz',
        target: {
          quiz_score: 80
        },
        reward_points: 50 + (i * 10),
        difficulty: i < 2 ? 'easy' : i < 5 ? 'medium' : 'hard',
        completed_by: [],
        is_active: true
      };
      
      challenges.push(challenge);
    }
    
    const insertedChallenges = await DailyChallenge.insertMany(challenges);
    console.log(`✅ Seeded ${insertedChallenges.length} daily challenges`);
    
    return insertedChallenges;
  } catch (error) {
    console.error('❌ Error seeding daily challenges:', error);
    throw error;
  }
};

const seedAll = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Seed experiments
    await seedExperiments();
    
    // Seed daily challenges
    await seedDailyChallenges();
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };