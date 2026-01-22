import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';
import { Play, Clock, CheckCircle, Star, Bot } from 'lucide-react';
import { cn } from '../../../lib/utils';
import ExperimentAIButton from '../ExperimentAIButton';

const difficultyColors = {
  easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const categoryIcons = {
  mechanics: '⚙️',
  electricity: '⚡',
  optics: '🔦',
  waves: '🌊',
  thermodynamics: '🔥',
};

export default function ExperimentCard({ experiment, progress, compact = false }) {
  const isCompleted = progress?.completed;
  const timeSpent = progress?.time_spent_seconds || 0;
  const accuracy = progress?.accuracy || 0;

  if (compact) {
    return (
      <Link to={createPageUrl(`ExperimentDetail?id=${experiment._id}`)}>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-cyan-500/50 transition-all group">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
            {categoryIcons[experiment.category] || '🔬'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
              {experiment.title}
            </h3>
            <p className="text-sm text-slate-400 truncate">{experiment.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            <Badge className={difficultyColors[experiment.difficulty] || difficultyColors.medium}>
              {experiment.difficulty}
            </Badge>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
            {categoryIcons[experiment.category] || '🔬'}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            <Badge className={difficultyColors[experiment.difficulty] || difficultyColors.medium}>
              {experiment.difficulty}
            </Badge>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {experiment.title}
        </h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {experiment.description}
        </p>

        {progress && (
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.round(timeSpent / 60)}m</span>
            </div>
            {accuracy > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>{accuracy}%</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link to={createPageUrl(`ExperimentDetail?id=${experiment._id}`)} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              {isCompleted ? 'Review' : 'Start'} Experiment
            </Button>
          </Link>
          <ExperimentAIButton experiment={experiment} />
        </div>
      </div>
    </Card>
  );
}