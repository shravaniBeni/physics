const express = require('express');
const UserProgress = require('../models/UserProgress');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user progress for all experiments
router.get('/', auth, async (req, res) => {
  try {
    const progress = await UserProgress.find({ user_email: req.user.email })
      .populate('experiment_id', 'title category difficulty estimatedTime')
      .sort({ last_accessed: -1 });

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get progress for specific experiment
router.get('/experiment/:experimentId', auth, async (req, res) => {
  try {
    const progress = await UserProgress.findOne({
      user_email: req.user.email,
      experiment_id: req.params.experimentId
    }).populate('experiment_id');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update progress
router.post('/', auth, async (req, res) => {
  try {
    const {
      experiment_id,
      status,
      completed,
      time_spent_seconds,
      progress_percentage,
      current_step,
      simulation_data,
      notes
    } = req.body;

    let progress = await UserProgress.findOne({
      user_email: req.user.email,
      experiment_id
    });

    if (progress) {
      // Update existing progress
      progress.status = status || progress.status;
      progress.completed = completed !== undefined ? completed : progress.completed;
      progress.time_spent_seconds = time_spent_seconds || progress.time_spent_seconds;
      progress.progress_percentage = progress_percentage !== undefined ? progress_percentage : progress.progress_percentage;
      progress.current_step = current_step !== undefined ? current_step : progress.current_step;
      progress.simulation_data = simulation_data || progress.simulation_data;
      progress.notes = notes !== undefined ? notes : progress.notes;
      progress.last_accessed = new Date();
      
      if (completed && !progress.completed_at) {
        progress.completed_at = new Date();
      }
    } else {
      // Create new progress
      progress = new UserProgress({
        user_email: req.user.email,
        experiment_id,
        status: status || 'in-progress',
        completed: completed || false,
        time_spent_seconds: time_spent_seconds || 0,
        progress_percentage: progress_percentage || 0,
        current_step: current_step || 0,
        simulation_data: simulation_data || { attempts: 0, best_score: 0, parameters_used: [] },
        notes: notes || ''
      });
    }

    await progress.save();
    await progress.populate('experiment_id', 'title category difficulty estimatedTime');

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;