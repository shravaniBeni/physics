const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const aiService = require('../services/aiService');
const Experiment = require('../models/Experiment');
const { auth, optionalAuth } = require('../middleware/auth');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && id !== 'undefined' && id !== 'null';
};

// Chat with AI assistant
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, explanationType = 'quick', experimentId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get experiment context if provided
    let context = { explanationType };
    if (experimentId && isValidObjectId(experimentId)) {
      try {
        const experiment = await Experiment.findById(experimentId);
        if (experiment) {
          context.experiment = experiment;
        }
      } catch (error) {
        console.error('Error fetching experiment for context:', error);
        // Continue without experiment context
      }
    }

    const response = await aiService.answerQuestion(message, context);

    res.json({
      response,
      context: context.experiment ? {
        experimentId: context.experiment._id,
        experimentTitle: context.experiment.title
      } : null
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    // Provide enhanced fallback response when AI is not available
    let fallbackResponse;
    
    // Check if context exists and has experiment
    const hasExperiment = typeof context !== 'undefined' && context.experiment;
    
    if (hasExperiment) {
      fallbackResponse = `I'd be happy to help you with the **${context.experiment.title}** experiment! 

While my AI features are currently unavailable, here are some helpful resources:

**Quick Facts:**
• Category: ${context.experiment.category}
• Difficulty: ${context.experiment.difficulty}
• Duration: ~${context.experiment.estimatedTime} minutes

**Key Objectives:**
${context.experiment.objectives?.slice(0, 3).map(obj => `• ${obj}`).join('\n') || '• Understand fundamental physics principles'}

**Need help with specific topics?** Try asking about:
• The theory behind this experiment
• Step-by-step procedure
• How to analyze your results
• Common physics formulas used

Feel free to ask specific questions about physics concepts!`;
    } else {
      fallbackResponse = `I'm here to help with physics questions! 

While my AI features are currently unavailable, I can suggest:

**Popular Topics:**
• Newton's Laws of Motion
• Ohm's Law and Electrical Circuits
• Wave Properties and Behavior
• Optics and Light
• Thermodynamics

**How to get help:**
• Browse the experiment materials and theory sections
• Check the procedure steps for guidance
• Review the key formulas and concepts
• Ask specific questions about physics principles

What physics topic would you like to explore?`;
    }
    
    res.json({
      response: fallbackResponse,
      context: hasExperiment ? {
        experimentId: context.experiment._id,
        experimentTitle: context.experiment.title
      } : null,
      isAIGenerated: false,
      message: 'Enhanced fallback response (AI temporarily unavailable)'
    });
  }
});

// Get experiment explanation
router.get('/experiment/:id/explanation/:type', optionalAuth, async (req, res) => {
  try {
    const { id, type } = req.params;
    
    // Validate experiment ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: 'Invalid experiment ID format',
        received: id
      });
    }
    
    const validTypes = ['overview', 'procedure', 'theory', 'analysis'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid explanation type',
        validTypes 
      });
    }

    const experiment = await Experiment.findById(id);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Try AI generation first, fall back to static content
    let explanation;
    let isAIGenerated = true;
    
    try {
      explanation = await aiService.generateExperimentExplanation(experiment, type);
    } catch (aiError) {
      console.log('AI not available, using enhanced fallback explanation');
      isAIGenerated = false;
      
      // Enhanced fallback explanations based on experiment data
      const fallbackExplanations = {
        overview: `
**${experiment.title}** is a ${experiment.difficulty} level experiment in ${experiment.category} that takes approximately ${experiment.estimatedTime} minutes to complete.

**What you'll learn:**
${experiment.objectives.map(obj => `• ${obj}`).join('\n')}

**Key concepts:** ${experiment.theory?.concepts?.join(', ') || 'Fundamental physics principles'}

This hands-on experiment helps you understand ${experiment.category} through interactive simulation and real-world applications.
        `,
        
        procedure: `
**Step-by-Step Procedure for ${experiment.title}:**

${experiment.procedure.map((step, i) => `
**Step ${step.step || i + 1}:** ${step.instruction}
${step.notes ? `💡 *Tip: ${step.notes}*` : ''}
`).join('\n')}

**Materials needed:**
${experiment.materials.map(material => `• ${material.name} (${material.quantity})${material.optional ? ' - Optional' : ''}`).join('\n')}

**Safety reminders:**
• Follow all safety protocols
• Handle equipment carefully
• Record observations systematically
        `,
        
        theory: `
**Theoretical Background: ${experiment.title}**

${experiment.theory?.background || 'This experiment demonstrates fundamental physics principles.'}

**Key Concepts:**
${experiment.theory?.concepts?.map(concept => `• **${concept}**: Important principle in ${experiment.category}`).join('\n') || '• Fundamental physics principles'}

**Important Formulas:**
${experiment.theory?.formulas?.map(formula => `
**${formula.name}:** \`${formula.formula}\`
${formula.variables?.map(v => `• ${v.symbol} = ${v.description} (${v.unit})`).join('\n') || ''}
`).join('\n') || 'Key formulas will be introduced during the experiment.'}

