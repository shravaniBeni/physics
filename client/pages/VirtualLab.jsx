import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '../Components/ui/input';
import { Button } from '../Components/ui/button';
import { Badge } from '../Components/ui/badge';
import { Skeleton } from '../Components/ui/skeleton';
import { Search, Filter, X } from 'lucide-react';
import ExperimentCard from '../Components/ui/ExperimentCard';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', name: 'All', icon: '🔬' },
  { id: 'mechanics', name: 'Mechanics', icon: '⚙️' },
  { id: 'electricity', name: 'Electricity', icon: '⚡' },
  { id: 'optics', name: 'Optics', icon: '🔦' },
  { id: 'waves', name: 'Waves', icon: '🌊' },
  { id: 'thermodynamics', name: 'Thermodynamics', icon: '🔥' },
];

const difficulties = ['all', 'easy', 'medium', 'hard'];

export default function VirtualLab() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'all';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => base44.entities.Experiment.list(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.UserProgress.filter({ user_email: user.email });
    },
  });

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const experimentCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'all' 
      ? experiments.length 
      : experiments.filter(e => e.category === cat.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Virtual Laboratory</h1>
        <p className="text-slate-400">Choose an experiment and start exploring physics concepts</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "border-slate-700 text-slate-300",
            showFilters && "bg-slate-800 border-cyan-500/50"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
              selectedCategory === cat.id
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            )}
          >
            <span>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.name}</span>
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 text-xs">
              {experimentCounts[cat.id] || 0}
            </Badge>
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Difficulty Level</p>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                    selectedDifficulty === diff
                      ? diff === 'easy' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : diff === 'medium' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : diff === 'hard' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-slate-700 text-white border border-slate-600"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                  )}
                >
                  {diff === 'all' ? 'All Levels' : diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl bg-slate-800" />
          ))}
        </div>
      ) : filteredExperiments.length > 0 ? (
        <>
          <p className="text-sm text-slate-500">
            Showing {filteredExperiments.length} experiment{filteredExperiments.length !== 1 && 's'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiments.map(exp => (
              <ExperimentCard
                key={exp.id}
                experiment={exp}
                progress={progress.find(p => p.experiment_id === exp.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No experiments found</h3>
          <p className="text-slate-400 mb-4">Try adjusting your search or filter criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
            className="border-slate-700 text-slate-300"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}