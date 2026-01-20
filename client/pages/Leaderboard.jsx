import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '../Components/ui/card';
import { Badge } from '../Components/ui/badge';
import { Avatar } from '../Components/ui/avatar';
import { Skeleton } from '../Components/ui/skeleton';
import { Trophy, Medal, Award, Crown, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all-time');

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['all-point-transactions'],
    queryFn: () => base44.entities.PointTransaction.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Calculate leaderboard
  const userPoints = {};
  allTransactions.forEach(t => {
    if (!userPoints[t.user_email]) {
      userPoints[t.user_email] = 0;
    }
    userPoints[t.user_email] += t.points || 0;
  });

  const leaderboard = Object.entries(userPoints)
    .map(([email, points]) => ({
      email,
      points,
      name: email.split('@')[0]
    }))
    .sort((a, b) => b.points - a.points);

  const currentUserRank = leaderboard.findIndex(u => u.email === currentUser?.email) + 1;
  const currentUserData = leaderboard.find(u => u.email === currentUser?.email);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-amber-500/20 to-yellow-500/10 border-amber-500/30';
    if (rank === 2) return 'from-slate-400/20 to-slate-500/10 border-slate-400/30';
    if (rank === 3) return 'from-orange-500/20 to-orange-600/10 border-orange-500/30';
    return 'from-slate-800/50 to-slate-900/30 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-400">Compete with fellow physics enthusiasts</p>
      </div>

      {/* Your Rank Card */}
      {currentUserData && (
        <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Your Rank</p>
                <p className="text-3xl font-bold text-white">#{currentUserRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Points</p>
              <p className="text-3xl font-bold text-amber-400">{currentUserData.points}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Top Learners</h2>
            <Badge className="bg-purple-500/20 text-purple-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Live Rankings
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg bg-slate-700" />
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="p-6 space-y-3">
            {leaderboard.slice(0, 50).map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = user.email === currentUser?.email;

              return (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`p-4 bg-gradient-to-r ${getRankColor(rank)} ${isCurrentUser ? 'ring-2 ring-cyan-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                          {getRankIcon(rank) || (
                            <span className="text-lg font-bold text-slate-400">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {user.name}
                              {isCurrentUser && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">You</Badge>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span className="text-xl font-bold text-amber-400">{user.points}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h3>
            <p className="text-slate-400">Complete experiments and quizzes to earn points and appear on the leaderboard!</p>
          </div>
        )}
      </Card>

      {/* Rewards Info */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-purple-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Award className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">How to Earn Points</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Complete experiments: <span className="text-amber-400 font-bold">+50 points</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Score 100% on quiz: <span className="text-amber-400 font-bold">+100 points</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Complete daily challenge: <span className="text-amber-400 font-bold">+50 points</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Earn badges: <span className="text-amber-400 font-bold">+25-200 points</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}