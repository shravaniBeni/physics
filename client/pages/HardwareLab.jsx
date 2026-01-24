import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../config/api';
import { Card } from '../Components/ui/card';
import { Button } from '../Components/ui/button';
import { Badge } from '../Components/ui/badge';
import { Skeleton } from '../Components/ui/skeleton';
import { 
  Wifi, 
  Play, 
  Square, 
  Download, 
  RefreshCw, 
  Zap,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Brain,
  BarChart3,
  Cpu,
  Radio,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function HardwareLab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedExperiment, setSelectedExperiment] = useState('');
  const [deviceIP, setDeviceIP] = useState('192.168.1.4');
  const [deviceId, setDeviceId] = useState('esp32_physics_lab');
  const [currentExperimentId, setCurrentExperimentId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveData, setLiveData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [mpuStatus, setMpuStatus] = useState('unknown');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  
  const intervalRef = useRef(null);

  // Fetch user's hardware experiments
  const { data: experimentsData, isLoading } = useQuery({
    queryKey: ['hardware-experiments'],
    queryFn: () => apiRequest('/api/hardware/experiments'),
    enabled: !!user,
  });

  // Start experiment mutation (backend only)
  const startExperimentMutation = useMutation({
    mutationFn: async ({ experiment_type, device_id, device_ip }) => {
      return await apiRequest('/api/hardware/experiments/start', {
        method: 'POST',
        body: JSON.stringify({ experiment_type, device_id, device_ip })
      });
    },
    onSuccess: (data) => {
      console.log('Backend experiment started:', data.experiment_id);
    },
    onError: (error) => {
      console.error('Backend experiment start failed:', error);
    }
  });

  // Stop experiment mutation (backend only)
  const stopExperimentMutation = useMutation({
    mutationFn: async (experimentId) => {
      return await apiRequest(`/api/hardware/experiments/${experimentId}/stop`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      console.log('Backend experiment stopped');
      queryClient.invalidateQueries(['hardware-experiments']);
    },
    onError: (error) => {
      console.error('Backend experiment stop failed:', error);
    }
  });

  // Start live data polling from ESP32
  const startLiveDataPolling = () => {
    intervalRef.current = setInterval(async () => {
      try {
        // Get data directly from ESP32
        const esp32Response = await fetch(`http://${deviceIP}/data`, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (esp32Response.ok) {
          const esp32Data = await esp32Response.json();
          
          // Convert ESP32 data format to our format
          const dataPoint = {
            timestamp: Date.now(),
            value: esp32Data.y || 0,
            raw_data: {
              ax: esp32Data.ax || 0,
              ay: esp32Data.ay || 0,
              az: esp32Data.az || 0
            }
          };
          
          setLiveData(prev => {
            const newData = [...prev, dataPoint];
            return newData.slice(-100); // Keep last 100 points
          });
          
          setConnectionStatus('connected');

          // Send data to backend if experiment is running
          if (currentExperimentId) {
            try {
              await apiRequest(`/api/hardware/experiments/${currentExperimentId}/data`, {
                method: 'POST',
                body: JSON.stringify(dataPoint)
              });
            } catch (backendError) {
              console.warn('Backend data send failed:', backendError);
            }
          }
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Live data polling error:', error);
        setConnectionStatus('error');
      }
    }, 1000); // Poll every second
  };

  // Stop live data polling
  const stopLiveDataPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopLiveDataPolling();
  }, []);

  // Test ESP32 connection
  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      const response = await fetch(`http://${deviceIP}/status`, { 
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        setMpuStatus(data.mpu_connected ? 'connected' : 'disconnected');
        toast.success('ESP32 connected successfully!');
        console.log('ESP32 Status:', data);
      } else {
        setConnectionStatus('error');
        toast.error('ESP32 not responding');
      }
    } catch (error) {
      setConnectionStatus('error');
      setMpuStatus('error');
      toast.error('Failed to connect to ESP32. Check IP address and network.');
      console.error('Connection error:', error);
    }
  };

  // Start experiment - communicate directly with ESP32
  const handleStartExperiment = async () => {
    if (!selectedExperiment) {
      toast.error('Please select an experiment type');
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error('Please test ESP32 connection first');
      return;
    }

    try {
      // Start experiment on ESP32
      const esp32Response = await fetch(`http://${deviceIP}/set?mode=${selectedExperiment}`, {
        method: 'GET',
        mode: 'cors'
      });

      if (esp32Response.ok) {
        const esp32Data = await esp32Response.json();
        console.log('ESP32 Response:', esp32Data);
        
        // Start backend experiment
        const backendResponse = await startExperimentMutation.mutateAsync({
          experiment_type: selectedExperiment,
          device_id: deviceId,
          device_ip: deviceIP
        });

        setCurrentExperimentId(backendResponse.experiment_id);
        setIsRecording(true);
        toast.success('Experiment started on both ESP32 and backend!');
        startLiveDataPolling();
      } else {
        toast.error('Failed to start experiment on ESP32');
      }
    } catch (error) {
      console.error('Start experiment error:', error);
      toast.error('Failed to start experiment: ' + error.message);
    }
  };

  // Stop experiment - communicate with both ESP32 and backend
  const handleStopExperiment = async () => {
    try {
      // Stop ESP32 experiment
      const esp32Response = await fetch(`http://${deviceIP}/stop`, {
        method: 'GET',
        mode: 'cors'
      });

      if (esp32Response.ok) {
        console.log('ESP32 experiment stopped');
      }

      // Stop backend experiment
      if (currentExperimentId) {
        await stopExperimentMutation.mutateAsync(currentExperimentId);
      }

      setIsRecording(false);
      setCurrentExperimentId(null);
      stopLiveDataPolling();
      toast.success('Experiment stopped successfully!');
    } catch (error) {
      console.error('Stop experiment error:', error);
      toast.error('Failed to stop experiment: ' + error.message);
    }
  };

  // Download CSV from ESP32
  const downloadESP32CSV = async () => {
    try {
      const response = await fetch(`http://${deviceIP}/csv`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        const csvContent = await response.text();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `esp32_${selectedExperiment}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV downloaded from ESP32!');
      } else {
        toast.error('Failed to download CSV from ESP32');
      }
    } catch (error) {
      toast.error('CSV download failed: ' + error.message);
    }
  };

  // Analyze CSV with AI
  const analyzeWithAI = async () => {
    if (liveData.length === 0) {
      toast.error('No data to analyze. Start an experiment first.');
      return;
    }

    try {
      // Convert live data to CSV format
      const csvData = liveData.map((point, index) => ({
        time: (index * 1.0).toFixed(3), // Assuming 1 second intervals
        value: point.value.toFixed(6),
        ax: point.raw_data?.ax || 0,
        ay: point.raw_data?.ay || 0,
        az: point.raw_data?.az || 0
      }));

      // Send to AI for analysis
      const analysisPrompt = `Analyze this ${selectedExperiment} experiment data:

Experiment Type: ${selectedExperiment}
Data Points: ${csvData.length}
Duration: ${csvData.length} seconds
${selectedExperiment === 'pendulum' ? 'Unit: degrees (angle)' : 'Unit: m/s² (acceleration)'}

Sample Data:
${csvData.slice(0, 10).map(d => `Time: ${d.time}s, Value: ${d.value}`).join('\n')}

Please provide:
1. Physics analysis (period, frequency, amplitude for pendulum OR acceleration analysis for freefall)
2. Data quality assessment
3. Theoretical vs experimental comparison
4. Recommendations for improvement
5. Key physics principles demonstrated

Make it educational and detailed.`;

      const aiResponse = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: analysisPrompt,
          context: {
            experiment: selectedExperiment,
            data_points: csvData.length,
            analysis_mode: true
          }
        })
      });

      // Show AI analysis in a modal or new section
      setAiAnalysis(aiResponse.response);
      toast.success('AI analysis completed!');
      
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('AI analysis failed: ' + error.message);
    }
  };

  // Test MPU6050 connection
  const testMPU = async () => {
    try {
      const response = await fetch(`http://${deviceIP}/test-mpu`, { mode: 'cors' });
      const data = await response.json();
      if (data.connected) {
        toast.success('MPU6050 is connected and working!');
        setMpuStatus('connected');
      } else {
        toast.warning('MPU6050 not detected - using simulated data for testing');
        setMpuStatus('disconnected');
      }
    } catch (error) {
      toast.error('Failed to test MPU6050: ' + error.message);
      setMpuStatus('error');
    }
  };

  // Simple SVG Chart Component with smooth curves
  const SimpleChart = ({ data, label, unit }) => {
    if (!data || data.length === 0) return null;

    const width = 800;
    const height = 300;
    const padding = 40;
    
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    
    // Create smooth curve path using cubic bezier
    const createSmoothPath = (points) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        if (i === 1) {
          // First curve
          const cp1x = prev.x + (curr.x - prev.x) * 0.3;
          const cp1y = prev.y;
          const cp2x = curr.x - (curr.x - prev.x) * 0.3;
          const cp2y = curr.y;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else if (i === points.length - 1) {
          // Last curve
          const cp1x = prev.x + (curr.x - prev.x) * 0.3;
          const cp1y = prev.y;
          const cp2x = curr.x - (curr.x - prev.x) * 0.3;
          const cp2y = curr.y;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
          // Middle curves with smooth transitions
          const prevPoint = points[i - 2] || prev;
          const cp1x = prev.x + (curr.x - prevPoint.x) * 0.2;
          const cp1y = prev.y + (curr.y - prevPoint.y) * 0.2;
          const cp2x = curr.x - (next.x - prev.x) * 0.2;
          const cp2y = curr.y - (next.y - prev.y) * 0.2;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }
      }
      
      return path;
    };

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = padding + ((maxValue - point.value) / range) * (height - 2 * padding);
      return { x, y, value: point.value };
    });

    const smoothPath = createSmoothPath(points);

    return (
      <div className="w-full bg-slate-900 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 text-center">
          {label} - Live Data ({data.length} points)
        </h4>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border border-slate-700 rounded">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="1"/>
            </pattern>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#06b6d4" strokeWidth="2"/>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#06b6d4" strokeWidth="2"/>
          
          {/* Area under curve */}
          {data.length > 1 && (
            <path
              d={`${smoothPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#areaGradient)"
            />
          )}
          
          {/* Smooth curve line */}
          {data.length > 1 && (
            <path
              d={smoothPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          
          {/* Data points (recent ones) */}
          {points.slice(-10).map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#06b6d4"
              opacity="0.8"
            />
          ))}
          
          {/* Labels */}
          <text x={width / 2} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="12">
            Time (s)
          </text>
          <text x={15} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize="12" transform={`rotate(-90, 15, ${height / 2})`}>
            {unit}
          </text>
          
          {/* Value indicators */}
          <text x={width - padding - 10} y={padding + 15} textAnchor="end" fill="#94a3b8" fontSize="10">
            Max: {maxValue.toFixed(2)}
          </text>
          <text x={width - padding - 10} y={height - padding - 5} textAnchor="end" fill="#94a3b8" fontSize="10">
            Min: {minValue.toFixed(2)}
          </text>
          
          {/* Current value indicator */}
          {data.length > 0 && (
            <text x={width / 2} y={30} textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="bold">
              Current: {data[data.length - 1].value.toFixed(3)} {unit}
            </text>
          )}
        </svg>
      </div>
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20';
      case 'testing': return 'text-amber-400 border-amber-500/30 bg-amber-500/20';
      case 'error': return 'text-rose-400 border-rose-500/30 bg-rose-500/20';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/20';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle2 className="w-4 h-4" />;
      case 'testing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Hardware Physics Lab</h1>
        <p className="text-slate-400">Connect your ESP32 device and perform real physics experiments</p>
      </div>

      {/* Device Connection */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          ESP32 Device Connection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Device IP Address</label>
            <input
              value={deviceIP}
              onChange={(e) => setDeviceIP(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 focus:outline-none"
              disabled={isRecording}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Device ID</label>
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="esp32_physics_lab"
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 focus:outline-none"
              disabled={isRecording}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={testConnection}
              disabled={isRecording || connectionStatus === 'testing'}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`border ${getConnectionStatusColor()}`}>
            {getConnectionStatusIcon()}
            <span className="ml-2 capitalize">{connectionStatus}</span>
          </Badge>
          <Badge className={`border ${
            mpuStatus === 'connected' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20' :
            mpuStatus === 'disconnected' ? 'text-amber-400 border-amber-500/30 bg-amber-500/20' :
            'text-slate-400 border-slate-500/30 bg-slate-500/20'
          }`}>
            {mpuStatus === 'connected' ? '🔧 MPU: OK' : 
             mpuStatus === 'disconnected' ? '🔧 MPU: Simulated' : 
             '🔧 MPU: Unknown'}
          </Badge>
          {connectionStatus === 'connected' && (
            <span className="text-sm text-slate-400">Ready for experiments</span>
          )}
        </div>
      </Card>

      {/* Experiment Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experiment Setup */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Experiment Setup
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Select Experiment</label>
              <select
                value={selectedExperiment}
                onChange={(e) => setSelectedExperiment(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 text-white"
                disabled={isRecording}
              >
                <option value="">Choose an experiment...</option>
                <option value="pendulum">Simple Pendulum</option>
                <option value="freefall">Free Fall</option>
              </select>
            </div>

            {selectedExperiment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30"
              >
                <h4 className="text-purple-400 font-medium mb-2">
                  {selectedExperiment === 'pendulum' ? '🎯 Simple Pendulum' : '⚡ Free Fall'}
                </h4>
                <p className="text-sm text-slate-300">
                  {selectedExperiment === 'pendulum' 
                    ? 'Measures angular displacement using MPU6050 accelerometer to study harmonic motion, period, and damping effects.'
                    : 'Measures acceleration during free fall using MPU6050 to verify gravitational acceleration and study motion dynamics.'
                  }
                </p>
              </motion.div>
            )}

            <div className="flex gap-3">
              {!isRecording ? (
                <>
                  <Button
                    onClick={handleStartExperiment}
                    disabled={!selectedExperiment || connectionStatus !== 'connected' || startExperimentMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {startExperimentMutation.isPending ? 'Starting...' : 'Start Experiment'}
                  </Button>
                  <Button
                    onClick={testMPU}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Test MPU
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleStopExperiment}
                    disabled={stopExperimentMutation.isPending}
                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {stopExperimentMutation.isPending ? 'Stopping...' : 'Stop Experiment'}
                  </Button>
                  <Button
                    onClick={downloadESP32CSV}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={analyzeWithAI}
                    disabled={liveData.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Analysis
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Live Data Display */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Live Data
          </h2>

          {isRecording ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Recording
                </Badge>
                <span className="text-sm text-slate-400">
                  {liveData.length} data points
                </span>
              </div>
              
              {liveData.length > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {liveData[liveData.length - 1]?.value.toFixed(3)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {selectedExperiment === 'pendulum' ? 'degrees' : 'm/s²'}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Last update: {new Date(liveData[liveData.length - 1]?.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
              
              {liveData.length === 0 && (
                <div className="text-center py-4 text-amber-400">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p>Waiting for data from ESP32...</p>
                  <p className="text-xs text-slate-500 mt-1">Check ESP32 connection and experiment status</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start an experiment to see live data</p>
            </div>
          )}
        </Card>
      </div>

      {/* Live Chart */}
      {isRecording && liveData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Real-time Graph
          </h2>
          <SimpleChart 
            data={liveData} 
            label={selectedExperiment === 'pendulum' ? 'Pendulum Motion' : 'Free Fall Acceleration'}
            unit={selectedExperiment === 'pendulum' ? 'Angle (°)' : 'Acceleration (m/s²)'}
          />
        </Card>
      )}

      {/* CSV Upload for AI Analysis */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-green-400" />
          AI Analysis Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Data Analysis */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <h4 className="text-purple-400 font-medium mb-2">📊 Live Data Analysis</h4>
            <p className="text-sm text-slate-300 mb-3">
              Analyze current experiment data with AI for physics insights
            </p>
            <Button
              onClick={analyzeWithAI}
              disabled={liveData.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analyze Current Data ({liveData.length} points)
            </Button>
          </div>

          {/* CSV Upload Analysis */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <h4 className="text-green-400 font-medium mb-2">📁 Upload CSV Analysis</h4>
            <p className="text-sm text-slate-300 mb-3">
              Upload any physics experiment CSV for AI analysis
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const analysisPrompt = `Analyze this physics experiment CSV data:

Filename: ${file.name}
File size: ${file.size} bytes

CSV Content (first 1000 characters):
${text.substring(0, 1000)}

Please provide:
1. Experiment type identification (pendulum, freefall, etc.)
2. Physics analysis and calculations
3. Data quality assessment
4. Key findings and insights
5. Educational explanations
6. Recommendations for improvement

Make it detailed and educational.`;

                    const aiResponse = await apiRequest('/api/ai/chat', {
                      method: 'POST',
                      body: JSON.stringify({
                        message: analysisPrompt,
                        context: { analysis_mode: true, csv_upload: true }
                      })
                    });

                    setAiAnalysis(aiResponse.response);
                    toast.success('CSV analyzed successfully!');
                  } catch (error) {
                    toast.error('Failed to analyze CSV: ' + error.message);
                  }
                }
              }}
              className="w-full p-2 rounded border border-slate-600 bg-slate-900 text-white text-sm"
            />
          </div>
        </div>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-purple-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Analysis Results
            </h2>
            <Button
              onClick={() => setAiAnalysis('')}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1 text-slate-200">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1 text-slate-200">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed text-slate-200">{children}</li>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="px-2 py-1 rounded-md bg-slate-800 text-cyan-400 font-mono text-sm border border-slate-700">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-3">
                        <code className="text-cyan-400 font-mono text-sm">{children}</code>
                      </pre>
                    ),
                  pre: ({ children }) => <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-3">{children}</div>,
                  strong: ({ children }) => <strong className="text-cyan-400 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-purple-400 italic">{children}</em>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 border-b border-slate-700 pb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium text-white mb-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 bg-slate-800/50 rounded-r-lg mb-3 text-slate-300 italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-3">
                      <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-slate-800">{children}</thead>,
                  tbody: ({ children }) => <tbody className="bg-slate-900/50">{children}</tbody>,
                  tr: ({ children }) => <tr className="border-b border-slate-700">{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-2 text-left text-cyan-400 font-semibold">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 text-slate-200">{children}</td>,
                  // Math components for KaTeX
                  span: ({ className, children, ...props }) => {
                    if (className?.includes('math')) {
                      return <span className={`${className} text-cyan-300`} {...props}>{children}</span>;
                    }
                    return <span className={className} {...props}>{children}</span>;
                  },
                  div: ({ className, children, ...props }) => {
                    if (className?.includes('math')) {
                      return <div className={`${className} text-center my-3 text-cyan-300`} {...props}>{children}</div>;
                    }
                    return <div className={className} {...props}>{children}</div>;
                  }
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(aiAnalysis);
                toast.success('Analysis copied to clipboard!');
              }}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Copy Analysis
            </Button>
            <Button
              onClick={downloadESP32CSV}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Data
            </Button>
          </div>
        </Card>
      )}

      {/* Previous Experiments */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-green-400" />
          Previous Experiments
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-slate-700" />
            ))}
          </div>
        ) : experimentsData?.experiments?.length > 0 ? (
          <div className="space-y-3">
            {experimentsData.experiments.map((experiment) => (
              <motion.div
                key={experiment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      {experiment.experiment_type === 'pendulum' ? '🎯' : '⚡'}
                    </div>
                    <div>
                      <h4 className="text-white font-medium capitalize">
                        {experiment.experiment_type} Experiment
                      </h4>
                      <p className="text-sm text-slate-400">
                        {new Date(experiment.createdAt).toLocaleDateString()} • 
                        {experiment.duration ? ` ${experiment.duration.toFixed(1)}s` : ' In progress'} • 
                        {experiment.data_points?.length || 0} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${
                      experiment.status === 'analyzed' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20' :
                      experiment.status === 'analyzing' ? 'text-amber-400 border-amber-500/30 bg-amber-500/20' :
                      'text-slate-400 border-slate-500/30 bg-slate-500/20'
                    }`}>
                      {experiment.status}
                    </Badge>
                    
                    {experiment.status === 'analyzed' && (
                      <Button
                        onClick={() => downloadCSV(experiment._id)}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* AI Analysis Preview */}
                {experiment.ai_insights && (
                  <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-400 font-medium mb-1">AI Analysis</p>
                    <p className="text-sm text-slate-300">{experiment.ai_insights.summary}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No experiments yet. Start your first hardware experiment!</p>
          </div>
        )}
      </Card>
    </div>
  );
}