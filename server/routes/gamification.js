const express = require('express');
const PointTransaction = require('../models/PointTransaction');
const UserBadge = require('../models/UserBadge');
const DailyChallenge = require('../models/DailyChallenge');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's point transactions
router.get('/points', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await PointTransaction.find({ user_email: req.user.email })
      .populate('experiment_id', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PointTransaction.countDocuments({ user_email: req.user.email });

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's badges
router.get('/badges', auth, async (req, res) => {
  try {
    const badges = await UserBadge.find({ user_email: req.user.email })
      .sort({ earned_at: -1 });

    res.json(badges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'points', period = 'all', limit = 10 } = req.query;
    
    let matchStage = {};
    
    // Add time filter for period
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      matchStage.createdAt = { $gte: startDate };
    }

    let pipeline;
    
    if (type === 'points') {
      pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$user_email',
            totalPoints: { $sum: '$points' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { totalPoints: -1 } },
        { $limit: parseInt(limit) }
      ];
    }

    const results = await PointTransaction.aggregate(pipeline);
    
    // Get user details for leaderboard
    const leaderboard = await Promise.all(
      results.map(async (result, index) => {
        const user = await User.findOne({ email: result._id }).select('name avatar');
        return {
          rank: index + 1,
          email: result._id,
          name: user?.name || 'Unknown User',
          avatar: user?.avatar || '',
          totalPoints: result.totalPoints,
          transactionCount: result.transactionCount
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily challenges
router.get('/daily-challenges', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { date = today } = req.query;
    
    const challenges = await DailyChallenge.find({
      date: date,
      is_active: true
    }).populate('target.experiment_id', 'title category difficulty');

    res.json(challenges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete daily challenge
router.post('/daily-challenges/:challengeId/complete', auth, async (req, res) => {
  try {
    const challenge = await DailyChallenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user already completed this challenge
    if (challenge.completed_by.includes(req.user.email)) {
      return res.status(400).json({ message: 'Challenge already completed' });
    }

    // Add user to completed list
    challenge.completed_by.push(req.user.email);
    await challenge.save();

    // Award points
    const pointTransaction = new PointTransaction({
      user_email: req.user.email,
      points: challenge.reward_points,
      type: 'daily_challenge',
      description: `Daily challenge completed: ${challenge.title}`,
      challenge_id: challenge._id
    });

    await pointTransaction.save();

    // Update user total points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalPoints: challenge.reward_points }
    });

    res.json({
      message: 'Challenge completed successfully',
      pointsAwarded: challenge.reward_points
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Award badge (internal function, could be called by other routes)
router.post('/badges/award', auth, async (req, res) => {
  try {
    const { badge_id, badge_name, badge_description, badge_icon, badge_category, criteria_met } = req.body;

    // Check if user already has this badge
    const existingBadge = await UserBadge.findOne({
      user_email: req.user.email,
      badge_id
    });

    if (existingBadge) {
      return res.status(400).json({ message: 'Badge already earned' });
    }

    // Create badge
    const userBadge = new UserBadge({
      user_email: req.user.email,
      badge_id,
      badge_name,
      badge_description,
      badge_icon,
      badge_category,
      criteria_met
    });

    await userBadge.save();

    // Award bonus points for badge
    const bonusPoints = 100; // Standard badge bonus
    const pointTransaction = new PointTransaction({
      user_email: req.user.email,
      points: bonusPoints,
      type: 'badge_earned',
      description: `Badge earned: ${badge_name}`,
      badge_id
    });

    await pointTransaction.save();

    // Update user total points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalPoints: bonusPoints }
    });

    res.json({
      badge: userBadge,
      pointsAwarded: bonusPoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;