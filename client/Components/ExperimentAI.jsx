import React, { useState } from 'react';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Bot, 
  Beaker, 
  Brain, 
  Target, 
  BookOpen,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '../../lib/utils';

export default function ExperimentAI({ experiment }) {
  const [activeExplanation, setActiveExplanation] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const explanationTypes = [
    {
      key: 'overview',
      label: 'Overview',
      icon: Beaker,
      color: 'cyan',
      description: 'What this experiment demonstrates'
    },
    {
      key: 'procedure',
      label: 'Procedure Guide',
      icon: Target,
      color: 'purple',
      description: 'Step-by-step instructions'
    },
    {
      key: 'theory',
      label: 'Theory',
      icon: Brain,
      color: 'amber',
      description: 'Physics concepts and formulas'
    },
    {
      key: 'analysis',
      label: 'Analysis',
      icon: BookOpen,
      color: 'green',
      description: 'How to analyze results'
    }
  ];

  const getExplanation = async (type) => {
    if (explanations[type]) {
      setActiveExplanation(activeExplanation === type ? null : type);
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const response = await apiRequest(
        `${API_CONFIG.ENDPOINTS.AI.EXPERIMENT_EXPLANATION}/${experiment._id}/explanation/${type}`
      );
      
      setExplanations(prev => ({
        ...prev,
        [type]: response.explanation
      }));
      setActiveExplanation(type);
    } catch (error) {
      console.error(`Failed to get ${type} explanation:`, error);
      setExplanations(prev => ({
        ...prev,
        [type]: `Sorry, I couldn't generate the ${type} explanation right now. Please try again.`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getColorClasses = (color, variant = 'default') => {
    const colors = {
      cyan: {
        button: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10',
        badge: 'bg-cyan-500/20 text-cyan-400',
        icon: 'text-cyan-400'
      },
      purple: {
        button: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10',
        badge: 'bg-purple-500/20 text-purple-400',
        icon: 'text-purple-400'
      },
      amber: {
        button: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
        badge: 'bg-amber-500/20 text-amber-400',
        icon: 'text-amber-400'
      },
      green: {
        button: 'border-green-500/30 text-green-400 hover:bg-green-500/10',
        badge: 'bg-green-500/20 text-green-400',
        icon: 'text-green-400'
      }
    };
    return colors[color]?.[variant] || '';
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-sm text-slate-400">Get AI-powered explanations</p>
            </div>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {explanationTypes.map((type) => {
                const Icon = type.icon;
                const isActive = activeExplanation === type.key;
                const isLoading = loading[type.key];
                
                return (
                  <Button
                    key={type.key}
                    onClick={() => getExplanation(type.key)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-auto p-3 flex-col items-start text-left",
                      getColorClasses(type.color, 'button'),
                      isActive && "ring-2 ring-current"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className={cn("w-4 h-4", getColorClasses(type.color, 'icon'))} />
                      )}
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <span className="text-xs opacity-75">{type.description}</span>
                  </Button>
                );
              })}
            </div>

            {activeExplanation && explanations[activeExplanation] && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getColorClasses(
                    explanationTypes.find(t => t.key === activeExplanation)?.color || 'cyan',
                    'badge'
                  )}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {explanationTypes.find(t => t.key === activeExplanation)?.label}
                  </Badge>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-200">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-3 text-slate-200">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 text-slate-200">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ inline, children }) => 
                          inline ? (
                            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-sm">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto mb-3">
                              <code className="text-cyan-400 font-mono text-sm">{children}</code>
                            </pre>
                          ),
                        strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>,
                        em: ({ children }) => <em className="text-purple-400 italic">{children}</em>,
                        h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 border-b border-slate-700 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-medium text-white mb-2">{children}</h3>,
                        // Math components for KaTeX
                        span: ({ className, children, ...props }) => {
                          if (className?.includes('math')) {
                            return <span className={`${className} text-cyan-300`} {...props}>{children}</span>;
                          }
                          return <span className={className} {...props}>{children}</span>;
                        },
                        div: ({ className, children, ...props }) => {
                          if (className?.includes('math')) {
                            return <div className={`${className} text-center my-3 text-cyan-300`} {...props}>{children}</div>;
                          }
                          return <div className={className} {...props}>{children}</div>;
                        }
                      }}
                    >
                      {explanations[activeExplanation]}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}