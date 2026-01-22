const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDLWO4BF2r7dfHYmtiYtRP50FeKpL4Q1H0");

async function testQuizGeneration() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `You are a physics educator creating a quiz for students.

Experiment: Simple Pendulum
Description: Study the motion of a pendulum and measure its period
Category: mechanics
Difficulty Level: intermediate
Key Concepts: periodic motion, gravity, length

Create a quiz with 3 questions that test understanding of this experiment.

Requirements:
- Mix of question types: multiple-choice, true-false, numerical
- Questions should test both conceptual understanding and practical application

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
    "question": "What happens to the period when you double the length of a pendulum?",
    "type": "multiple-choice",
    "options": ["It doubles", "It halves", "It increases by √2", "It stays the same"],
    "correctAnswer": "C",
    "explanation": "Period is proportional to √L, so doubling length increases period by √2",
    "points": 2
  }
]

Make sure the JSON is valid and properly formatted.`;

    console.log('Testing AI quiz generation...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('AI Response:');
    console.log(responseText);
    
    // Try to parse JSON
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const quizData = JSON.parse(jsonMatch[0]);
      console.log('\nParsed Quiz Data:');
      console.log(JSON.stringify(quizData, null, 2));
      console.log('\n✅ Quiz generation successful!');
    } else {
      console.log('❌ No valid JSON found in response');
    }
    
  } catch (error) {
    console.error('❌ Quiz generation failed:', error);
  }
}

testQuizGeneration();