import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '../Components/ui/button';
import { Input } from '../Components/ui/input';
import { Card } from '../Components/ui/card';
import { Badge } from '../Components/ui/badge';
import { ScrollArea } from '../Components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  BookOpen,
  Loader2,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const suggestedQuestions = [
  "What is Newton's second law of motion?",
  "Explain Ohm's law with an example",
  "How does a convex lens form images?",
  "What is the relationship between frequency and wavelength?",
  "Derive the formula for time period of a simple pendulum"
];

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [explanationType, setExplanationType] = useState('quick');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: chatHistory = [] } = useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const history = await base44.entities.ChatMessage.filter(
        { user_email: user.email },
        '-created_date',
        20
      );
      return history.reverse();
    },
  });

  useEffect(() => {
    if (chatHistory.length > 0 && messages.length === 0) {
      setMessages(chatHistory.map(m => ({
        role: m.role,
        content: m.content,
        type: m.explanation_type
      })));
    }
  }, [chatHistory]);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      const user = await base44.auth.me();
      
      // Save user message
      await base44.entities.ChatMessage.create({
        user_email: user?.email || 'anonymous',
        role: 'user',
        content: userMessage,
        explanation_type: explanationType
      });

      // Get AI response
      const systemPrompt = explanationType === 'quick' 
        ? "You are a friendly physics tutor for school and junior college students. Give concise, clear explanations with simple examples. Use bullet points when helpful. Keep responses under 200 words."
        : "You are an expert physics tutor for school and junior college students. Provide detailed explanations with step-by-step derivations, multiple examples, and real-life applications. Include relevant formulas and explain each variable. Use proper formatting with headers and lists.";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nStudent question: ${userMessage}\n\nIMPORTANT: Only answer physics-related questions. If the question is not related to physics, politely redirect the student to ask physics questions.`,
      });

      // Save assistant response
      await base44.entities.ChatMessage.create({
        user_email: user?.email || 'anonymous',
        role: 'assistant',
        content: response,
        explanation_type: explanationType
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response, type: explanationType }]);
      setIsTyping(false);
      queryClient.invalidateQueries(['chat-history']);
    },
    onError: () => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting right now. Please try again.", 
        type: explanationType,
        isError: true
      }]);
    }
  });

  const handleSend = () => {
    if (!message.trim() || isTyping) return;
    
    setMessages(prev => [...prev, { role: 'user', content: message, type: explanationType }]);
    setIsTyping(true);
    sendMessageMutation.mutate(message);
    setMessage('');
  };

  const handleSuggestedQuestion = (question) => {
    setMessage(question);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">AI Physics Assistant</h1>
        </div>
        <p className="text-slate-400">Ask any physics question and get clear explanations</p>
      </div>

      {/* Explanation Type Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-slate-400">Explanation style:</span>
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setExplanationType('quick')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              explanationType === 'quick'
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Zap className="w-4 h-4" />
            Quick
          </button>
          <button
            onClick={() => setExplanationType('detailed')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              explanationType === 'detailed'
                ? "bg-purple-500/20 text-purple-400"
                : "text-slate-400 hover:text-white"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Detailed
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-slate-800/30 border-slate-700 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">How can I help you today?</h3>
              <p className="text-slate-400 text-center max-w-md mb-6">
                I can explain physics concepts, derive formulas, solve problems, and help you understand experiments.
              </p>

              <div className="w-full max-w-lg">
                <p className="text-sm text-slate-500 mb-3 text-center">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                    >
                      <Lightbulb className="w-3 h-3 inline mr-2 text-amber-400" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      msg.role === 'user'
                        ? "bg-cyan-600 text-white"
                        : msg.isError
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                        : "bg-slate-800 text-slate-200"
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 rounded bg-slate-700 text-cyan-400 font-mono text-sm">
                                {children}
                              </code>
                            ),
                            strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    {msg.role === 'assistant' && (
                      <Badge 
                        className={cn(
                          "mt-2",
                          msg.type === 'quick' 
                            ? "bg-cyan-500/20 text-cyan-400" 
                            : "bg-purple-500/20 text-purple-400"
                        )}
                      >
                        {msg.type === 'quick' ? 'Quick' : 'Detailed'} explanation
                      </Badge>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a physics question..."
              className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isTyping}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Only physics-related questions will be answered
          </p>
        </div>
      </Card>
    </div>
  );
}