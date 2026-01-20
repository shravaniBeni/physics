import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '../Components/ui/card';
import { Badge } from '../Components/ui/badge';
import { Skeleton } from '../Components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  FlaskConical, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';

const categoryColors = {
  mechanics: '#3b82f6',
  electricity: '#eab308',
  optics: '#8b5cf6',
  waves: '#06b6d4',
  thermodynamics: '#f97316',
};

const categoryIcons = {
  mechanics: '⚙️',
  electricity: '⚡',
  optics: '🔬',
  waves: '🌊',
  thermodynamics: '🔥',
};

export default function Analytics() {
  const { data: experiments = [], isLoading: loadingExperiments } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => base44.entities.Experiment.list(),
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.UserProgress.filter({ user_email: user.email });
    },
  });

  const { data: quizAttempts = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.QuizAttempt.filter({ user_email: user.email }, '-created_date');
    },
  });

  const isLoading = loadingExperiments || loadingProgress || loadingQuizzes;

  // Calculate stats
  const completedExperiments = progress.filter(p => p.completed).length;
  const totalTimeMinutes = Math.round(progress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) / 60);
  const avgAccuracy = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.correct_answers / q.total_questions) * 100, 0) / quizAttempts.length)
    : 0;

  // Category progress data
  const categoryProgress = Object.keys(categoryColors).map(cat => {
    const catExperiments = experiments.filter(e => e.category === cat);
    const completed = catExperiments.filter(e => 
      progress.some(p => p.experiment_id === e.id && p.completed)
    ).length;
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      completed,
      total: catExperiments.length,
      percentage: catExperiments.length > 0 ? Math.round((completed / catExperiments.length) * 100) : 0
    };
  });

  // Quiz performance by category
  const quizByCategory = Object.keys(categoryColors).map(cat => {
    const catQuizzes = quizAttempts.filter(q => q.category === cat);
    const avgScore = catQuizzes.length > 0
      ? Math.round(catQuizzes.reduce((sum, q) => sum + (q.correct_answers / q.total_questions) * 100, 0) / catQuizzes.length)
      : 0;
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      score: avgScore,
      attempts: catQuizzes.length
    };
  });

  // Recent activity
  const recentQuizzes = quizAttempts.slice(0, 5).map(q => ({
    date: new Date(q.created_date).toLocaleDateString(),
    category: q.category,
    score: Math.round((q.correct_answers / q.total_questions) * 100)
  }));

  // Weak areas
  const weakAreas = quizByCategory
    .filter(c => c.attempts > 0 && c.score < 60)
    .sort((a, b) => a.score - b.score);

  // Pie chart data for experiment completion
  const pieData = [
    { name: 'Completed', value: completedExperiments, color: '#22c55e' },
    { name: 'Remaining', value: experiments.length - completedExperiments, color: '#334155' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Track your learning progress</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Track your learning progress and identify areas for improvement</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Experiments Completed"
          value={`${completedExperiments}/${experiments.length}`}
          subtitle={`${Math.round((completedExperiments/experiments.length)*100) || 0}% complete`}
          icon={FlaskConical}
          gradient="cyan"
        />
        <StatsCard
          title="Quiz Accuracy"
          value={`${avgAccuracy}%`}
          subtitle={`${quizAttempts.length} quizzes taken`}
          icon={Target}
          gradient="purple"
        />
        <StatsCard
          title="Learning Time"
          value={`${totalTimeMinutes}m`}
          subtitle="Total time spent"
          icon={Clock}
          gradient="blue"
        />
        <StatsCard
          title="Topics Covered"
          value={categoryProgress.filter(c => c.completed > 0).length}
          subtitle="out of 5 categories"
          icon={TrendingUp}
          gradient="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Progress */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progress by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryProgress} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="#06b6d4" 
                  radius={[0, 4, 4, 0]}
                  name="Completion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quiz Performance */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quiz Scores by Topic</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  name="Avg Score %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Pie */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Completion</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <span className="text-sm text-slate-400">Remaining</span>
            </div>
          </div>
        </Card>

        {/* Recent Quiz Activity */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Quiz Activity</h3>
          {recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((quiz, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryIcons[quiz.category]}</span>
                    <div>
                      <p className="text-white capitalize text-sm">{quiz.category}</p>
                      <p className="text-xs text-slate-500">{quiz.date}</p>
                    </div>
                  </div>
                  <Badge className={
                    quiz.score >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                    quiz.score >= 40 ? "bg-amber-500/20 text-amber-400" :
                    "bg-rose-500/20 text-rose-400"
                  }>
                    {quiz.score}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No quizzes taken yet</p>
            </div>
          )}
        </Card>

        {/* Weak Areas */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Areas to Improve
          </h3>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((area, i) => (
                <div key={i} className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{area.name}</span>
                    <Badge className="bg-amber-500/20 text-amber-400">{area.score}%</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Based on {area.attempts} quiz attempt{area.attempts !== 1 && 's'}
                  </p>
                </div>
              ))}
            </div>
          ) : quizAttempts.length > 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
              <p className="text-emerald-400">Great job! No weak areas detected.</p>
              <p className="text-xs text-slate-500 mt-1">Keep up the good work!</p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Take some quizzes to see insights</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}