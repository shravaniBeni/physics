import React, { useState, useEffect } from 'react';
import { Slider } from '../ui/slider';
import { Card } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Gauge, Activity } from 'lucide-react';

export default function OhmsLawSimulation({ onDataUpdate }) {
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(100);
  const [dataPoints, setDataPoints] = useState([]);

  const current = voltage / resistance;
  const power = voltage * current;

  useEffect(() => {
    // Generate V-I characteristic data
    const points = [];
    for (let v = 0; v <= voltage; v += voltage / 10) {
      points.push({
        voltage: v.toFixed(1),
        current: (v / resistance * 1000).toFixed(2) // in mA
      });
    }
    setDataPoints(points);
  }, [voltage, resistance]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        voltage: voltage.toFixed(2),
        current: (current * 1000).toFixed(2),
        resistance: resistance.toFixed(0),
        power: power.toFixed(3)
      });
    }
  }, [voltage, resistance, current, power]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circuit Visualization */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Circuit Diagram</h3>
          <div className="relative h-64 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-4">
            {/* Battery */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-20 border-2 border-cyan-500 rounded-lg flex flex-col items-center justify-center relative">
                <span className="text-cyan-400 text-lg font-bold">+</span>
                <div className="w-8 h-1 bg-cyan-500 my-1"></div>
                <span className="text-cyan-400 text-sm">−</span>
              </div>
              <span className="text-xs text-slate-400 mt-2">{voltage}V</span>
            </div>

            {/* Wires and current flow */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
              {/* Top wire */}
              <path 
                d="M 80 60 L 200 60" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                fill="none"
              />
              {/* Right wire */}
              <path 
                d="M 280 60 L 350 60 L 350 140 L 280 140" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                fill="none"
              />
              {/* Bottom wire */}
              <path 
                d="M 200 140 L 80 140 L 80 100" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                d="M 80 60 L 80 100" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                fill="none"
              />

              {/* Current arrows */}
              <polygon points="180,55 190,60 180,65" fill="#fbbf24" />
              <polygon points="345,80 350,90 355,80" fill="#fbbf24" />
              
              {/* Ammeter */}
              <circle cx="320" cy="100" r="20" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
              <text x="320" y="105" textAnchor="middle" fill="#8b5cf6" fontSize="12">A</text>
            </svg>

            {/* Resistor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-24 h-10 bg-slate-700 rounded border-2 border-orange-500 flex items-center justify-center">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1.5 h-6 bg-orange-500/50 skew-x-12"></div>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400 block text-center mt-2">{resistance}Ω</span>
            </div>

            {/* Current indicator */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-mono">{(current * 1000).toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-400 mt-1">mA</span>
            </div>
          </div>
        </Card>

        {/* Parameters */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Adjust Parameters</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Voltage (V)
                </span>
                <span className="text-yellow-400 font-mono">{voltage} V</span>
              </div>
              <Slider
                value={[voltage]}
                onValueChange={([v]) => setVoltage(v)}
                min={1}
                max={24}
                step={0.5}
                className="[&_[role=slider]]:bg-yellow-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  Resistance (R)
                </span>
                <span className="text-orange-400 font-mono">{resistance} Ω</span>
              </div>
              <Slider
                value={[resistance]}
                onValueChange={([v]) => setResistance(v)}
                min={10}
                max={1000}
                step={10}
                className="[&_[role=slider]]:bg-orange-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="pt-4 border-t border-slate-700 space-y-4">
            <h4 className="text-sm font-medium text-slate-300">Calculated Values</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs">Current (I)</span>
                </div>
                <p className="text-2xl font-mono text-white">{(current * 1000).toFixed(2)}</p>
                <p className="text-xs text-slate-400">milliamps (mA)</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">Power (P)</span>
                </div>
                <p className="text-2xl font-mono text-white">{(power * 1000).toFixed(2)}</p>
                <p className="text-xs text-slate-400">milliwatts (mW)</p>
              </div>
            </div>

            {/* Formula Display */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Ohm's Law Formula:</p>
              <p className="text-lg font-mono text-cyan-400 text-center">
                I = V / R = {voltage} / {resistance} = {(current * 1000).toFixed(2)} mA
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* V-I Graph */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Voltage vs Current Characteristic</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="voltage" 
                stroke="#64748b"
                label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                label={{ value: 'Current (mA)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line 
                type="linear" 
                dataKey="current" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-400 text-center mt-4">
          The linear relationship shows that current is directly proportional to voltage (Ohmic behavior)
        </p>
      </Card>
    </div>
  );
}