**Applications:**
This experiment has real-world applications in engineering, technology, and scientific research.
        `,
        
        analysis: `
**Data Analysis for ${experiment.title}:**

**What to measure:**
• Record all observations systematically
• Take multiple readings for accuracy
• Note any unusual patterns or behaviors

**Calculations:**
${experiment.theory?.formulas?.map(formula => `• Use ${formula.name}: ${formula.formula}`).join('\n') || '• Apply relevant physics formulas'}

**Error analysis:**
• Identify potential sources of measurement error
• Calculate percentage uncertainties where applicable
• Compare experimental results with theoretical predictions

**Drawing conclusions:**
• Analyze trends in your data
• Explain any deviations from expected results
• Connect your findings to the underlying physics principles

**Questions to consider:**
• How do your results compare to theoretical values?
• What factors might affect the accuracy of your measurements?
• How could this experiment be improved or extended?
        `
      };
      
      explanation = fallbackExplanations[type] || fallbackExplanations.overview;
    }

    res.json({
      explanation,
      type,
      experiment: {
        id: experiment._id,
        title: experiment.title,
        category: experiment.category
      },
      isAIGenerated,
      message: isAIGenerated ? 'AI-generated explanation' : 'Fallback explanation (AI not available)'
    });
  } catch (error) {
    console.error('Experiment explanation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate explanation',
      error: error.message 
    });
  }
});

// Get quiz question explanation
router.post('/quiz/explanation', optionalAuth, async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer, explanation } = req.body;

    if (!question || userAnswer === undefined || !correctAnswer) {
      return res.status(400).json({ 
        message: 'Question, user answer, and correct answer are required' 
      });
    }

    const aiExplanation = await aiService.generateQuizExplanation(
      question, 
      userAnswer, 
      correctAnswer, 
      explanation || ''
    );

    res.json({
      explanation: aiExplanation,
      isCorrect: userAnswer === correctAnswer
    });
  } catch (error) {
    console.error('AI quiz explanation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate quiz explanation',
      error: error.message 
    });
  }
});

// Get study tips for experiment
router.get('/experiment/:id/study-tips', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate experiment ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: 'Invalid experiment ID format',
        received: id
      });
    }

    const experiment = await Experiment.findById(id);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const studyTips = await aiService.generateStudyTips(experiment);

    res.json({
      studyTips,
      experiment: {
        id: experiment._id,
        title: experiment.title,
        category: experiment.category,
        difficulty: experiment.difficulty
      }
    });
  } catch (error) {
    console.error('AI study tips error:', error);
    res.status(500).json({ 
      message: 'Failed to generate study tips',
      error: error.message 
    });
  }
});

// Analyze hardware experiment data
router.post('/analyze-experiment', optionalAuth, async (req, res) => {
  try {
    const { experiment_type, data_points, device_info } = req.body;

    if (!experiment_type || !data_points || !Array.isArray(data_points)) {
      return res.status(400).json({ 
        message: 'experiment_type and data_points array are required' 
      });
    }

    if (data_points.length === 0) {
      return res.status(400).json({ 
        message: 'No data points provided for analysis' 
      });
    }

    // Analyze the data based on experiment type
    let analysis = {};
    let aiInsights = {};

    try {
      if (experiment_type === 'pendulum') {
        analysis = analyzePendulumData(data_points);
        aiInsights = await generatePendulumAIInsights(analysis, data_points);
      } else if (experiment_type === 'freefall') {
        analysis = analyzeFreefallData(data_points);
        aiInsights = await generateFreefallAIInsights(analysis, data_points);
      } else {
        return res.status(400).json({ 
          message: 'Unsupported experiment type. Supported: pendulum, freefall' 
        });
      }

      // Combine analysis with AI insights
      const result = {
        experiment_type,
        data_summary: {
          total_points: data_points.length,
          duration: data_points.length > 1 ? 
            (data_points[data_points.length - 1].time - data_points[0].time).toFixed(2) + 's' : '0s',
          sample_rate: data_points.length > 1 ? 
            (data_points.length / (data_points[data_points.length - 1].time - data_points[0].time)).toFixed(1) + ' Hz' : '0 Hz'
        },
        analysis,
        ...aiInsights,
        device_info,
        analyzed_at: new Date().toISOString()
      };

      res.json(result);
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      
      // Provide fallback analysis without AI
      const fallbackResult = {
        experiment_type,
        data_summary: {
          total_points: data_points.length,
          duration: data_points.length > 1 ? 
            (data_points[data_points.length - 1].time - data_points[0].time).toFixed(2) + 's' : '0s'
        },
        summary: `${experiment_type} experiment completed with ${data_points.length} data points`,
        measurements: analysis,
        physics_principles: experiment_type === 'pendulum' ? 
          ['Simple Harmonic Motion', 'Gravitational Restoring Force'] : 
          ['Gravitational Acceleration', 'Newton\'s Second Law'],
        recommendations: [
          'Check sensor calibration',
          'Minimize external vibrations',
          'Ensure proper experimental setup'
        ],
        error_analysis: 'AI analysis temporarily unavailable - showing basic statistical analysis',
        isAIGenerated: false
      };

      res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Experiment analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze experiment data',
      error: error.message 
    });
  }
});

// Helper function to analyze pendulum data
function analyzePendulumData(dataPoints) {
  const values = dataPoints.map(p => p.value);
  const times = dataPoints.map(p => p.time);
  
  // Calculate basic statistics
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate amplitude (max absolute value)
  const amplitude = Math.max(...values.map(Math.abs));
  
  // Estimate period using zero crossings
  const zeroCrossings = [];
  for (let i = 1; i < values.length; i++) {
    if ((values[i-1] >= 0 && values[i] < 0) || (values[i-1] < 0 && values[i] >= 0)) {
      zeroCrossings.push(times[i]);
    }
  }
  
  let period = 0;
  if (zeroCrossings.length >= 4) {
    const periods = [];
    for (let i = 2; i < zeroCrossings.length; i += 2) {
      periods.push(zeroCrossings[i] - zeroCrossings[i-2]);
    }
    period = periods.reduce((a, b) => a + b, 0) / periods.length;
  }
  
  const frequency = period > 0 ? 1 / period : 0;
  
  return {
    mean_angle: mean.toFixed(3) + '°',
    amplitude: amplitude.toFixed(3) + '°',
    period: period.toFixed(3) + 's',
    frequency: frequency.toFixed(3) + ' Hz',
    standard_deviation: stdDev.toFixed(3) + '°',
    data_quality: stdDev < 1 ? 'excellent' : stdDev < 2 ? 'good' : 'fair'
  };
}

// Helper function to analyze freefall data
function analyzeFreefallData(dataPoints) {
  const values = dataPoints.map(p => p.value);
  
  // Calculate basic statistics
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate error from theoretical g
  const theoreticalG = 9.81;
  const errorPercent = Math.abs((mean - theoreticalG) / theoreticalG) * 100;
  
  return {
    measured_acceleration: mean.toFixed(3) + ' m/s²',
    theoretical_g: theoreticalG + ' m/s²',
    error_percentage: errorPercent.toFixed(2) + '%',
    standard_deviation: stdDev.toFixed(3) + ' m/s²',
    data_quality: errorPercent < 5 ? 'excellent' : errorPercent < 10 ? 'good' : 'fair'
  };
}

// Generate AI insights for pendulum
async function generatePendulumAIInsights(analysis, dataPoints) {
  try {
    const prompt = `Analyze this pendulum experiment data:
