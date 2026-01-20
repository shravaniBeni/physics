import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function WaveSimulation({ onDataUpdate }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [amplitude, setAmplitude] = useState(50);
  const [frequency, setFrequency] = useState(1);
  const [wavelength, setWavelength] = useState(100);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  const waveSpeed = frequency * wavelength;
  const period = 1 / frequency;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.02;
      }
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      
      // Vertical grid lines
      for (let x = 0; x < width; x += wavelength) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = '#1e293b';
        ctx.stroke();
      }
      
      // Draw wavelength indicator
      if (wavelength < width) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(50, 30);
        ctx.lineTo(50 + wavelength, 30);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Arrows
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.moveTo(50, 30);
        ctx.lineTo(60, 25);
        ctx.lineTo(60, 35);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(50 + wavelength, 30);
        ctx.lineTo(40 + wavelength, 25);
        ctx.lineTo(40 + wavelength, 35);
        ctx.fill();
        
        ctx.fillStyle = '#8b5cf6';
        ctx.font = '12px monospace';
        ctx.fillText(`λ = ${wavelength}px`, 50 + wavelength/2 - 30, 25);
      }
      
      // Draw amplitude indicator
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(20, centerY);
      ctx.lineTo(20, centerY - amplitude);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#06b6d4';
      ctx.font = '12px monospace';
      ctx.fillText(`A = ${amplitude}px`, 25, centerY - amplitude/2);
      
      // Draw wave
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      
      for (let x = 0; x < width; x++) {
        const k = (2 * Math.PI) / wavelength;
        const omega = 2 * Math.PI * frequency;
        const y = centerY - amplitude * Math.sin(k * x - omega * timeRef.current);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw particles
      for (let x = 0; x < width; x += wavelength / 4) {
        const k = (2 * Math.PI) / wavelength;
        const omega = 2 * Math.PI * frequency;
        const y = centerY - amplitude * Math.sin(k * x - omega * timeRef.current);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, amplitude, frequency, wavelength]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        amplitude: amplitude.toFixed(0),
        frequency: frequency.toFixed(2),
        wavelength: wavelength.toFixed(0),
        waveSpeed: waveSpeed.toFixed(2),
        period: period.toFixed(3)
      });
    }
  }, [amplitude, frequency, wavelength, waveSpeed, period]);

  const reset = () => {
    timeRef.current = 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wave Canvas */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <canvas
            ref={canvasRef}
            width={500}
            height={300}
            className="w-full rounded-lg bg-gradient-to-b from-slate-900 to-slate-800"
          />
          
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
          <h3 className="text-lg font-semibold text-white">Wave Properties</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Amplitude (A)</span>
                <span className="text-cyan-400 font-mono">{amplitude} px</span>
              </div>
              <Slider
                value={[amplitude]}
                onValueChange={([v]) => setAmplitude(v)}
                min={10}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Frequency (f)</span>
                <span className="text-purple-400 font-mono">{frequency.toFixed(2)} Hz</span>
              </div>
              <Slider
                value={[frequency]}
                onValueChange={([v]) => setFrequency(v)}
                min={0.2}
                max={3}
                step={0.1}
                className="[&_[role=slider]]:bg-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Wavelength (λ)</span>
                <span className="text-orange-400 font-mono">{wavelength} px</span>
              </div>
              <Slider
                value={[wavelength]}
                onValueChange={([v]) => setWavelength(v)}
                min={50}
                max={200}
                step={10}
                className="[&_[role=slider]]:bg-orange-500"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Calculated Values</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Wave Speed (v)</p>
                <p className="text-lg font-mono text-cyan-400">{waveSpeed.toFixed(2)} px/s</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500">Period (T)</p>
                <p className="text-lg font-mono text-purple-400">{period.toFixed(3)} s</p>
              </div>
            </div>

            {/* Formula Display */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Wave Equation:</p>
              <p className="text-center font-mono text-cyan-400">
                v = f × λ = {frequency.toFixed(2)} × {wavelength} = {waveSpeed.toFixed(2)} px/s
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Wave Properties Info */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Understanding Wave Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <h4 className="text-cyan-400 font-medium mb-2">Amplitude</h4>
            <p className="text-sm text-slate-400">
              Maximum displacement from the equilibrium position. Represents the wave's energy.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <h4 className="text-purple-400 font-medium mb-2">Frequency</h4>
            <p className="text-sm text-slate-400">
              Number of complete oscillations per second. Measured in Hertz (Hz).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <h4 className="text-orange-400 font-medium mb-2">Wavelength</h4>
            <p className="text-sm text-slate-400">
              Distance between two consecutive points in phase. Related to wave speed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}