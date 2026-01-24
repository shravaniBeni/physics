const mongoose = require('mongoose');
const HardwareExperiment = require('./models/HardwareExperiment');
const AIService = require('./services/aiService');

// Test hardware experiment analysis
async function testHardwareAnalysis() {
  try {
    console.log('🧪 Testing Hardware Experiment Analysis...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/physics_learning');
    console.log('✅ Connected to MongoDB');

    // Create test pendulum data
    const pendulumData = [];
    const startTime = Date.now();
    
    // Generate realistic pendulum data (damped oscillation)
    for (let i = 0; i < 100; i++) {
      const t = i * 0.1; // 0.1 second intervals
      const amplitude = 15 * Math.exp(-0.05 * t); // Damped amplitude
      const angle = amplitude * Math.sin(2 * Math.PI * 0.5 * t); // 0.5 Hz frequency
      const noise = (Math.random() - 0.5) * 0.5; // Small noise
      
      pendulumData.push({
        timestamp: startTime + (t * 1000),
        value: angle + noise,
        raw_data: {
          ax: Math.sin(angle * Math.PI / 180) * 0.3,
          ay: 0.1 * (Math.random() - 0.5),
          az: Math.cos(angle * Math.PI / 180) * 0.9
        }
      });
    }

    // Create test experiment
    const experiment = new HardwareExperiment({
      user_email: 'test@example.com',
      experiment_type: 'pendulum',
      device_id: 'test_esp32',
      device_ip: '192.168.1.100',
      data_points: pendulumData,
      end_time: new Date(),
      duration: 10.0,
      status: 'analyzing'
    });

    await experiment.save();
    console.log('✅ Created test pendulum experiment');

    // Test analysis functions
    const values = pendulumData.map(p => p.value);
    const timestamps = pendulumData.map(p => p.timestamp);

    // Analyze pendulum data
    const analysis = analyzePendulumData(values, timestamps);
    console.log('\n📊 Pendulum Analysis Results:');
    console.log(`- Period: ${analysis.period?.toFixed(3)} seconds`);
    console.log(`- Frequency: ${analysis.frequency?.toFixed(3)} Hz`);
    console.log(`- Amplitude: ${analysis.amplitude?.toFixed(2)} degrees`);
    console.log(`- Damping: ${analysis.damping_coefficient?.toFixed(4)}`);
    console.log(`- Data Quality: ${analysis.data_quality}`);

    // Test AI insights
    console.log('\n🤖 Testing AI Insights...');
    const aiInsights = await generatePendulumInsights(analysis, values);
    console.log(`- Summary: ${aiInsights.summary}`);
    console.log(`- Physics Principles: ${aiInsights.physics_principles.join(', ')}`);
    console.log(`- Recommendations: ${aiInsights.recommendations.length} suggestions`);

    // Update experiment with analysis
    experiment.analysis = analysis;
    experiment.ai_insights = aiInsights;
    experiment.status = 'analyzed';
    await experiment.save();

    console.log('\n✅ Hardware experiment analysis completed successfully!');
    console.log('\n🎯 Test Results:');
    console.log(`- Experiment ID: ${experiment._id}`);
    console.log(`- Data Points: ${experiment.data_points.length}`);
    console.log(`- Analysis Status: ${experiment.status}`);
    console.log(`- AI Summary: ${aiInsights.summary}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Pendulum analysis function (copied from routes)
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
    periods.push((zeroCrossings[i] - zeroCrossings[i-2]) / 1000);
  }

  const avgPeriod = periods.length > 0 ? periods.reduce((a, b) => a + b) / periods.length : 0;
  const frequency = avgPeriod > 0 ? 1 / avgPeriod : 0;
  
  const amplitude = Math.max(...angles.map(Math.abs));
  
  const firstHalf = angles.slice(0, Math.floor(angles.length / 2));
  const secondHalf = angles.slice(Math.floor(angles.length / 2));
  const firstAmplitude = Math.max(...firstHalf.map(Math.abs));
  const secondAmplitude = Math.max(...secondHalf.map(Math.abs));
  const dampingCoefficient = firstAmplitude > 0 ? (firstAmplitude - secondAmplitude) / firstAmplitude : 0;

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

function calculateNoise(data) {
  if (data.length < 2) return 0;
  
  let totalVariation = 0;
  for (let i = 1; i < data.length; i++) {
    totalVariation += Math.abs(data[i] - data[i-1]);
  }
  
  return totalVariation / (data.length - 1);
}

async function generatePendulumInsights(analysis, data) {
  try {
    const prompt = `Analyze this pendulum experiment data:
- Period: ${analysis.period?.toFixed(3)} seconds
- Frequency: ${analysis.frequency?.toFixed(3)} Hz
- Amplitude: ${analysis.amplitude?.toFixed(2)} degrees
- Damping coefficient: ${analysis.damping_coefficient?.toFixed(4)}
- Data quality: ${analysis.data_quality}

Provide brief insights about the physics principles demonstrated.`;

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
          predicted_value: 2 * Math.PI * Math.sqrt(1 / 9.81),
          confidence: 0.85,
          explanation: 'Based on T = 2π√(L/g) for small angle approximation'
        }
      ],
      recommendations: [
        'Ensure small angle approximation (< 15°) for accurate results',
        'Minimize air resistance and friction',
        'Use higher sampling rate for better precision'
      ],
      error_analysis: aiResponse || 'AI analysis completed successfully'
    };
  } catch (error) {
    console.error('AI insights error:', error);
    return {
      summary: `Pendulum experiment completed with ${data.length} data points`,
      physics_principles: ['Simple Harmonic Motion'],
      predictions: [],
      recommendations: ['Check sensor calibration', 'Ensure stable mounting'],
      error_analysis: 'AI analysis temporarily unavailable'
    };
  }
}

// Run the test
testHardwareAnalysis();