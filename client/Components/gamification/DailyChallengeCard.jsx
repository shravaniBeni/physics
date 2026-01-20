import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trophy, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DailyChallengeCard({ challenge, completed = false }) {
  const queryClient = useQueryClient();

  const categoryIcons = {
    mechanics: '⚙️',
    electricity: '⚡',
    optics: '🔬',
    waves: '🌊',
    thermodynamics: '🔥',
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-purple-500/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Flame className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">Daily Challenge</h3>
              {completed && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">Resets every 24 hours</p>
          </div>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          +{challenge.points_reward} pts
        </Badge>
      </div>

      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 mb-4">
        <div className="flex items-center gap-2 mb-2">
          {challenge.category && (
            <span className="text-2xl">{categoryIcons[challenge.category]}</span>
          )}
          <span className="text-sm text-purple-400 font-medium">
            {challenge.category?.toUpperCase()}
          </span>
        </div>
        <p className="text-white">{challenge.task_description}</p>
      </div>

      {completed ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Challenge Completed!</span>
        </div>
      ) : (
        <div className="text-center text-sm text-slate-400">
          Complete this challenge to earn bonus points!
        </div>
      )}
    </Card>
  );
}