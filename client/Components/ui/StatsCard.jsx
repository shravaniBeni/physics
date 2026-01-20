import { cn } from '@/lib/utils';

const gradientClasses = {
  cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
};

const iconColors = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  orange: 'text-orange-400',
};

export default function StatsCard({ title, value, subtitle, icon: Icon, gradient = 'cyan' }) {
  return (
    <div className={cn(
      'p-6 rounded-2xl bg-gradient-to-br border',
      gradientClasses[gradient]
    )}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn('w-6 h-6', iconColors[gradient])} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}