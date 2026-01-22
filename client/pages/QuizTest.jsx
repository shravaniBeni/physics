import React, { useState } from 'react';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from '../Components/ui/button';
import { Card } from '../Components/ui/card';

export default function QuizTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.HEALTH);
      setResult({ type: 'health', data: response });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAIStatus = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.AI.STATUS);
      setResult({ type: 'ai-status', data: response });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testQuizGeneration = async () => {
    setLoading(true);
    try {
      // Use a test experiment ID - you might need to adjust this
      const experimentId = '60f7b3b3b3b3b3b3b3b3b3b3'; // Replace with actual experiment ID
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZ.GET}/${experimentId}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          numQuestions: 3,
          difficulty: 'intermediate',
          questionTypes: ['multiple-choice', 'true-false']
        })
      });
      setResult({ type: 'quiz-generation', data: response });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Quiz System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button onClick={testHealthCheck} disabled={loading} className="bg-blue-600">
            Test Health Check
          </Button>
          <Button onClick={testAIStatus} disabled={loading} className="bg-green-600">
            Test AI Status
          </Button>
          <Button onClick={testQuizGeneration} disabled={loading} className="bg-purple-600">
            Test Quiz Generation
          </Button>
        </div>

        {result && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Result: {result.type}
            </h2>
            <pre className="text-slate-300 text-sm overflow-auto bg-slate-900 p-4 rounded">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Card>
        )}

        <Card className="bg-slate-800 border-slate-700 p-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
          <div className="text-slate-300 space-y-2">
            <p>1. First test the health check to ensure the server is running</p>
            <p>2. Test AI status to verify the AI service is configured</p>
            <p>3. Test quiz generation to see if AI quizzes work</p>
            <p>4. Check the browser console for any additional error messages</p>
          </div>
        </Card>
      </div>
    </div>
  );
}