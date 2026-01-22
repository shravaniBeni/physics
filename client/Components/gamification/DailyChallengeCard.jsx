import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../../config/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trophy, CheckCircle2, Flame, Sparkles, Target, FlaskConical, BookOpen, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export default function DailyChallengeCard({ challenge, completed = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`${API_CONFIG.ENDPOINTS.GAMIFICATION.DAILY_CHALLENGES}/${challenge._id}/complete`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast.success(`Challenge completed! +${data.pointsAwarded} points earned!`);
      queryClient.invalidateQueries(['daily-challenges']);
      queryClient.invalidateQueries(['point-transactions']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete challenge');
    }
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'experiment': return <FlaskConical className="w-6 h-6 text-purple-400" />;
      case 'quiz': return <Target className="w-6 h-6 text-purple-400" />;
      case 'simulation': return <Zap className="w-6 h-6 text-purple-400" />;
      case 'theory': return <BookOpen className="w-6 h-6 text-purple-400" />;
      default: return <Flame className="w-6 h-6 text-purple-400" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20';
      case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/20';
      case 'hard': return 'text-rose-400 border-rose-500/30 bg-rose-500/20';
      default: return 'text-purple-400 border-purple-500/30 bg-purple-500/20';
    }
  };

  const handleCompleteChallenge = () => {
    if (!completed && !completeMutation.isPending) {
      completeMutation.mutate();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-purple-500/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20">
            {getTypeIcon(challenge.type)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
              {completed && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">Resets every 24 hours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`border ${getDifficultyColor(challenge.difficulty)}`}>
            {challenge.difficulty?.toUpperCase()}
          </Badge>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            +{challenge.reward_points} pts
          </Badge>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-purple-400 font-medium">
            {challenge.type?.toUpperCase()} CHALLENGE
          </span>
        </div>
        <p className="text-white">{challenge.description}</p>
        
        {/* Challenge Target Details */}
        {challenge.target && (
          <div className="mt-3 text-sm text-slate-400">
            {challenge.target.quiz_score && (
              <p>🎯 Target: Score {challenge.target.quiz_score}% or higher on any quiz</p>
            )}
            {challenge.target.simulation_attempts && (
              <p>🔬 Target: Complete {challenge.target.simulation_attempts} simulation attempts</p>
            )}
            {challenge.target.experiment_id && (
              <p>⚗️ Target: Complete the specified experiment</p>
            )}
            {challenge.target.time_limit && (
              <p>⏱️ Time limit: {challenge.target.time_limit} minutes</p>
            )}
          </div>
        )}
      </div>

      {completed ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Challenge Completed!</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center text-sm text-slate-400">
            Complete this challenge to earn bonus points!
          </div>
          {/* Manual completion button for testing */}
          <Button
            onClick={handleCompleteChallenge}
            disabled={completeMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            {completeMutation.isPending ? 'Completing...' : 'Mark as Complete'}
          </Button>
        </div>
      )}
    </Card>
  );
}