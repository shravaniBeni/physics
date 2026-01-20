import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProjectileSimulation({ onDataUpdate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [velocity, setVelocity] = useState(30);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.8);
  const [time, setTime] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trajectory, setTrajectory] = useState([]);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const angleRad = angle * (Math.PI / 180);
  const vx = velocity * Math.cos(angleRad);
  const vy = velocity * Math.sin(angleRad);
  const timeOfFlight = (2 * vy) / gravity;
  const maxHeight = (vy * vy) / (2 * gravity);
  const range = (velocity * velocity * Math.sin(2 * angleRad)) / gravity;

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - time * 1000;
      
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        const x = vx * elapsed;
        const y = vy * elapsed - 0.5 * gravity * elapsed * elapsed;
        
        if (y < 0) {
          setIsPlaying(false);
          return;
        }
        
        setTime(elapsed);
        setPosition({ x, y });
        setTrajectory(prev => [...prev, { x: x.toFixed(2), y: y.toFixed(2) }].slice(-100));
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, vx, vy, gravity, time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const scale = Math.min(canvas.width / (range * 1.2), canvas.height / (maxHeight * 1.5));
    const groundY = canvas.height - 40;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, canvas.width, 40);
    
    // Draw grass
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i, groundY - 5);
      ctx.stroke();
    }
    
    // Draw trajectory path
    if (trajectory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      trajectory.forEach((p, i) => {
        const screenX = 40 + parseFloat(p.x) * scale;
        const screenY = groundY - parseFloat(p.y) * scale;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      });
      ctx.stroke();
    }
    
    // Draw predicted trajectory
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.setLineDash([5, 5]);
    for (let t = 0; t <= timeOfFlight; t += 0.05) {
      const px = vx * t;
      const py = vy * t - 0.5 * gravity * t * t;
      const screenX = 40 + px * scale;
      const screenY = groundY - py * scale;
      if (t === 0) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw projectile
    const screenX = 40 + position.x * scale;
    const screenY = groundY - position.y * scale;
    
    const gradient = ctx.createRadialGradient(screenX - 3, screenY - 3, 0, screenX, screenY, 12);
    gradient.addColorStop(0, '#f59e0b');
    gradient.addColorStop(1, '#d97706');
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw launcher
    ctx.save();
    ctx.translate(40, groundY);
    ctx.rotate(-angleRad);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-5, -8, 40, 16);
    ctx.restore();
    
  }, [position, trajectory, range, maxHeight, angleRad, vx, vy, gravity, timeOfFlight]);

  const reset = () => {
    setIsPlaying(false);
    setTime(0);
    setPosition({ x: 0, y: 0 });
    setTrajectory([]);
  };

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        range: range.toFixed(2),
        maxHeight: maxHeight.toFixed(2),
        timeOfFlight: timeOfFlight.toFixed(2),
        currentX: position.x.toFixed(2),
        currentY: position.y.toFixed(2)
      });
    }
  }, [range, maxHeight, timeOfFlight, position]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Canvas */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <canvas
            ref={canvasRef}
            width={500}
            height={300}
            className="w-full rounded-lg bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          />
          
          <div className="flex justify-center gap-3 mt-4">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Launch'}
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
          <h3 className="text-lg font-semibold text-white">Launch Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Initial Velocity (v₀)</span>
                <span className="text-cyan-400 font-mono">{velocity} m/s</span>
              </div>
              <Slider
                value={[velocity]}
                onValueChange={([v]) => { setVelocity(v); reset(); }}
                min={10}
                max={50}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Launch Angle (θ)</span>
                <span className="text-purple-400 font-mono">{angle}°</span>
              </div>
              <Slider
                value={[angle]}
                onValueChange={([v]) => { setAngle(v); reset(); }}
                min={15}
                max={75}
                step={1}
                className="[&_[role=slider]]:bg-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Gravity (g)</span>
                <span className="text-orange-400 font-mono">{gravity.toFixed(1)} m/s²</span>
              </div>
              <Slider
                value={[gravity]}
                onValueChange={([v]) => { setGravity(v); reset(); }}
                min={1}
                max={20}
                step={0.1}
                className="[&_[role=slider]]:bg-orange-500"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Predicted Values</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Range</p>
                <p className="text-lg font-mono text-cyan-400">{range.toFixed(2)} m</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Max Height</p>
                <p className="text-lg font-mono text-purple-400">{maxHeight.toFixed(2)} m</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Time of Flight</p>
                <p className="text-lg font-mono text-emerald-400">{timeOfFlight.toFixed(2)} s</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Current Position</p>
                <p className="text-lg font-mono text-amber-400">({position.x.toFixed(1)}, {position.y.toFixed(1)})</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trajectory Graph */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trajectory (Y vs X)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="x" 
                stroke="#64748b"
                label={{ value: 'Horizontal Distance (m)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#f59e0b" 
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