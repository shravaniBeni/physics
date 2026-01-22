import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Bot } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function ExperimentAIButton({ experiment, size = 'sm', variant = 'outline' }) {
  const aiUrl = `${createPageUrl('AIAssistant')}?experiment=${experiment._id}&title=${encodeURIComponent(experiment.title)}`;
  
  return (
    <Link to={aiUrl}>
      <Button 
        size={size} 
        variant={variant}
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      >
        <Bot className="w-4 h-4 mr-2" />
        AI Help
      </Button>
    </Link>
  );
}