- Amplitude: ${analysis.amplitude}
- Period: ${analysis.period}
- Frequency: ${analysis.frequency}
- Data quality: ${analysis.data_quality}
- Total data points: ${dataPoints.length}

Provide physics insights, theoretical predictions, and recommendations for improvement.`;

    const aiResponse = await aiService.answerQuestion(prompt, {
      experiment: 'pendulum_analysis',
      explanationType: 'detailed'
    });

    return {
      summary: `Pendulum experiment shows ${analysis.amplitude} amplitude with ${analysis.period} period`,
      physics_principles: [
        'Simple Harmonic Motion',
        'Gravitational Restoring Force', 
        'Energy Conservation',
        'Damping Effects'
      ],
      predictions: [
        {
          parameter: 'Theoretical Period',
          formula: 'T = 2π√(L/g)',
          explanation: 'For small angle approximation'
        }
      ],
      recommendations: [
        'Ensure small angle approximation (< 15°)',
        'Minimize air resistance and friction',
        'Use consistent release technique',
        'Check for systematic errors in timing'
      ],
      error_analysis: aiResponse || 'Pendulum motion follows expected harmonic patterns'
    };
  } catch (error) {
    console.error('Pendulum AI insights error:', error);
    return {
      summary: `Pendulum experiment completed with ${dataPoints.length} measurements`,
      physics_principles: ['Simple Harmonic Motion'],
      recommendations: ['Check experimental setup', 'Minimize external disturbances'],
      error_analysis: 'AI analysis failed - showing basic analysis'
    };
  }
}

// Generate AI insights for freefall
async function generateFreefallAIInsights(analysis, dataPoints) {
  try {
    const prompt = `Analyze this free fall experiment data:
