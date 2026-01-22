const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDLWO4BF2r7dfHYmtiYtRP50FeKpL4Q1H0");

async function testGemini3Flash() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = "Hello! Can you tell me a short joke?";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Response:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

testGemini3Flash();