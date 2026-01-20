import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PointsDisplay({ compact = false }) {
  const { data: transactions = [] } = useQuery({
    queryKey: ['point-transactions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.PointTransaction.filter({ user_email: user.email });
    },
  });

  const totalPoints = transactions.reduce((sum, t) => sum + (t.points || 0), 0);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-amber-400">{totalPoints}</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
    >
      <div className="p-2 rounded-lg bg-amber-500/20">
        <Sparkles className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <p className="text-xs text-amber-400/80">Total Points</p>
        <p className="text-xl font-bold text-amber-400">{totalPoints}</p>
      </div>
    </motion.div>
  );
}