- Measured acceleration: ${analysis.measured_acceleration}
- Theoretical g: ${analysis.theoretical_g}
- Error: ${analysis.error_percentage}
- Data quality: ${analysis.data_quality}
- Total measurements: ${dataPoints.length}

Explain the physics principles and sources of measurement error.`;

    const aiResponse = await aiService.answerQuestion(prompt, {
      experiment: 'freefall_analysis',
      explanationType: 'detailed'
    });

    return {
      summary: `Free fall experiment measured ${analysis.measured_acceleration} with ${analysis.error_percentage} error`,
      physics_principles: [
        'Gravitational Acceleration',
        'Newton\'s Second Law',
        'Kinematic Equations',
        'Air Resistance Effects'
      ],
      predictions: [
        {
          parameter: 'Expected Acceleration',
          value: '9.81 m/s²',
          explanation: 'Standard gravitational acceleration at sea level'
        }
      ],
      recommendations: [
        'Minimize air resistance effects',
        'Ensure proper sensor orientation',
        'Account for local gravitational variations',
        'Check sensor calibration'
      ],
      error_analysis: aiResponse || 'Acceleration measurements show expected gravitational effects'
    };
  } catch (error) {
    console.error('Freefall AI insights error:', error);
    return {
      summary: `Free fall experiment completed with ${dataPoints.length} measurements`,
      physics_principles: ['Gravitational Acceleration'],
      recommendations: ['Check sensor calibration', 'Minimize vibrations'],
      error_analysis: 'AI analysis failed - showing basic analysis'
    };
  }
}

// Analyze hardware experiment data with enhanced formatting
router.post('/analyze-hardware', optionalAuth, async (req, res) => {
  try {
    const { experimentType, csvData, context = {} } = req.body;

    if (!experimentType || !csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ 
        message: 'experimentType and csvData array are required' 
      });
    }

    if (csvData.length === 0) {
      return res.status(400).json({ 
        message: 'No data points provided for analysis' 
      });
    }

    // Use the specialized hardware analysis method
    const response = await aiService.analyzeHardwareExperiment(experimentType, csvData, context);

    res.json({
      response,
      experimentType,
      dataPoints: csvData.length,
      context,
      isAIGenerated: true,
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hardware analysis error:', error);
    
    // Provide enhanced fallback analysis
    const fallbackAnalysis = generateFallbackHardwareAnalysis(experimentType, csvData);
    
    res.json({
      response: fallbackAnalysis,
      experimentType,
      dataPoints: csvData.length,
      context,
      isAIGenerated: false,
      message: 'AI temporarily unavailable - showing enhanced fallback analysis',
      analyzed_at: new Date().toISOString()
    });
  }
});

// Helper function for fallback hardware analysis
function generateFallbackHardwareAnalysis(experimentType, csvData) {
  const values = csvData.map(d => parseFloat(d.value));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
  const amplitude = Math.max(...values.map(Math.abs));
  
  if (experimentType === 'pendulum') {
    return `# 🎯 Pendulum Experiment Analysis

