const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['mechanics', 'electricity', 'optics', 'waves', 'thermodynamics']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  objectives: [{
    type: String,
    required: true
  }],
  materials: [{
    name: String,
    quantity: String,
    optional: {
      type: Boolean,
      default: false
    }
  }],
  procedure: [{
    step: Number,
    instruction: String,
    image: String,
    notes: String
  }],
  theory: {
    concepts: [String],
    formulas: [{
      name: String,
      formula: String,
      variables: [{
        symbol: String,
        description: String,
        unit: String
      }]
    }],
    background: String
  },
  simulation: {
    type: {
      type: String,
      enum: ['pendulum', 'projectile', 'ohms-law', 'wave', 'lens', 'thermal', 'freefall', 'rc-circuit']
    },
    parameters: mongoose.Schema.Types.Mixed
  },
  quiz: [{
    question: String,
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'numerical']
    },
    options: [String], // for multiple choice
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search functionality
experimentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Experiment', experimentSchema);