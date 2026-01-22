const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true
  },
  experiment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment',
    required: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  completed: {
    type: Boolean,
    default: false
  },
  time_spent_seconds: {
    type: Number,
    default: 0
  },
  progress_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  current_step: {
    type: Number,
    default: 0
  },
  simulation_data: {
    attempts: {
      type: Number,
      default: 0
    },
    best_score: {
      type: Number,
      default: 0
    },
    parameters_used: [mongoose.Schema.Types.Mixed]
  },
  notes: {
    type: String,
    default: ''
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: Date,
  last_accessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userProgressSchema.index({ user_email: 1, experiment_id: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);