## 📊 Data Summary
- **Total Data Points**: ${csvData.length}
- **Duration**: ${csvData.length} seconds
- **Mean Angle**: ${mean.toFixed(3)}°
- **Amplitude**: ${amplitude.toFixed(3)}°
- **Standard Deviation**: ${stdDev.toFixed(3)}°

## 🔬 Physics Analysis
### Simple Harmonic Motion
The pendulum demonstrates **simple harmonic motion** for small angles (< 15°).

**Key Formula**: $T = 2\\pi\\sqrt{\\frac{L}{g}}$

Where:
- $T$ = Period (seconds)
- $L$ = Length of pendulum (meters)  
- $g$ = Gravitational acceleration (9.81 m/s²)

### Observed Behavior
- **Amplitude**: ${amplitude.toFixed(3)}° indicates the maximum displacement
- **Data Quality**: ${stdDev < 1 ? 'Excellent' : stdDev < 2 ? 'Good' : 'Fair'} (σ = ${stdDev.toFixed(3)}°)

## 📈 Recommendations
1. **Minimize Air Resistance**: Use a dense bob in a controlled environment
2. **Small Angle Approximation**: Keep initial displacement < 15° for accurate results
3. **Consistent Release**: Ensure smooth, consistent release technique
4. **Timing Accuracy**: Use high-precision timing methods

## 🎓 Educational Value
This experiment demonstrates fundamental concepts in:
- Periodic motion and oscillations
- Energy conservation (kinetic ↔ potential)
- Gravitational effects on motion
- Measurement precision and error analysis`;
  } else {
    const errorPercent = Math.abs((mean - 9.81) / 9.81) * 100;
    return `# ⚡ Free Fall Experiment Analysis

## 📊 Data Summary
- **Total Data Points**: ${csvData.length}
- **Duration**: ${csvData.length} seconds
- **Measured Acceleration**: ${mean.toFixed(3)} m/s²
- **Theoretical g**: 9.81 m/s²
- **Error**: ${errorPercent.toFixed(2)}%
- **Standard Deviation**: ${stdDev.toFixed(3)} m/s²

## 🔬 Physics Analysis
### Gravitational Acceleration
Free fall motion demonstrates **constant acceleration** due to gravity.

**Newton's Second Law**: $F = ma$
**Gravitational Force**: $F = mg$
**Therefore**: $a = g = 9.81 \\, \\text{m/s}^2$

### Experimental Results
- **Measured Value**: ${mean.toFixed(3)} m/s²
- **Accuracy**: ${errorPercent < 5 ? 'Excellent' : errorPercent < 10 ? 'Good' : 'Fair'} (${errorPercent.toFixed(2)}% error)
- **Precision**: σ = ${stdDev.toFixed(3)} m/s²

## 📈 Error Sources & Recommendations
1. **Air Resistance**: Affects acceleration at higher velocities
2. **Sensor Calibration**: Ensure MPU6050 is properly calibrated
3. **Vibrations**: Minimize external disturbances
4. **Orientation**: Ensure sensor axis aligns with gravity

## 🎓 Educational Value
This experiment demonstrates:
- Universal gravitational acceleration
- Newton's laws of motion
- Kinematic equations of motion
- Experimental measurement techniques
- Error analysis and data interpretation`;
  }
}

// Check AI service status
router.get('/status', (req, res) => {
  res.json({
    configured: aiService.isConfigured(),
    message: aiService.isConfigured() 
      ? 'AI service is ready' 
      : 'AI service not configured - please set GEMINI_API_KEY'
  });
});

module.exports = router;