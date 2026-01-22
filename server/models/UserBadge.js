const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true
  },
  badge_id: {
    type: String,
    required: true
  },
  badge_name: {
    type: String,
    required: true
  },
  badge_description: {
    type: String,
    required: true
  },
  badge_icon: {
    type: String,
    required: true
  },
  badge_category: {
    type: String,
    enum: ['completion', 'accuracy', 'speed', 'consistency', 'exploration', 'special'],
    default: 'completion'
  },
  earned_at: {
    type: Date,
    default: Date.now
  },
  criteria_met: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate badges
userBadgeSchema.index({ user_email: 1, badge_id: 1 }, { unique: true });

module.exports = mongoose.model('UserBadge', userBadgeSchema);