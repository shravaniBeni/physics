import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BadgeCard({ badge, earned = false }) {
  return (
    <motion.div
      whileHover={earned ? { scale: 1.05 } : {}}
      className={cn(
        "relative",
        !earned && "opacity-50 grayscale"
      )}
    >
      <Card className={cn(
        "p-4 text-center border transition-all",
        earned 
          ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30" 
          : "bg-slate-800/50 border-slate-700"
      )}>
        <div className={cn(
          "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl",
          earned ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20" : "bg-slate-700/50"
        )}>
          {badge.icon}
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">{badge.name}</h4>
        <p className="text-xs text-slate-400 mb-2">{badge.description}</p>
        {earned ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Earned
          </Badge>
        ) : (
          <Badge className="bg-slate-700 text-slate-400 text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Locked
          </Badge>
        )}
      </Card>
    </motion.div>
  );
}