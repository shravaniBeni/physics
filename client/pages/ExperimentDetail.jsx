import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../config/api';
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
  Clock,
  Bot
} from 'lucide-react';
import { Skeleton } from '../Components/ui/skeleton';
import PendulumSimulation from '../Components/simulations/PendulumSimulation';
import OhmsLawSimulation from '../Components/simulations/OhmsLawSimulation';
import ProjectileSimulation from '../Components/simulations/ProjectileSimulation';
import WaveSimulation from '../Components/simulations/WaveSimulation';
import LensSimulation from '../Components/simulations/LensSimulation';
import ThermalSimulation from '../Components/simulations/ThermalSimulation';
import FreefallSimulation from '../Components/simulations/FreefallSimulation';
import RCCircuitSimulation from '../Components/simulations/RCCircuitSimulation';
import ExperimentAI from '../Components/ExperimentAI';
import ExperimentQuiz from '../Components/ExperimentQuiz';

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
      if (!experimentId) return null;
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.EXPERIMENTS.DETAIL}/${experimentId}`);
      return response;
    },
    enabled: !!experimentId,
  });

  // Simplified progress tracking for now
  const { data: progress } = useQuery({
    queryKey: ['progress', experimentId],
    queryFn: async () => {
      // For now, return null - we can implement progress tracking later
      return null;
    },
    enabled: !!experimentId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data) => {
      // For now, just log the progress update
      console.log('Progress update:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress', experimentId]);
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
    console.log('Experiment marked as completed');
  };

  const renderSimulation = () => {
    if (!experiment) return null;
    
    const simulationType = experiment.simulation?.type;
    
    switch (simulationType) {
      case 'pendulum':
        return <PendulumSimulation />;
      case 'ohms-law':
        return <OhmsLawSimulation />;
      case 'projectile':
        return <ProjectileSimulation />;
      case 'wave':
        return <WaveSimulation />;
      case 'lens':
        return <LensSimulation />;
      case 'thermal':
        return <ThermalSimulation />;
      case 'freefall':
        return <FreefallSimulation />;
      case 'rc-circuit':
        return <RCCircuitSimulation />;
      default:
        return (
          <div className="text-center py-16">
            <PlayCircle className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">Simulation coming soon</p>
            {simulationType && (
              <p className="text-slate-500 text-sm mt-2">Type: {simulationType}</p>
            )}
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
          <TabsTrigger 
            value="quiz"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Quiz
          </TabsTrigger>
          <TabsTrigger 
            value="ai-assistant"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
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
                <h3 className="text-lg font-semibold text-white">Objectives</h3>
              </div>
              <ul className="space-y-2">
                {(experiment.objectives || ['To understand the fundamental principles of this experiment.']).map((objective, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Materials */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Beaker className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Materials</h3>
              </div>
              <ul className="space-y-2">
                {(experiment.materials || []).map((material, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{material.name}</span>
                    {material.quantity && (
                      <span className="text-slate-500 text-sm">({material.quantity})</span>
                    )}
                    {material.optional && (
                      <span className="text-amber-400 text-xs">(Optional)</span>
                    )}
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
                {(experiment.procedure || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">
                      {step.step || i + 1}
                    </span>
                    <div>
                      <p>{step.instruction || step}</p>
                      {step.notes && (
                        <p className="text-slate-500 text-sm mt-1">{step.notes}</p>
                      )}
                    </div>
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
              <div className="space-y-4">
                {experiment.theory?.background && (
                  <p className="text-slate-300 leading-relaxed">
                    {experiment.theory.background}
                  </p>
                )}
                
                {experiment.theory?.concepts && experiment.theory.concepts.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {experiment.theory.concepts.map((concept, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {experiment.theory?.formulas && experiment.theory.formulas.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Key Formulas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experiment.theory.formulas.map((formula, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">{formula.name}</p>
                      <p className="text-xl font-mono text-cyan-400">{formula.formula}</p>
                      {formula.variables && formula.variables.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-slate-500">Where:</p>
                          {formula.variables.map((variable, j) => (
                            <p key={j} className="text-xs text-slate-400">
                              <span className="font-mono text-cyan-400">{variable.symbol}</span> = {variable.description} ({variable.unit})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <ExperimentQuiz experiment={experiment} />
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
          <div className="space-y-6">
            <ExperimentAI experiment={experiment} />
            
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Need More Help?</h3>
              <p className="text-slate-300 mb-4">
                Visit the full AI Assistant for detailed conversations and personalized explanations.
              </p>
              <Link to={`${createPageUrl('AIAssistant')}?experiment=${experiment._id}&title=${encodeURIComponent(experiment.title)}`}>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                  <Bot className="w-4 h-4 mr-2" />
                  Open Full AI Assistant
                </Button>
              </Link>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}