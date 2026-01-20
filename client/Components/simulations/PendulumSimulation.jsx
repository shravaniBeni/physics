import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PendulumSimulation({ onDataUpdate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [length, setLength] = useState(1.5);
  const [angle, setAngle] = useState(30);
  const [gravity, setGravity] = useState(9.8);
  const [time, setTime] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(30);
  const [data, setData] = useState([]);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const period = 2 * Math.PI * Math.sqrt(length / gravity);
  const omega = Math.sqrt(gravity / length);

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - time * 1000;
      
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTime(elapsed);
        
        const theta = angle * Math.cos(omega * elapsed) * (Math.PI / 180);
        setCurrentAngle(theta * (180 / Math.PI));
        
        setData(prev => {
          const newData = [...prev, { time: elapsed.toFixed(2), angle: (theta * 180 / Math.PI).toFixed(2) }];
          return newData.slice(-50);
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, angle, omega, time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = 60;
    const scale = 120;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pivot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
    
    // Calculate bob position
    const theta = currentAngle * (Math.PI / 180);
    const bobX = centerX + Math.sin(theta) * length * scale;
    const bobY = centerY + Math.cos(theta) * length * scale;
    
    // Draw string
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw bob with gradient
    const gradient = ctx.createRadialGradient(bobX - 5, bobY - 5, 0, bobX, bobY, 25);
    gradient.addColorStop(0, '#06b6d4');
    gradient.addColorStop(1, '#0891b2');
    
    ctx.beginPath();
    ctx.arc(bobX, bobY, 20, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw shadow
    ctx.beginPath();
    ctx.ellipse(bobX, canvas.height - 20, 15, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    
  }, [currentAngle, length]);

  const reset = () => {
    setIsPlaying(false);
    setTime(0);
    setCurrentAngle(angle);
    setData([]);
  };

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        period: period.toFixed(3),
        frequency: (1 / period).toFixed(3),
        currentAngle: currentAngle.toFixed(2),
        time: time.toFixed(2)
      });
    }
  }, [period, currentAngle, time]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Canvas */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <canvas
            ref={canvasRef}
            width={400}
            height={350}
            className="w-full rounded-lg bg-gradient-to-b from-slate-900 to-slate-800"
          />
          
          {/* Controls */}
          <div className="flex justify-center gap-3 mt-4">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </Card>

        {/* Parameters */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-4">Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">String Length (L)</span>
                <span className="text-cyan-400 font-mono">{length.toFixed(2)} m</span>
              </div>
              <Slider
                value={[length]}
                onValueChange={([v]) => { setLength(v); reset(); }}
                min={0.5}
                max={3}
                step={0.1}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Initial Angle (θ)</span>
                <span className="text-cyan-400 font-mono">{angle}°</span>
              </div>
              <Slider
                value={[angle]}
                onValueChange={([v]) => { setAngle(v); reset(); }}
                min={5}
                max={45}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Gravity (g)</span>
                <span className="text-cyan-400 font-mono">{gravity.toFixed(1)} m/s²</span>
              </div>
              <Slider
                value={[gravity]}
                onValueChange={([v]) => { setGravity(v); reset(); }}
                min={1}
                max={20}
                step={0.1}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Calculated Values</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Period (T)</p>
                <p className="text-lg font-mono text-cyan-400">{period.toFixed(3)} s</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Frequency (f)</p>
                <p className="text-lg font-mono text-purple-400">{(1/period).toFixed(3)} Hz</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Current Angle</p>
                <p className="text-lg font-mono text-emerald-400">{currentAngle.toFixed(2)}°</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Time Elapsed</p>
                <p className="text-lg font-mono text-amber-400">{time.toFixed(2)} s</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Graph */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Angle vs Time Graph</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line 
                type="monotone" 
                dataKey="angle" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}