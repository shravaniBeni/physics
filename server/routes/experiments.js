const express = require('express');
const Experiment = require('../models/Experiment');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all experiments
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, difficulty, search, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    
    // Add filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$text = { $search: search };
    }

    const experiments = await Experiment.find(query)
      .select('-quiz') // Don't include quiz questions in list
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Experiment.countDocuments(query);

    res.json({
      experiments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get experiment by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    
    if (!experiment || !experiment.isActive) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    res.json(experiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get experiment categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Experiment.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;