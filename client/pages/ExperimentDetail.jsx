import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../Components/ui/button';
import { Card } from '../Components/ui/card';
import { Badge } from '../Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';
import { 
  ArrowLeft, 
  Target, 
  Beaker, 
  ListOrdered, 
  AlertTriangle,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Skeleton } from '../Components/ui/skeleton';
import PendulumSimulation from '../Components/simulations/PendulumSimulation';
import OhmsLawSimulation from '../Components/simulations/OhmsLawSimulation';
import ProjectileSimulation from '../Components/simulations/ProjectileSimulation';
import WaveSimulation from '../Components/simulations/WaveSimulation';
import LensSimulation from '../Components/simulations/LensSimulation';

const categoryIcons = {
  mechanics: '⚙️',
  electricity: '⚡',
  optics: '🔬',
  waves: '🌊',
  thermodynamics: '🔥',
};

export default function ExperimentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const experimentId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState('simulation');
  const [startTime] = useState(Date.now());
  const queryClient = useQueryClient();

  const { data: experiment, isLoading } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: async () => {
      const experiments = await base44.entities.Experiment.filter({ id: experimentId });
      return experiments[0];
    },
    enabled: !!experimentId,
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', experimentId],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const progressList = await base44.entities.UserProgress.filter({ 
        user_email: user.email, 
        experiment_id: experimentId 
      });
      return progressList[0];
    },
    enabled: !!experimentId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      if (!user) return;
      
      if (progress) {
        return base44.entities.UserProgress.update(progress.id, data);
      } else {
        return base44.entities.UserProgress.create({
          user_email: user.email,
          experiment_id: experimentId,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress', experimentId]);
      queryClient.invalidateQueries(['user-progress']);
    }
  });

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      updateProgressMutation.mutate({
        last_accessed: new Date().toISOString(),
        time_spent_seconds: (progress?.time_spent_seconds || 0) + 10
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [progress]);

  const markAsCompleted = async () => {
    updateProgressMutation.mutate({ completed: true });
    
    // Award points
    const user = await base44.auth.me();
    if (user) {
      await base44.entities.PointTransaction.create({
        user_email: user.email,
        points: 50,
        source: 'experiment',
        source_id: experimentId,
        description: `Completed experiment: ${experiment.title}`
      });
      queryClient.invalidateQueries(['point-transactions']);
    }
  };

  const renderSimulation = () => {
    if (!experiment) return null;
    
    switch (experiment.simulation_type) {
      case 'pendulum':
        return <PendulumSimulation />;
      case 'ohms_law':
        return <OhmsLawSimulation />;
      case 'projectile':
        return <ProjectileSimulation />;
      case 'wave':
        return <WaveSimulation />;
      case 'lens':
        return <LensSimulation />;
      default:
        return (
          <div className="text-center py-16">
            <PlayCircle className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">Simulation coming soon</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-96 rounded-2xl bg-slate-800" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-4">Experiment not found</p>
        <Link to={createPageUrl('VirtualLab')}>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Virtual Lab
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            to={createPageUrl('VirtualLab')}
            className="text-slate-400 hover:text-white flex items-center gap-2 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Virtual Lab
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{categoryIcons[experiment.category]}</span>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{experiment.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-slate-700 text-slate-300 capitalize">{experiment.category}</Badge>
                <Badge className={
                  experiment.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                  experiment.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }>
                  {experiment.difficulty}
                </Badge>
                {progress?.completed && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {progress?.time_spent_seconds && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>{Math.round(progress.time_spent_seconds / 60)} min spent</span>
            </div>
          )}
          {!progress?.completed && (
            <Button 
              onClick={markAsCompleted}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700 p-1 w-full sm:w-auto">
          <TabsTrigger 
            value="simulation" 
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Simulation
          </TabsTrigger>
          <TabsTrigger 
            value="guide"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Guide
          </TabsTrigger>
          <TabsTrigger 
            value="theory"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Target className="w-4 h-4 mr-2" />
            Theory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="mt-6">
          {renderSimulation()}
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aim */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Aim</h3>
              </div>
              <p className="text-slate-300">{experiment.aim || 'To understand the fundamental principles of this experiment.'}</p>
            </Card>

            {/* Apparatus */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Beaker className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Virtual Apparatus</h3>
              </div>
              <ul className="space-y-2">
                {(experiment.apparatus || ['Interactive simulation controls', 'Parameter sliders', 'Real-time graphs', 'Data display']).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Procedure */}
            <Card className="bg-slate-800/50 border-slate-700 p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <ListOrdered className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Procedure</h3>
              </div>
              <ol className="space-y-3">
                {(experiment.procedure || [
                  'Open the simulation tab',
                  'Adjust the initial parameters using the sliders',
                  'Click the Play button to start the simulation',
                  'Observe the real-time changes in values and graphs',
                  'Try different parameter combinations',
                  'Record your observations',
                  'Mark the experiment as complete when done'
                ]).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>

            {/* Safety Notes */}
            {experiment.safety_notes && experiment.safety_notes.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Safety Notes</h3>
                </div>
                <ul className="space-y-2">
                  {experiment.safety_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="theory" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Theory</h3>
              <p className="text-slate-300 leading-relaxed">
                {experiment.theory || 'This experiment demonstrates fundamental physics principles through interactive simulation. By adjusting various parameters, you can observe how changes affect the system and verify theoretical predictions.'}
              </p>
            </Card>

            {experiment.formulas && experiment.formulas.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Key Formulas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experiment.formulas.map((formula, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">{formula.name}</p>
                      <p className="text-xl font-mono text-cyan-400">{formula.expression}</p>
                      {formula.variables && (
                        <p className="text-xs text-slate-500 mt-2">{formula.variables}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}