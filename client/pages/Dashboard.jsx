import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../config/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FlaskConical, 
  Target, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Play,
  Zap
} from 'lucide-react';
import { Button } from '../Components/ui/button';
import StatsCard from '../Components/ui/StatsCard';
import ExperimentCard from '../Components/ui/ExperimentCard';
import { Skeleton } from '../Components/ui/skeleton';
import DailyChallengeCard from '../Components/gamification/DailyChallengeCard';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: experimentsData, isLoading: loadingExperiments } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.EXPERIMENTS.LIST),
  });

  const experiments = experimentsData?.experiments || [];

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.PROGRESS.LIST),
    enabled: !!user,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.QUIZ.ATTEMPTS),
    enabled: !!user,
  });

  const { data: pointsData } = useQuery({
    queryKey: ['point-transactions'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.POINTS),
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.BADGES),
    enabled: !!user,
  });

  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.DAILY_CHALLENGES),
    enabled: !!user,
  });

  const completedExperiments = progress.filter(p => p.completed).length;
  const totalTimeMinutes = Math.round(progress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) / 60);
  const avgAccuracy = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.correct_answers / q.total_questions) * 100, 0) / quizAttempts.length)
    : 0;
  const totalPoints = pointsData?.transactions?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

  const recentExperiments = experiments
    .filter(exp => progress.some(p => p.experiment_id === exp.id || p.experiment_id?._id === exp.id))
    .slice(0, 3);

  const suggestedExperiments = experiments
    .filter(exp => !progress.some(p => (p.experiment_id === exp.id || p.experiment_id?._id === exp.id) && p.completed))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-slate-900 border border-slate-800 p-8 lg:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Welcome to Quant IQ</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Explore Physics Through<br />
            <span className="gradient-text">Interactive Experiments</span>
          </h1>
          <p className="text-slate-400 max-w-lg mb-6">
            Dive into virtual labs, understand complex concepts with AI assistance, 
            and master physics through hands-on simulations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('VirtualLab')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25">
                <Play className="w-4 h-4 mr-2" />
                Start Experiment
              </Button>
            </Link>
            <Link to={createPageUrl('AIAssistant')}>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingProgress ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-800" />
          ))
        ) : (
          <>
            <StatsCard
              title="Experiments Completed"
              value={completedExperiments}
              subtitle={`of ${experiments.length} total`}
              icon={FlaskConical}
              gradient="cyan"
            />
            <StatsCard
              title="Quiz Accuracy"
              value={`${avgAccuracy}%`}
              subtitle="Average score"
              icon={Target}
              gradient="purple"
            />
            <StatsCard
              title="Time Spent"
              value={`${totalTimeMinutes}m`}
              subtitle="Learning time"
              icon={Clock}
              gradient="blue"
            />
            <StatsCard
              title="Total Points"
              value={totalPoints}
              subtitle={`${userBadges.length} badges earned`}
              icon={Zap}
              gradient="green"
            />
          </>
        )}
      </div>

      {/* Daily Challenges & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Challenges */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Daily Challenges</h2>
          {dailyChallenges.length > 0 ? (
            dailyChallenges.slice(0, 2).map((challenge) => {
              const challengeCompleted = challenge.completed_by?.includes(user?.email);
              return (
                <DailyChallengeCard 
                  key={challenge._id} 
                  challenge={challenge} 
                  completed={challengeCompleted} 
                />
              );
            })
          ) : (
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex items-center justify-center text-slate-500">
              No daily challenges available
            </div>
          )}
        </div>

        {/* Recent Badges */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Badges</h2>
            <Link to={createPageUrl('Analytics')} className="text-sm text-cyan-400 hover:text-cyan-300">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {userBadges.slice(0, 3).map((badge, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="text-3xl mb-2">{badge.badge_icon}</div>
                <p className="text-xs text-slate-400 truncate">{badge.badge_name}</p>
              </div>
            ))}
            {userBadges.length === 0 && (
              <div className="col-span-3 text-center py-6 text-slate-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Complete challenges to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent & Suggested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Continue Learning</h2>
            <Link 
              to={createPageUrl('VirtualLab')}
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingExperiments ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : recentExperiments.length > 0 ? (
            <div className="space-y-3">
              {recentExperiments.map(exp => {
                const expProgress = progress.find(p => p.experiment_id === exp.id || p.experiment_id?._id === exp.id);
                return (
                  <ExperimentCard 
                    key={exp.id} 
                    experiment={exp} 
                    progress={expProgress}
                    compact 
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No experiments started yet</p>
              <Link to={createPageUrl('VirtualLab')}>
                <Button variant="link" className="text-cyan-400 mt-2">
                  Browse experiments
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Suggested Experiments */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Suggested For You</h2>
            <Link 
              to={createPageUrl('VirtualLab')}
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Explore <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingExperiments ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : suggestedExperiments.length > 0 ? (
            <div className="space-y-3">
              {suggestedExperiments.slice(0, 3).map(exp => (
                <ExperimentCard 
                  key={exp.id} 
                  experiment={exp}
                  compact 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All experiments completed!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Category Access */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-5">Explore by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Mechanics', icon: '⚙️', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30' },
            { name: 'Electricity', icon: '⚡', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30' },
            { name: 'Optics', icon: '🔬', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30' },
            { name: 'Waves', icon: '🌊', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30' },
            { name: 'Thermodynamics', icon: '🔥', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30' },
          ].map(cat => (
            <Link
              key={cat.name}
              to={createPageUrl(`VirtualLab?category=${cat.name.toLowerCase()}`)}
              className={`p-5 rounded-xl bg-gradient-to-br ${cat.color} border ${cat.border} hover:scale-105 transition-transform text-center`}
            >
              <span className="text-3xl block mb-2">{cat.icon}</span>
              <span className="text-sm font-medium text-white">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}