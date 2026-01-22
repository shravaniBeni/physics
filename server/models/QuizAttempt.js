const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true
  },
  experiment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment',
    required: true
  },
  answers: [{
    question_index: Number,
    question_text: String, // Store the actual question for AI-generated quizzes
    user_answer: mongoose.Schema.Types.Mixed,
    correct_answer: mongoose.Schema.Types.Mixed, // Store correct answer for reference
    is_correct: Boolean,
    points_earned: Number,
    explanation: String // Store AI-generated explanations
  }],
  total_questions: {
    type: Number,
    required: true
  },
  correct_answers: {
    type: Number,
    required: true
  },
  total_points: {
    type: Number,
    default: 0
  },
  percentage_score: {
    type: Number,
    required: true
  },
  time_taken_seconds: {
    type: Number,
    default: 0
  },
  attempt_number: {
    type: Number,
    default: 1
  },
  quiz_type: {
    type: String,
    enum: ['static', 'ai_generated', 'adaptive'],
    default: 'static'
  },
  is_ai_generated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
quizAttemptSchema.index({ user_email: 1, experiment_id: 1 });
quizAttemptSchema.index({ quiz_type: 1 });
quizAttemptSchema.index({ is_ai_generated: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);