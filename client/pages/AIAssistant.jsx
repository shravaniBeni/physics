import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from '../Components/ui/button';
import { Input } from '../Components/ui/input';
import { Badge } from '../Components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  BookOpen,
  Loader2,
  Lightbulb,
  AlertCircle,
  Beaker,
  Brain,
  Target,
  MessageSquare,
  Settings,
  Menu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

const suggestedQuestions = [
  "What is Newton's second law of motion?",
  "Explain Ohm's law with an example",
  "How does a convex lens form images?",
  "What is the relationship between frequency and wavelength?",
  "Derive the formula for time period of a simple pendulum"
];

export default function AIAssistant({ experimentId = null, experimentTitle = null }) {
  const [message, setMessage] = useState('');
  const [explanationType, setExplanationType] = useState('quick');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useAuth();

  // Get experiment context from URL if not provided as props
  const urlParams = new URLSearchParams(window.location.search);
  const urlExperimentId = urlParams.get('experiment');
  const urlExperimentTitle = urlParams.get('title');
  
  const currentExperimentId = experimentId || urlExperimentId;
  const currentExperimentTitle = experimentTitle || urlExperimentTitle;

  // Check AI service status on mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const status = await apiRequest(API_CONFIG.ENDPOINTS.AI.STATUS);
      setAiStatus(status);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ configured: false, message: 'AI service unavailable' });
    }
  };

  // Load chat history (simplified for now)
  useEffect(() => {
    if (currentExperimentId && currentExperimentTitle) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm here to help you with the **${currentExperimentTitle}** experiment. You can ask me about the theory, procedure, analysis, or any physics concepts related to this experiment. What would you like to know?`,
        type: 'quick',
        isWelcome: true
      }]);
    }
  }, [currentExperimentId, currentExperimentTitle]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || isTyping) return;
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, type: explanationType }]);
    setIsTyping(true);

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.AI.CHAT, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          explanationType,
          experimentId: currentExperimentId
        })
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response, 
        type: explanationType,
        context: response.context
      }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting right now. Please try again.", 
        type: explanationType,
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(message);
    setMessage('');
  };

  const handleSuggestedQuestion = (question) => {
    setMessage(question);
  };

  const getExperimentExplanation = async (type) => {
    if (!currentExperimentId) return;
    
    setIsTyping(true);
    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.AI.EXPERIMENT_EXPLANATION}/${currentExperimentId}/explanation/${type}`);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.explanation,
        type: 'detailed',
        explanationType: type,
        isExperimentExplanation: true
      }]);
    } catch (error) {
      console.error('Failed to get experiment explanation:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't generate the ${type} explanation right now. Please try again.`,
        type: 'quick',
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (aiStatus && !aiStatus.configured) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">AI Assistant Unavailable</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">{aiStatus.message}</p>
          <Button onClick={checkAiStatus} variant="outline" className="px-6 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Header - Similar to ChatGPT */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Physics AI Assistant</h1>
              {currentExperimentTitle && (
                <p className="text-xs text-slate-400">{currentExperimentTitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Settings Button with Quick/Detailed Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-slate-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                  <p className="text-xs text-slate-400 mb-2 font-medium">Response Style</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setExplanationType('quick');
                        setShowSettings(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                        explanationType === 'quick'
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      )}
                    >
                      <Zap className="w-4 h-4" />
                      Quick & Concise
                    </button>
                    <button
                      onClick={() => {
                        setExplanationType('detailed');
                        setShowSettings(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                        explanationType === 'detailed'
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      )}
                    >
                      <BookOpen className="w-4 h-4" />
                      Detailed & Deep
                    </button>
                  </div>
                  
                  {/* Experiment Quick Actions in Settings */}
                  {currentExperimentId && (
                    <>
                      <hr className="border-slate-700 my-3" />
                      <p className="text-xs text-slate-400 mb-2 font-medium">Experiment Help</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            getExperimentExplanation('overview');
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-all"
                        >
                          <Beaker className="w-4 h-4" />
                          Overview
                        </button>
                        <button
                          onClick={() => {
                            getExperimentExplanation('procedure');
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-purple-400 hover:bg-slate-700/50 transition-all"
                        >
                          <Target className="w-4 h-4" />
                          Procedure
                        </button>
                        <button
                          onClick={() => {
                            getExperimentExplanation('theory');
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-all"
                        >
                          <Brain className="w-4 h-4" />
                          Theory
                        </button>
                        <button
                          onClick={() => {
                            getExperimentExplanation('analysis');
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-green-400 hover:bg-slate-700/50 transition-all"
                        >
                          <BookOpen className="w-4 h-4" />
                          Analysis
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area - Full Screen Scrollable */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">How can I help you today?</h2>
              <p className="text-slate-400 text-center max-w-2xl mb-8 text-lg leading-relaxed">
                I can explain physics concepts, derive formulas, solve problems, and help you understand experiments with clear, step-by-step explanations.
              </p>

              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <p className="text-slate-500 font-medium">Try asking these questions:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-700/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-sm leading-relaxed">{q}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-32">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-4 group">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {msg.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">
                        {msg.role === 'assistant' ? 'Physics AI' : 'You'}
                      </span>
                      {msg.role === 'assistant' && (
                        <Badge 
                          className={cn(
                            "text-xs",
                            msg.type === 'quick' 
                              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" 
                              : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          )}
                        >
                          {msg.type === 'quick' ? 'Quick' : 'Detailed'}
                        </Badge>
                      )}
                      {msg.isExperimentExplanation && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          {msg.explanationType}
                        </Badge>
                      )}
                    </div>
                    
                    <div className={cn(
                      "text-slate-200 leading-relaxed",
                      msg.isError && "text-rose-300"
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-lg max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-5 mb-4 space-y-2 text-slate-200">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-5 mb-4 space-y-2 text-slate-200">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed text-slate-200">{children}</li>,
                              code: ({ children }) => (
                                <code className="px-2 py-1 rounded-md bg-slate-800 text-cyan-400 font-mono text-sm border border-slate-700">
                                  {children}
                                </code>
                              ),
                              strong: ({ children }) => <strong className="text-cyan-400 font-semibold">{children}</strong>,
                              h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-medium text-white mb-2">{children}</h3>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">Physics AI</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Thinking and analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input Area - Fixed at Bottom */}
      <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask a physics question... (e.g., 'Explain Newton's laws' or 'How do I calculate velocity?')"
                className="w-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-base rounded-xl px-4 py-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isTyping}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-xl px-4 py-3 shadow-lg transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Only physics-related questions will be answered</span>
            </div>
            <span>Press Enter to send • {message.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}