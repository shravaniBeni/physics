import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '../Components/ui/card';
import { Input } from '../Components/ui/input';
import { Badge } from '../Components/ui/badge';
import { Skeleton } from '../Components/ui/skeleton';
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  Target, 
  Beaker, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryColors = {
  mechanics: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  electricity: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  optics: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  waves: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  thermodynamics: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
};

const categoryIcons = {
  mechanics: '⚙️',
  electricity: '⚡',
  optics: '🔬',
  waves: '🌊',
  thermodynamics: '🔥',
};

export default function ExperimentGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => base44.entities.Experiment.list(),
  });

  const filteredExperiments = experiments.filter(exp =>
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedExperiments = filteredExperiments.reduce((acc, exp) => {
    const category = exp.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(exp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Experiment Guide</h1>
        <p className="text-slate-400">Detailed instructions and theory for all physics experiments</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search experiments by name or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Experiments by Category */}
      {isLoading ? (
        <div className="space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48 bg-slate-800" />
              <Skeleton className="h-32 rounded-xl bg-slate-800" />
              <Skeleton className="h-32 rounded-xl bg-slate-800" />
            </div>
          ))}
        </div>
      ) : Object.keys(groupedExperiments).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedExperiments).map(([category, categoryExperiments]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{categoryIcons[category]}</span>
                <h2 className="text-xl font-semibold text-white capitalize">{category}</h2>
                <Badge className="bg-slate-700 text-slate-300">{categoryExperiments.length}</Badge>
              </div>

              <div className="space-y-3">
                {categoryExperiments.map(exp => (
                  <Card 
                    key={exp.id}
                    className={cn(
                      "bg-gradient-to-r border overflow-hidden transition-all duration-300",
                      categoryColors[category],
                      expandedId === exp.id ? "ring-1 ring-cyan-500/50" : ""
                    )}
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            <BookOpen className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{exp.title}</h3>
                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">{exp.description}</p>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-5 h-5 text-slate-400 transition-transform",
                          expandedId === exp.id && "rotate-90"
                        )} />
                      </div>
                    </button>

                    {expandedId === exp.id && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 pt-4">
                        {/* Quick Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                            <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Aim</p>
                              <p className="text-sm text-slate-300">{exp.aim || 'Understand the core principles'}</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                            <Beaker className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Apparatus</p>
                              <p className="text-sm text-slate-300">
                                {exp.apparatus?.slice(0, 2).join(', ') || 'Virtual simulation'}
                                {exp.apparatus?.length > 2 && ` +${exp.apparatus.length - 2} more`}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3">
                            <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Difficulty</p>
                              <p className={cn(
                                "text-sm font-medium capitalize",
                                exp.difficulty === 'easy' ? 'text-emerald-400' :
                                exp.difficulty === 'medium' ? 'text-amber-400' : 'text-rose-400'
                              )}>{exp.difficulty}</p>
                            </div>
                          </div>
                        </div>

                        {/* Formulas Preview */}
                        {exp.formulas && exp.formulas.length > 0 && (
                          <div className="p-4 rounded-lg bg-slate-900/50">
                            <p className="text-xs text-slate-500 mb-2">Key Formulas</p>
                            <div className="flex flex-wrap gap-3">
                              {exp.formulas.slice(0, 3).map((f, i) => (
                                <code key={i} className="px-3 py-1 rounded bg-cyan-500/10 text-cyan-400 text-sm font-mono">
                                  {f.expression}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Safety Notes */}
                        {exp.safety_notes && exp.safety_notes.length > 0 && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm font-medium">Safety Notes</span>
                            </div>
                            <ul className="text-sm text-amber-300/80 space-y-1">
                              {exp.safety_notes.slice(0, 2).map((note, i) => (
                                <li key={i}>• {note}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Button */}
                        <Link 
                          to={createPageUrl(`ExperimentDetail?id=${exp.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                        >
                          Open Full Guide
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No experiments found</h3>
          <p className="text-slate-400">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}