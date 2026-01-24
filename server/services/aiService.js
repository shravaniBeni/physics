const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      console.warn('⚠️  Gemini API key not configured. AI features will be disabled.');
      this.genAI = null;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use the working gemini-3-flash-preview model
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-3-flash-preview',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
      console.log('✅ AI Service initialized with gemini-3-flash-preview');
    } catch (error) {
      console.warn('⚠️  Failed to initialize AI service:', error.message);
      this.genAI = null;
    }
  }

  isConfigured() {
    return this.genAI !== null;
  }

  async generateContentWithRetry(prompt, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.model.generateContent(prompt);
      } catch (error) {
        console.log(`AI request attempt ${attempt} failed:`, error.message);
        
        // If it's a 503 (Service Unavailable) or rate limit, retry
        if ((error.status === 503 || error.status === 429) && attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        
        // For other errors or final attempt, throw the error
        throw error;
      }
    }
  }

  async generateExperimentExplanation(experiment, type = 'overview') {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const prompts = {
      overview: `You are a physics tutor explaining a lab experiment to students. 

Experiment: ${experiment.title}
Description: ${experiment.description}
Category: ${experiment.category}
Difficulty: ${experiment.difficulty}

Provide a clear, engaging overview of this experiment that includes:
1. What the experiment demonstrates
2. Key physics concepts involved
3. Why this experiment is important
4. What students will learn

Keep it concise (150-200 words) and use simple language appropriate for students.`,

      procedure: `You are a physics tutor guiding students through a lab experiment step by step.

Experiment: ${experiment.title}
Procedure Steps:
${experiment.procedure.map((step, i) => `${i + 1}. ${step.instruction}`).join('\n')}

Materials needed:
${experiment.materials.map(m => `- ${m.name} (${m.quantity})`).join('\n')}

Provide detailed guidance for conducting this experiment safely and effectively. Include:
1. Safety precautions
2. Step-by-step instructions with explanations
3. What to observe at each step
4. Common mistakes to avoid
5. Tips for accurate measurements

Use clear, instructional language.`,

      theory: `You are a physics expert explaining the theoretical background of an experiment.

Experiment: ${experiment.title}
Theory Background: ${experiment.theory.background}
Key Concepts: ${experiment.theory.concepts.join(', ')}
Formulas: ${experiment.theory.formulas.map(f => `${f.name}: ${f.formula}`).join(', ')}

Provide a comprehensive theoretical explanation including:
1. Fundamental physics principles
2. Mathematical derivations where relevant
3. Real-world applications
4. Connection to other physics concepts
5. Historical context if applicable

Make it educational but accessible to students.`,

      analysis: `You are a physics tutor helping students analyze experimental results.

Experiment: ${experiment.title}
Objectives: ${experiment.objectives.join(', ')}

Help students understand how to:
1. Analyze their experimental data
2. Calculate results using relevant formulas
3. Identify sources of error
4. Draw meaningful conclusions
5. Connect results to theory

Provide guidance on data interpretation and scientific reasoning.`
    };

    try {
      const result = await this.generateContentWithRetry(prompts[type] || prompts.overview);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI explanation');
    }
  }

  async answerQuestion(question, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const systemPrompt = `You are a helpful physics tutor for high school and college students. 
You specialize in explaining physics concepts clearly and providing step-by-step solutions.

Guidelines:
- Only answer physics-related questions
- Use clear, well-formatted markdown for better readability
- Use LaTeX notation for mathematical expressions:
  * Wrap inline math in single dollar signs: $F = ma$
  * Wrap display math in double dollar signs: $$F = ma$$
  * Use proper LaTeX syntax for fractions: $\\frac{1}{2}mv^2$
  * Use proper LaTeX for subscripts/superscripts: $v_0$, $x^2$
  * Use \\text{} for units: $g = 9.81 \\, \\text{m/s}^2$
- Provide examples when helpful
- Include relevant formulas with proper LaTeX formatting
- Use headers, bullet points, and formatting to organize information
- If asked about non-physics topics, politely redirect to physics
- Be encouraging and supportive
- NEVER use ** for bold text in math expressions - use proper LaTeX formatting
- For emphasis in regular text, use **bold** or *italic* markdown

Example LaTeX formatting:
- Inline math: The acceleration due to gravity is $g = 9.81 \\, \\text{m/s}^2$
- Display math: $$F = ma$$
- Complex equations: $$x(t) = A \\cos(\\omega t + \\phi)$$
- Fractions: $$KE = \\frac{1}{2}mv^2$$
- Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\omega$, $\\theta$

${context.experiment ? `Current experiment context: ${context.experiment.title} - ${context.experiment.description}` : ''}
${context.explanationType === 'detailed' ? 'Provide a detailed, comprehensive explanation with derivations and multiple examples.' : 'Provide a concise, clear explanation suitable for quick understanding.'}
${context.analysis_mode ? 'This is for data analysis - focus on interpreting experimental results, calculations, and physics insights.' : ''}`;

    const prompt = `${systemPrompt}

Student Question: ${question}

Please provide a helpful response using proper markdown formatting and LaTeX for mathematical expressions:`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI question answering error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateQuizExplanation(question, userAnswer, correctAnswer, explanation) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const prompt = `You are a physics tutor providing feedback on a quiz question.

Question: ${question}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Base Explanation: ${explanation}

Provide personalized feedback that:
1. Explains why the correct answer is right
2. If the student was wrong, explain the misconception
3. Provides additional context or examples
4. Encourages the student

Keep it supportive and educational (100-150 words).`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI quiz explanation error:', error);
      throw new Error('Failed to generate quiz explanation');
    }
  }

  async generateStudyTips(experiment) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const prompt = `You are a physics tutor providing study tips for an experiment.

Experiment: ${experiment.title}
Category: ${experiment.category}
Difficulty: ${experiment.difficulty}
Key Concepts: ${experiment.theory.concepts.join(', ')}

Provide 5-7 practical study tips to help students master this experiment and related concepts. Include:
- How to remember key formulas
- Conceptual understanding tips
- Common exam questions related to this topic
- Practice suggestions
- Memory aids or mnemonics

Format as a numbered list with brief explanations.`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI study tips error:', error);
      throw new Error('Failed to generate study tips');
    }
  }

  async analyzeHardwareExperiment(experimentType, csvData, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    // Handle CSV upload case
    if (experimentType === 'csv_upload' && context.csv_content) {
      const prompt = `You are a physics expert analyzing experimental data from a CSV file upload.

## File Details
- **Filename**: ${context.filename || 'Unknown'}
- **File Content Preview**:
\`\`\`
${context.csv_content}
\`\`\`

## Analysis Request
Please analyze this physics experiment data and provide:

### 1. **Experiment Type Identification**
- Determine what type of physics experiment this appears to be
- Identify the measured quantities and units

### 2. **Data Analysis**
- Statistical analysis of the measurements
- Identify patterns, trends, and anomalies
- Calculate relevant physics parameters

### 3. **Physics Interpretation**
- Explain the underlying physics principles
- Compare with theoretical expectations
- Identify key relationships in the data

### 4. **Quality Assessment**
- Evaluate measurement precision and accuracy
- Identify potential sources of error
- Suggest improvements to experimental technique

### 5. **Educational Insights**
- Key physics concepts demonstrated
- Real-world applications
- Connection to other physics topics

Use proper markdown formatting and LaTeX for mathematical expressions:
- Inline math: $F = ma$
- Display math: $$F = ma$$
- Fractions: $\\frac{1}{2}mv^2$
- Units: $g = 9.81 \\, \\text{m/s}^2$
- Greek letters: $\\omega$, $\\theta$, $\\alpha$
- Subscripts/superscripts: $v_0$, $x^2$
Make the analysis comprehensive and educational.`;

      try {
        const result = await this.generateContentWithRetry(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('AI CSV analysis error:', error);
        throw new Error('Failed to analyze CSV data');
      }
    }

    // Handle live experiment data
    const prompt = `You are a physics expert analyzing experimental data from a hardware physics lab.

## Experiment Details
- **Type**: ${experimentType}
- **Data Points**: ${csvData.length}
- **Duration**: ${csvData.length} seconds
- **Measurement Unit**: ${experimentType === 'pendulum' ? 'degrees (angular displacement)' : 'm/s² (acceleration)'}

## Sample Data
\`\`\`
${csvData.slice(0, 10).map(d => `Time: ${d.time}s, Value: ${d.value}`).join('\n')}
${csvData.length > 10 ? '... (showing first 10 points)' : ''}
\`\`\`

## Analysis Request
Please provide a comprehensive physics analysis using proper markdown formatting and LaTeX for mathematical expressions. Include:

### 1. **Physics Analysis**
${experimentType === 'pendulum' ? 
  '- Calculate the period $T$ and frequency $f = 1/T$\n- Determine amplitude and analyze damping\n- Compare with theoretical pendulum formula: $T = 2\\pi\\sqrt{\\frac{L}{g}}$' :
  '- Analyze acceleration patterns during free fall\n- Compare with theoretical $g = 9.81 \\, \\text{m/s}^2$\n- Calculate average acceleration and standard deviation'
}

### 2. **Data Quality Assessment**
- Statistical analysis (mean, standard deviation, outliers)
- Measurement precision and accuracy
- Signal-to-noise ratio evaluation

### 3. **Theoretical vs Experimental Comparison**
- Expected vs observed values
- Percentage error calculations
- Sources of discrepancy

### 4. **Key Physics Principles**
- Fundamental concepts demonstrated
- Real-world applications
- Connection to other physics topics

### 5. **Recommendations**
- Suggestions for improving experimental setup
- Ways to reduce measurement errors
- Additional experiments to try

Use proper LaTeX formatting for all mathematical expressions and equations:
- Inline math: $F = ma$
- Display math: $$F = ma$$
- Fractions: $\\frac{1}{2}mv^2$
- Units: $g = 9.81 \\, \\text{m/s}^2$
- Greek letters: $\\omega$, $\\theta$, $\\alpha$
- Subscripts/superscripts: $v_0$, $x^2$
Make the analysis educational and detailed for physics students.`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI hardware analysis error:', error);
      throw new Error('Failed to generate hardware experiment analysis');
    }
  }

  async generateQuiz(experiment, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const {
      numQuestions = 5,
      difficulty = experiment.difficulty || 'intermediate',
      questionTypes = ['multiple-choice', 'true-false', 'numerical'],
      focusAreas = []
    } = options;

    const prompt = `You are a physics educator creating a quiz for students.

Experiment: ${experiment.title}
Description: ${experiment.description}
Category: ${experiment.category}
Difficulty Level: ${difficulty}
Key Concepts: ${experiment.theory?.concepts?.join(', ') || 'Physics principles'}
Theory Background: ${experiment.theory?.background || 'Fundamental physics concepts'}

Create a quiz with ${numQuestions} questions that test understanding of this experiment and related physics concepts.

Requirements:
- Mix of question types: ${questionTypes.join(', ')}
- Difficulty appropriate for ${difficulty} level students
- Questions should test both conceptual understanding and practical application
- Include questions about formulas, calculations, and real-world applications
- Each question should have clear, unambiguous answers

For each question, provide:
1. Question text
2. Question type (multiple-choice, true-false, or numerical)
3. For multiple-choice: 4 options (A, B, C, D)
4. Correct answer
5. Brief explanation of why the answer is correct
6. Points (1-3 based on difficulty)

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here",
    "type": "multiple-choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Explanation of correct answer",
    "points": 2
  },
  {
    "question": "True or false question here",
    "type": "true-false",
    "correctAnswer": true,
    "explanation": "Explanation here",
    "points": 1
  },
  {
    "question": "Calculate the value (provide answer to 2 decimal places)",
    "type": "numerical",
    "correctAnswer": 9.81,
    "unit": "m/s²",
    "explanation": "Calculation explanation",
    "points": 3
  }
]

Make sure the JSON is valid and properly formatted.`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const quizData = JSON.parse(jsonMatch[0]);
      
      // Validate the quiz structure
      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error('Invalid quiz format received from AI');
      }
      
      // Validate each question
      quizData.forEach((q, index) => {
        if (!q.question || !q.type || q.correctAnswer === undefined) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        
        if (q.type === 'multiple-choice' && (!q.options || q.options.length !== 4)) {
          throw new Error(`Multiple choice question at index ${index} must have exactly 4 options`);
        }
      });
      
      return quizData;
    } catch (error) {
      console.error('AI quiz generation error:', error);
      throw new Error('Failed to generate quiz: ' + error.message);
    }
  }

  async generateAdaptiveQuiz(experiment, userPerformance = {}) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const {
      previousScores = [],
      weakAreas = [],
      strongAreas = [],
      preferredDifficulty = 'intermediate'
    } = userPerformance;

    const avgScore = previousScores.length > 0 
      ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length 
      : 70;

    // Adjust difficulty based on performance
    let adaptiveDifficulty = preferredDifficulty;
    if (avgScore > 85) adaptiveDifficulty = 'advanced';
    else if (avgScore < 60) adaptiveDifficulty = 'beginner';

    const prompt = `You are an adaptive learning AI creating a personalized quiz.

Experiment: ${experiment.title}
Category: ${experiment.category}
Student Performance Data:
- Average Score: ${avgScore.toFixed(1)}%
- Weak Areas: ${weakAreas.join(', ') || 'None identified'}
- Strong Areas: ${strongAreas.join(', ') || 'None identified'}
- Adaptive Difficulty: ${adaptiveDifficulty}

Create a 6-question adaptive quiz that:
1. Focuses more on weak areas if any are identified
2. Includes 1-2 challenging questions in strong areas
3. Adjusts difficulty based on past performance
4. Provides a good learning progression

${weakAreas.length > 0 ? `Pay special attention to these weak areas: ${weakAreas.join(', ')}` : ''}

Use the same JSON format as before with questions that help the student improve in their weak areas while maintaining their strengths.`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const quizData = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error('Invalid adaptive quiz format received from AI');
      }
      
      return quizData;
    } catch (error) {
      console.error('AI adaptive quiz generation error:', error);
      throw new Error('Failed to generate adaptive quiz: ' + error.message);
    }
  }
}

module.exports = new AIService();