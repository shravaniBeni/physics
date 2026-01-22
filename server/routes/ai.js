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