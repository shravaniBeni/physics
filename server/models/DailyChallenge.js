const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['experiment', 'quiz', 'simulation', 'theory']
  },
  target: {
    experiment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Experiment'
    },
    quiz_score: Number,
    simulation_attempts: Number,
    time_limit: Number // in minutes
  },
  reward_points: {
    type: Number,
    required: true,
    default: 50
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  completed_by: [{
    type: String // user emails
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);