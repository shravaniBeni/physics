const express = require('express');
const HardwareExperiment = require('../models/HardwareExperiment');
const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const AIService = require('../services/aiService');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Register ESP32 device and start experiment
router.post('/experiments/start', auth, async (req, res) => {
  try {
    const { experiment_type, device_id, device_ip } = req.body;

    if (!['pendulum', 'freefall'].includes(experiment_type)) {
      return res.status(400).json({ message: 'Invalid experiment type' });
    }

    const experiment = new HardwareExperiment({
      user_email: req.user.email,
      experiment_type,
      device_id: device_id || 'esp32_default',
      device_ip: device_ip || req.ip,
      status: 'recording'
    });

    await experiment.save();

    res.json({
      experiment_id: experiment._id,
      message: 'Experiment started successfully',
      status: 'recording'
    });
  } catch (error) {
    console.error('Start experiment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Receive data from ESP32
router.post('/experiments/:experimentId/data', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { timestamp, value, raw_data } = req.body;

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    if (experiment.status !== 'recording') {
      return res.status(400).json({ message: 'Experiment is not in recording state' });
    }

    // Add data point
    experiment.data_points.push({
      timestamp: timestamp || Date.now(),
      value: parseFloat(value),
      raw_data: raw_data || {}
    });

    await experiment.save();

    res.json({ message: 'Data received successfully' });
  } catch (error) {
    console.error('Data reception error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk data upload from ESP32
router.post('/experiments/:experimentId/bulk-data', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { data_points } = req.body;

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Add multiple data points
    const formattedPoints = data_points.map(point => ({
      timestamp: point.timestamp || Date.now(),
      value: parseFloat(point.value),
      raw_data: point.raw_data || {}
    }));

    experiment.data_points.push(...formattedPoints);
    await experiment.save();

    res.json({ 
      message: 'Bulk data received successfully',
      points_added: formattedPoints.length 
    });
  } catch (error) {
    console.error('Bulk data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop experiment and trigger analysis
router.post('/experiments/:experimentId/stop', auth, async (req, res) => {
  try {
    const { experimentId } = req.params;

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    if (experiment.user_email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update experiment status
    experiment.end_time = new Date();
    experiment.duration = (experiment.end_time - experiment.start_time) / 1000;
    experiment.status = 'analyzing';

    await experiment.save();

    // Trigger AI analysis (async)
    analyzeExperimentData(experimentId);

    res.json({
      message: 'Experiment stopped successfully',
      duration: experiment.duration,
      data_points: experiment.data_points.length
    });
  } catch (error) {
    console.error('Stop experiment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get experiment data and analysis
router.get('/experiments/:experimentId', auth, async (req, res) => {
  try {
    const { experimentId } = req.params;

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    if (experiment.user_email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(experiment);
  } catch (error) {
    console.error('Get experiment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's hardware experiments
router.get('/experiments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, experiment_type } = req.query;
    
    let query = { user_email: req.user.email };
    if (experiment_type) query.experiment_type = experiment_type;

    const experiments = await HardwareExperiment.find(query)
      .select('-data_points') // Exclude large data arrays from list
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HardwareExperiment.countDocuments(query);

    res.json({
      experiments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get experiments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download CSV data
router.get('/experiments/:experimentId/csv', auth, async (req, res) => {
  try {
    const { experimentId } = req.params;

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    if (experiment.user_email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Generate CSV content
    let csvContent = 'timestamp,time_seconds,value,ax,ay,az\n';
    
    experiment.data_points.forEach(point => {
      const timeSeconds = (point.timestamp - experiment.data_points[0].timestamp) / 1000;
      csvContent += `${point.timestamp},${timeSeconds.toFixed(3)},${point.value.toFixed(6)},${point.raw_data?.ax || ''},${point.raw_data?.ay || ''},${point.raw_data?.az || ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${experiment.experiment_type}_${experiment._id}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('CSV download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get real-time data for live plotting
router.get('/experiments/:experimentId/live-data', auth, async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { since } = req.query; // timestamp to get data since

    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    if (experiment.user_email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let dataPoints = experiment.data_points;
    
    // Filter data since timestamp if provided
    if (since) {
      dataPoints = dataPoints.filter(point => point.timestamp > parseInt(since));
    }

    // Return last 100 points for performance
    const recentData = dataPoints.slice(-100);

    res.json({
      experiment_id: experimentId,
      experiment_type: experiment.experiment_type,
      status: experiment.status,
      data_points: recentData,
      total_points: experiment.data_points.length
    });
  } catch (error) {
    console.error('Live data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Analysis function (called asynchronously)
async function analyzeExperimentData(experimentId) {
  try {
    const experiment = await HardwareExperiment.findById(experimentId);
    if (!experiment || experiment.data_points.length === 0) return;

    const dataPoints = experiment.data_points;
    const values = dataPoints.map(p => p.value);
    const timestamps = dataPoints.map(p => p.timestamp);

    let analysis = {};
    let aiInsights = {};

    if (experiment.experiment_type === 'pendulum') {
      analysis = analyzePendulumData(values, timestamps);
      aiInsights = await generatePendulumInsights(analysis, values);
    } else if (experiment.experiment_type === 'freefall') {
      analysis = analyzeFreefallData(values, timestamps);
      aiInsights = await generateFreefallInsights(analysis, values);
    }

    // Update experiment with analysis
    experiment.analysis = analysis;
    experiment.ai_insights = aiInsights;
    experiment.status = 'analyzed';

    await experiment.save();

    // Award points for completing hardware experiment
    const pointTransaction = new PointTransaction({
      user_email: experiment.user_email,
      points: 150, // Higher points for hardware experiments
      type: 'hardware_experiment',
      description: `Completed ${experiment.experiment_type} hardware experiment`,
      experiment_id: experiment._id
    });

    await pointTransaction.save();

    console.log(`Analysis completed for experiment ${experimentId}`);
  } catch (error) {
    console.error('Analysis error:', error);
  }
}

// Pendulum data analysis
function analyzePendulumData(angles, timestamps) {
  // Calculate period using zero crossings
  const zeroCrossings = [];
  for (let i = 1; i < angles.length; i++) {
    if ((angles[i-1] >= 0 && angles[i] < 0) || (angles[i-1] < 0 && angles[i] >= 0)) {
      zeroCrossings.push(timestamps[i]);
    }
  }

  const periods = [];
  for (let i = 2; i < zeroCrossings.length; i += 2) {
    periods.push((zeroCrossings[i] - zeroCrossings[i-2]) / 1000); // Convert to seconds
  }

  const avgPeriod = periods.length > 0 ? periods.reduce((a, b) => a + b) / periods.length : 0;
  const frequency = avgPeriod > 0 ? 1 / avgPeriod : 0;
  
  // Calculate amplitude (max absolute angle)
  const amplitude = Math.max(...angles.map(Math.abs));
  
  // Estimate damping (simplified)
  const firstHalf = angles.slice(0, Math.floor(angles.length / 2));
  const secondHalf = angles.slice(Math.floor(angles.length / 2));
  const firstAmplitude = Math.max(...firstHalf.map(Math.abs));
  const secondAmplitude = Math.max(...secondHalf.map(Math.abs));
  const dampingCoefficient = firstAmplitude > 0 ? (firstAmplitude - secondAmplitude) / firstAmplitude : 0;

  // Data quality assessment
  const noise = calculateNoise(angles);
  const dataQuality = noise < 0.5 ? 'excellent' : noise < 1.0 ? 'good' : noise < 2.0 ? 'fair' : 'poor';

  return {
    period: avgPeriod,
    frequency,
    amplitude,
    damping_coefficient: dampingCoefficient,
    data_quality: dataQuality,
    noise_level: noise,
    sample_rate: angles.length / ((timestamps[timestamps.length - 1] - timestamps[0]) / 1000)
  };
}

// Free fall data analysis
function analyzeFreefallData(accelerations, timestamps) {
  // Calculate average acceleration
  const avgAcceleration = accelerations.reduce((a, b) => a + b) / accelerations.length;
  
  // Calculate standard deviation
  const variance = accelerations.reduce((sum, acc) => sum + Math.pow(acc - avgAcceleration, 2), 0) / accelerations.length;
  const stdDeviation = Math.sqrt(variance);
  
  // Calculate error percentage compared to theoretical g
  const theoreticalG = 9.81;
  const errorPercentage = Math.abs((avgAcceleration - theoreticalG) / theoreticalG) * 100;
  
  // Data quality assessment
  const noise = calculateNoise(accelerations);
  const dataQuality = noise < 0.2 ? 'excellent' : noise < 0.5 ? 'good' : noise < 1.0 ? 'fair' : 'poor';

  return {
    acceleration_avg: avgAcceleration,
    acceleration_std: stdDeviation,
    theoretical_g: theoreticalG,
    error_percentage: errorPercentage,
    data_quality: dataQuality,
    noise_level: noise,
    sample_rate: accelerations.length / ((timestamps[timestamps.length - 1] - timestamps[0]) / 1000)
  };
}

// Calculate noise level
function calculateNoise(data) {
  if (data.length < 2) return 0;
  
  let totalVariation = 0;
  for (let i = 1; i < data.length; i++) {
    totalVariation += Math.abs(data[i] - data[i-1]);
  }
  
  return totalVariation / (data.length - 1);
}

// Generate AI insights for pendulum
async function generatePendulumInsights(analysis, data) {
  try {
    const prompt = `Analyze this pendulum experiment data:
- Period: ${analysis.period?.toFixed(3)} seconds
- Frequency: ${analysis.frequency?.toFixed(3)} Hz
- Amplitude: ${analysis.amplitude?.toFixed(2)} degrees
- Damping coefficient: ${analysis.damping_coefficient?.toFixed(4)}
- Data quality: ${analysis.data_quality}
- Sample rate: ${analysis.sample_rate?.toFixed(1)} Hz

Provide insights about the physics principles demonstrated, predict the theoretical period, and suggest improvements.`;

    const aiResponse = await AIService.generateResponse(prompt, {
      experiment: 'pendulum',
      analysis_mode: true
    });

    return {
      summary: `Pendulum experiment completed with period of ${analysis.period?.toFixed(3)}s and amplitude of ${analysis.amplitude?.toFixed(2)}°`,
      physics_principles: ['Simple Harmonic Motion', 'Gravitational Restoring Force', 'Energy Conservation', 'Damping Effects'],
      predictions: [
        {
          parameter: 'Theoretical Period',
          predicted_value: 2 * Math.PI * Math.sqrt(1 / 9.81), // Assuming 1m length
          confidence: 0.85,
          explanation: 'Based on T = 2π√(L/g) for small angle approximation'
        }
      ],
      recommendations: [
        'Ensure small angle approximation (< 15°) for accurate results',
        'Minimize air resistance and friction',
        'Use higher sampling rate for better precision'
      ],
      error_analysis: aiResponse || 'AI analysis temporarily unavailable'
    };
  } catch (error) {
    console.error('AI insights error:', error);
    return {
      summary: `Pendulum experiment completed with ${data.length} data points`,
      physics_principles: ['Simple Harmonic Motion'],
      predictions: [],
      recommendations: ['Check sensor calibration', 'Ensure stable mounting'],
      error_analysis: 'AI analysis failed'
    };
  }
}

// Generate AI insights for free fall
async function generateFreefallInsights(analysis, data) {
  try {
    const prompt = `Analyze this free fall experiment data:
- Average acceleration: ${analysis.acceleration_avg?.toFixed(3)} m/s²
- Standard deviation: ${analysis.acceleration_std?.toFixed(3)} m/s²
- Theoretical g: ${analysis.theoretical_g} m/s²
- Error percentage: ${analysis.error_percentage?.toFixed(2)}%
- Data quality: ${analysis.data_quality}

Explain the physics principles and sources of error.`;

    const aiResponse = await AIService.generateResponse(prompt, {
      experiment: 'freefall',
      analysis_mode: true
    });

    return {
      summary: `Free fall experiment measured acceleration of ${analysis.acceleration_avg?.toFixed(3)} m/s² with ${analysis.error_percentage?.toFixed(1)}% error`,
      physics_principles: ['Gravitational Acceleration', 'Newton\'s Second Law', 'Kinematic Equations'],
      predictions: [
        {
          parameter: 'Expected Acceleration',
          predicted_value: 9.81,
          confidence: 0.95,
          explanation: 'Standard gravitational acceleration at sea level'
        }
      ],
      recommendations: [
        'Minimize air resistance effects',
        'Ensure proper sensor orientation',
        'Account for local gravitational variations'
      ],
      error_analysis: aiResponse || 'AI analysis temporarily unavailable'
    };
  } catch (error) {
    console.error('AI insights error:', error);
    return {
      summary: `Free fall experiment completed with ${data.length} measurements`,
      physics_principles: ['Gravitational Acceleration'],
      predictions: [],
      recommendations: ['Check sensor calibration', 'Minimize external vibrations'],
      error_analysis: 'AI analysis failed'
    };
  }
}

module.exports = router;