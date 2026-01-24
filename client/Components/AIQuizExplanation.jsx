import React, { useState } from 'react';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Bot, Loader2, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '../lib/utils';

export default function AIQuizExplanation({ 
  question, 
  userAnswer, 
  correctAnswer, 
  baseExplanation = '',
  isVisible = false,
  onToggle 
}) {
  const [aiExplanation, setAiExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const isCorrect = userAnswer === correctAnswer;

  const generateExplanation = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.AI.QUIZ_EXPLANATION, {
        method: 'POST',
        body: JSON.stringify({
          question,
          userAnswer,
          correctAnswer,
          explanation: baseExplanation
        })
      });
      
      setAiExplanation(response.explanation);
      setHasGenerated(true);
    } catch (error) {
      console.error('Failed to generate AI explanation:', error);
      setAiExplanation('Sorry, I couldn\'t generate a personalized explanation right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-slate-800/30 border-slate-700 mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isCorrect ? "bg-emerald-500/20" : "bg-rose-500/20"
            )}>
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {isCorrect ? 'Correct!' : 'Not quite right'}
              </h3>
              <p className="text-sm text-slate-400">
                {isCorrect ? 'Great job!' : `The correct answer is: ${correctAnswer}`}
              </p>
            </div>
          </div>
          
          {!hasGenerated && (
            <Button
              onClick={generateExplanation}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              AI Explanation
            </Button>
          )}
        </div>

        {/* Base explanation */}
        {baseExplanation && (
          <div className="mb-4">
            <Badge className="bg-slate-700 text-slate-300 mb-2">
              <Lightbulb className="w-3 h-3 mr-1" />
              Quick Explanation
            </Badge>
            <p className="text-slate-300 text-sm">{baseExplanation}</p>
          </div>
        )}

        {/* AI-generated explanation */}
        {(hasGenerated || loading) && (
          <div>
            <Badge className="bg-cyan-500/20 text-cyan-400 mb-3">
              <Bot className="w-3 h-3 mr-1" />
              AI Personalized Explanation
            </Badge>
            
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating personalized explanation...</span>
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-200">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 text-slate-200">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 text-slate-200">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ inline, children }) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-sm">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto mb-2">
                            <code className="text-cyan-400 font-mono text-sm">{children}</code>
                          </pre>
                        ),
                      strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>,
                      em: ({ children }) => <em className="text-purple-400 italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-medium text-white mb-1">{children}</h3>,
                      // Math components for KaTeX
                      span: ({ className, children, ...props }) => {
                        if (className?.includes('math')) {
                          return <span className={`${className} text-cyan-300`} {...props}>{children}</span>;
                        }
                        return <span className={className} {...props}>{children}</span>;
                      },
                      div: ({ className, children, ...props }) => {
                        if (className?.includes('math')) {
                          return <div className={`${className} text-center my-2 text-cyan-300`} {...props}>{children}</div>;
                        }
                        return <div className={className} {...props}>{children}</div>;
                      }
                    }}
                  >
                    {aiExplanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}