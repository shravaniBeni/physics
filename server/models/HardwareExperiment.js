const mongoose = require('mongoose');

const dataPointSchema = new mongoose.Schema({
  timestamp: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  raw_data: {
    ax: Number,
    ay: Number,
    az: Number
  }
}, { _id: false });

const hardwareExperimentSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true
  },
  experiment_type: {
    type: String,
    required: true,
    enum: ['pendulum', 'freefall']
  },
  device_id: {
    type: String,
    required: true
  },
  device_ip: {
    type: String,
    required: true
  },
  start_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_time: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  data_points: [dataPointSchema],
  analysis: {
    // Pendulum specific
    period: Number,
    frequency: Number,
    amplitude: Number,
    damping_coefficient: Number,
    
    // Free fall specific
    acceleration_avg: Number,
    acceleration_std: Number,
    theoretical_g: { type: Number, default: 9.81 },
    error_percentage: Number,
    
    // Common
    data_quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    noise_level: Number,
    sample_rate: Number
  },
  ai_insights: {
    summary: String,
    physics_principles: [String],
    predictions: [{
      parameter: String,
      predicted_value: Number,
      confidence: Number,
      explanation: String
    }],
    recommendations: [String],
    error_analysis: String
  },
  status: {
    type: String,
    enum: ['recording', 'completed', 'analyzing', 'analyzed'],
    default: 'recording'
  },
  csv_file_path: String,
  graph_image_path: String
}, {
  timestamps: true
});

// Index for efficient queries
hardwareExperimentSchema.index({ user_email: 1, createdAt: -1 });
hardwareExperimentSchema.index({ experiment_type: 1 });
hardwareExperimentSchema.index({ device_id: 1 });

module.exports = mongoose.model('HardwareExperiment', hardwareExperimentSchema);