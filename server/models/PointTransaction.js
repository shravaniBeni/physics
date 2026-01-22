const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['experiment_completion', 'quiz_completion', 'daily_challenge', 'badge_earned', 'bonus']
  },
  description: {
    type: String,
    required: true
  },
  experiment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment'
  },
  challenge_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyChallenge'
  },
  badge_id: String
}, {
  timestamps: true
});

// Index for efficient queries
pointTransactionSchema.index({ user_email: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);