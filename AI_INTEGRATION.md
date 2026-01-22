# AI Assistant Integration with Gemini API

This document explains the AI assistant integration in the Physics Pocket Lab application.

## Features

### 1. Experiment-Specific AI Assistant
- **Overview Explanations**: AI explains what the experiment demonstrates and key concepts
- **Procedure Guidance**: Step-by-step instructions with safety tips and best practices
- **Theory Deep Dives**: Comprehensive theoretical background with formulas and derivations
- **Analysis Help**: Guidance on interpreting results and drawing conclusions

### 2. Interactive Chat Assistant
- **Context-Aware**: Understands which experiment you're working on
- **Two Explanation Modes**: Quick (concise) or Detailed (comprehensive)
- **Physics-Focused**: Only answers physics-related questions
- **Conversation History**: Maintains context throughout the session

### 3. Quiz Explanations
- **Personalized Feedback**: AI explains why answers are correct or incorrect
- **Misconception Addressing**: Identifies and corrects common physics misconceptions
- **Additional Context**: Provides extra examples and real-world applications

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure the Server
1. Open `server/.env` file
2. Replace `your-gemini-api-key-here` with your actual API key:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```
3. Restart the server

### 3. Verify Setup
- Visit `/api/ai/status` endpoint to check if AI is configured
- The server logs will show "AI service is ready" instead of "AI features will be disabled"

## Usage

### In Experiment Pages
1. Navigate to any experiment detail page
2. Click on the "AI Assistant" tab
3. Use quick action buttons for instant explanations:
   - **Overview**: What the experiment demonstrates
   - **Procedure**: Step-by-step guidance
   - **Theory**: Physics concepts and formulas
   - **Analysis**: How to interpret results

### In Virtual Lab
- Each experiment card has an "AI Help" button
- Click to open the AI assistant with experiment context

### Full AI Assistant Page
- Access via navigation menu or experiment links
- Chat freely about physics concepts
- Switch between Quick and Detailed explanation modes
- Ask follow-up questions for deeper understanding

### Quiz Assistance
- After answering quiz questions, click "AI Explanation"
- Get personalized feedback based on your specific answer
- Understand why answers are correct or incorrect

## API Endpoints

### Chat with AI
```
POST /api/ai/chat
{
  "message": "Explain Newton's second law",
  "explanationType": "quick|detailed",
  "experimentId": "optional-experiment-id"
}
```

### Get Experiment Explanation
```
GET /api/ai/experiment/:id/explanation/:type
Types: overview, procedure, theory, analysis
```

### Quiz Explanation
```
POST /api/ai/quiz/explanation
{
  "question": "What is F=ma?",
  "userAnswer": "Force equals mass times acceleration",
  "correctAnswer": "Force equals mass times acceleration",
  "explanation": "Base explanation"
}
```

### Check AI Status
```
GET /api/ai/status
```

## Components

### ExperimentAI
- Embedded AI assistant for experiment pages
- Quick action buttons for different explanation types
- Expandable interface to save space

### ExperimentAIButton
- Simple button to open AI assistant with experiment context
- Used in experiment cards and lists

### AIQuizExplanation
- Provides AI-powered explanations for quiz answers
- Shows both base and personalized explanations
- Visual feedback for correct/incorrect answers

## Error Handling

### No API Key
- Server starts with warning message
- AI endpoints return 500 error with helpful message
- Frontend shows "AI Assistant Unavailable" message

### API Failures
- Graceful fallback messages
- Retry mechanisms where appropriate
- User-friendly error messages

## Best Practices

### For Students
1. **Start with Quick explanations** for basic understanding
2. **Use Detailed mode** when you need comprehensive explanations
3. **Ask specific questions** for better responses
4. **Provide context** about what you're struggling with

### For Educators
1. **Review AI explanations** to ensure accuracy
2. **Encourage students** to ask follow-up questions
3. **Use AI as a supplement**, not replacement for instruction
4. **Monitor usage** to identify common misconceptions

## Limitations

1. **Physics-Only**: AI only answers physics-related questions
2. **Context Dependent**: Works best with specific, clear questions
3. **Not a Calculator**: Won't solve homework problems directly
4. **Requires Internet**: Needs connection to Google's Gemini API

## Troubleshooting

### AI Not Working
1. Check if `GEMINI_API_KEY` is set correctly in `server/.env`
2. Verify API key is valid at Google AI Studio
3. Check server logs for error messages
4. Ensure server has internet connection

### Poor Responses
1. Try rephrasing your question more specifically
2. Provide more context about what you're trying to understand
3. Use the appropriate explanation type (Quick vs Detailed)
4. Break complex questions into smaller parts

### Performance Issues
1. AI responses may take 2-5 seconds to generate
2. Avoid rapid-fire questions
3. Use caching where possible (explanations are cached per experiment)

## Future Enhancements

1. **Voice Integration**: Speech-to-text and text-to-speech
2. **Image Analysis**: AI analysis of experiment diagrams
3. **Adaptive Learning**: Personalized difficulty based on performance
4. **Multi-language Support**: Explanations in different languages
5. **Offline Mode**: Cached responses for common questions