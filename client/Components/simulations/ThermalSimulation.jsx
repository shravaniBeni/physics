import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Play, Pause, RotateCcw, Thermometer, Zap } from 'lucide-react';

export default function ThermalSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [temperature, setTemperature] = useState([25]);
  const [material, setMaterial] = useState('aluminum');
  const [length, setLength] = useState([100]);
  const [time, setTime] = useState(0);
  const [expansion, setExpansion] = useState(0);

  const materials = {
    aluminum: { coefficient: 23e-6, color: '#C0C0C0', name: 'Aluminum' },
    steel: { coefficient: 12e-6, color: '#4A5568', name: 'Steel' },
    copper: { coefficient: 17e-6, color: '#B7791F', name: 'Copper' },
    brass: { coefficient: 19e-6, color: '#DAA520', name: 'Brass' }
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    // Calculate thermal expansion: ΔL = α * L₀ * ΔT
    const deltaT = temperature[0] - 25; // Reference temperature 25°C
    const alpha = materials[material].coefficient;
    const L0 = length[0];
    const deltaL = alpha * L0 * deltaT;
    setExpansion(deltaL);
  }, [temperature, material, length]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setTemperature([25]);
    setLength([100]);
    setExpansion(0);
  };

  const getTemperatureColor = (temp) => {
    if (temp < 30) return '#3B82F6'; // Blue
    if (temp < 60) return '#10B981'; // Green
    if (temp < 90) return '#F59E0B'; // Yellow
    if (temp < 120) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-400" />
            Thermal Expansion Simulation
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={reset} variant="outline" className="border-slate-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Temperature Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Temperature: {temperature[0]}°C
            </label>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={20}
              max={200}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>20°C</span>
              <span>200°C</span>
            </div>
          </div>

          {/* Length Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Original Length: {length[0]} mm
            </label>
            <Slider
              value={length}
              onValueChange={setLength}
              min={50}
              max={500}
              step={10}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>50 mm</span>
              <span>500 mm</span>
            </div>
          </div>

          {/* Material Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Material
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(materials).map(([key, mat]) => (
                <button
                  key={key}
                  onClick={() => setMaterial(key)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                    material === key
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {mat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Visualization */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Material Expansion Visualization</h4>
        
        <div className="space-y-6">
          {/* Rod Visualization */}
          <div className="relative">
            <div className="text-sm text-slate-400 mb-2">Material Rod (not to scale)</div>
            <div className="relative bg-slate-900 rounded-lg p-4 h-24 flex items-center">
              <div
                className="h-8 rounded transition-all duration-500"
                style={{
                  width: `${Math.max(20, (length[0] + expansion) / 5)}px`,
                  backgroundColor: materials[material].color,
                  boxShadow: `0 0 ${Math.max(0, (temperature[0] - 25) / 10)}px ${getTemperatureColor(temperature[0])}40`
                }}
              />
              <div className="ml-4 text-xs text-slate-500">
                Length: {(length[0] + expansion).toFixed(4)} mm
              </div>
            </div>
          </div>

          {/* Measurements Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Temperature</div>
              <div className="text-lg font-semibold" style={{ color: getTemperatureColor(temperature[0]) }}>
                {temperature[0]}°C
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Expansion</div>
              <div className="text-lg font-semibold text-orange-400">
                {expansion.toFixed(4)} mm
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Coefficient (α)</div>
              <div className="text-lg font-semibold text-cyan-400">
                {(materials[material].coefficient * 1e6).toFixed(1)} × 10⁻⁶/°C
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Strain</div>
              <div className="text-lg font-semibold text-purple-400">
                {((expansion / length[0]) * 100).toFixed(6)}%
              </div>
            </div>
          </div>

          {/* Formula Display */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Formula: ΔL = α × L₀ × ΔT</div>
            <div className="text-sm font-mono text-slate-300">
              ΔL = {(materials[material].coefficient * 1e6).toFixed(1)} × 10⁻⁶ × {length[0]} × {temperature[0] - 25} = {expansion.toFixed(4)} mm
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Instructions
        </h4>
        <div className="space-y-2 text-sm text-slate-300">
          <p>• Adjust the temperature slider to heat the material</p>
          <p>• Change the original length to see how it affects expansion</p>
          <p>• Try different materials to compare their expansion coefficients</p>
          <p>• Observe how thermal expansion is proportional to temperature change</p>
          <p>• Note that different materials expand at different rates</p>
        </div>
      </Card>
    </div>
  );
}