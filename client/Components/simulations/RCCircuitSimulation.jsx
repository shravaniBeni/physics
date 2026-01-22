import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Play, Pause, RotateCcw, Zap, Battery, CircuitBoard } from 'lucide-react';

export default function RCCircuitSimulation() {
  const [isCharging, setIsCharging] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);
  const [resistance, setResistance] = useState([1000]);
  const [capacitance, setCapacitance] = useState([100]);
  const [voltage, setVoltage] = useState([12]);
  const [time, setTime] = useState(0);
  const [capacitorVoltage, setCapacitorVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [energy, setEnergy] = useState(0);

  const timeConstant = (resistance[0] * capacitance[0]) / 1000000; // Convert µF to F

  useEffect(() => {
    let interval;
    if (isCharging || isDischarging) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 0.05;
          
          let newVoltage, newCurrent;
          
          if (isCharging) {
            // Charging: V(t) = V₀(1 - e^(-t/RC))
            newVoltage = voltage[0] * (1 - Math.exp(-newTime / timeConstant));
            // Current: I(t) = (V₀/R) * e^(-t/RC)
            newCurrent = (voltage[0] / resistance[0]) * Math.exp(-newTime / timeConstant) * 1000; // Convert to mA
          } else if (isDischarging) {
            // Discharging: V(t) = V₀ * e^(-t/RC)
            const initialVoltage = capacitorVoltage || voltage[0];
            newVoltage = initialVoltage * Math.exp(-newTime / timeConstant);
            // Current: I(t) = -(V₀/R) * e^(-t/RC) (negative for discharging)
            newCurrent = -(initialVoltage / resistance[0]) * Math.exp(-newTime / timeConstant) * 1000; // Convert to mA
          }
          
          setCapacitorVoltage(newVoltage);
          setCurrent(newCurrent);
          
          // Energy stored: E = ½CV²
          const energyStored = 0.5 * (capacitance[0] / 1000000) * newVoltage * newVoltage * 1000; // Convert to mJ
          setEnergy(energyStored);
          
          return newTime;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isCharging, isDischarging, resistance, capacitance, voltage, timeConstant, capacitorVoltage]);

  const startCharging = () => {
    setIsCharging(true);
    setIsDischarging(false);
    setTime(0);
  };

  const startDischarging = () => {
    setIsCharging(false);
    setIsDischarging(true);
    setTime(0);
  };

  const reset = () => {
    setIsCharging(false);
    setIsDischarging(false);
    setTime(0);
    setCapacitorVoltage(0);
    setCurrent(0);
    setEnergy(0);
  };

  const getPercentageCharged = () => {
    return (capacitorVoltage / voltage[0]) * 100;
  };

  const getTimeToPercentage = (percentage) => {
    if (percentage >= 99.9) return Infinity;
    return -timeConstant * Math.log(1 - percentage / 100);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CircuitBoard className="w-5 h-5 text-blue-400" />
            RC Circuit Simulation
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={startCharging}
              disabled={isCharging}
              className="bg-green-600 hover:bg-green-700"
            >
              <Battery className="w-4 h-4 mr-2" />
              Charge
            </Button>
            <Button
              onClick={startDischarging}
              disabled={isDischarging || capacitorVoltage < 0.1}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Discharge
            </Button>
            <Button onClick={reset} variant="outline" className="border-slate-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resistance Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Resistance: {resistance[0]} Ω
            </label>
            <Slider
              value={resistance}
              onValueChange={setResistance}
              min={100}
              max={10000}
              step={100}
              className="mb-2"
              disabled={isCharging || isDischarging}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>100 Ω</span>
              <span>10 kΩ</span>
            </div>
          </div>

          {/* Capacitance Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Capacitance: {capacitance[0]} µF
            </label>
            <Slider
              value={capacitance}
              onValueChange={setCapacitance}
              min={10}
              max={1000}
              step={10}
              className="mb-2"
              disabled={isCharging || isDischarging}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10 µF</span>
              <span>1000 µF</span>
            </div>
          </div>

          {/* Voltage Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Supply Voltage: {voltage[0]} V
            </label>
            <Slider
              value={voltage}
              onValueChange={setVoltage}
              min={3}
              max={24}
              step={1}
              className="mb-2"
              disabled={isCharging || isDischarging}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>3 V</span>
              <span>24 V</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Circuit Diagram */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Circuit Diagram</h4>
        
        <div className="flex justify-center">
          <div className="relative bg-slate-900 rounded-lg p-8 border border-slate-700">
            <svg width="400" height="200" viewBox="0 0 400 200" className="text-slate-300">
              {/* Circuit paths */}
              <path d="M 50 100 L 120 100" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M 180 100 L 250 100" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M 310 100 L 350 100" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M 350 100 L 350 150 L 50 150 L 50 100" stroke="currentColor" strokeWidth="2" fill="none" />
              
              {/* Battery */}
              <g transform="translate(50, 100)">
                <line x1="0" y1="-15" x2="0" y2="15" stroke="currentColor" strokeWidth="3" />
                <line x1="10" y1="-10" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
                <text x="15" y="5" fontSize="12" fill="currentColor">+</text>
                <text x="-20" y="5" fontSize="12" fill="currentColor">-</text>
                <text x="-10" y="-25" fontSize="10" fill="currentColor">{voltage[0]}V</text>
              </g>
              
              {/* Resistor */}
              <g transform="translate(120, 100)">
                <rect x="0" y="-8" width="60" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="2" />
                <text x="30" y="-15" fontSize="10" fill="currentColor" textAnchor="middle">{resistance[0]}Ω</text>
                <path d="M 10 -8 L 15 -15 L 25 8 L 35 -15 L 45 8 L 50 -8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </g>
              
              {/* Capacitor */}
              <g transform="translate(250, 100)">
                <line x1="0" y1="-20" x2="0" y2="20" stroke="currentColor" strokeWidth="3" />
                <line x1="10" y1="-20" x2="10" y2="20" stroke="currentColor" strokeWidth="3" />
                <text x="15" y="-25" fontSize="10" fill="currentColor">{capacitance[0]}µF</text>
                
                {/* Voltage indicator */}
                <text x="15" y="35" fontSize="10" fill="cyan" textAnchor="middle">
                  {capacitorVoltage.toFixed(1)}V
                </text>
              </g>
              
              {/* Current flow indicator */}
              {Math.abs(current) > 0.1 && (
                <g>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="orange" />
                    </marker>
                  </defs>
                  <path 
                    d={current > 0 ? "M 200 80 L 220 80" : "M 220 80 L 200 80"}
                    stroke="orange" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead)"
                  />
                  <text x="210" y="75" fontSize="10" fill="orange" textAnchor="middle">
                    {Math.abs(current).toFixed(1)}mA
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </Card>

      {/* Measurements and Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Values */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Current Measurements</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Time</div>
              <div className="text-xl font-semibold text-cyan-400">
                {time.toFixed(2)} s
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Capacitor Voltage</div>
              <div className="text-xl font-semibold text-green-400">
                {capacitorVoltage.toFixed(2)} V
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Current</div>
              <div className="text-xl font-semibold text-orange-400">
                {current.toFixed(2)} mA
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Energy Stored</div>
              <div className="text-xl font-semibold text-purple-400">
                {energy.toFixed(2)} mJ
              </div>
            </div>
          </div>

          {/* Charge Percentage */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Charge Level</span>
              <span>{getPercentageCharged().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getPercentageCharged(), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Status:</span>
            <Badge className={
              isCharging ? "bg-green-500/20 text-green-400" :
              isDischarging ? "bg-orange-500/20 text-orange-400" :
              "bg-slate-500/20 text-slate-400"
            }>
              {isCharging ? "Charging" : isDischarging ? "Discharging" : "Idle"}
            </Badge>
          </div>
        </Card>

        {/* Theory and Calculations */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Theory & Calculations</h4>
          
          <div className="space-y-4">
            {/* Time Constant */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Time Constant (τ = RC)</div>
              <div className="text-lg font-semibold text-cyan-400 mb-2">
                {timeConstant.toFixed(3)} seconds
              </div>
              <div className="text-xs text-slate-500">
                τ = {resistance[0]} × {capacitance[0]}×10⁻⁶ = {timeConstant.toFixed(3)}s
              </div>
            </div>

            {/* Key Time Points */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-3">Charging Time Points</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">63% charged:</span>
                  <span className="text-green-400">{timeConstant.toFixed(2)}s (1τ)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">86% charged:</span>
                  <span className="text-green-400">{(2 * timeConstant).toFixed(2)}s (2τ)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">95% charged:</span>
                  <span className="text-green-400">{(3 * timeConstant).toFixed(2)}s (3τ)</span>
                </div>
              </div>
            </div>

            {/* Formulas */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-3">Key Formulas</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="text-slate-300">Charging: V(t) = V₀(1 - e⁻ᵗ/ᴿᶜ)</div>
                <div className="text-slate-300">Discharging: V(t) = V₀e⁻ᵗ/ᴿᶜ</div>
                <div className="text-slate-300">Current: I(t) = (V₀/R)e⁻ᵗ/ᴿᶜ</div>
                <div className="text-slate-300">Energy: E = ½CV²</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Instructions</h4>
        <div className="space-y-2 text-sm text-slate-300">
          <p>• Adjust R, C, and V values to see how they affect the time constant</p>
          <p>• Click "Charge" to start charging the capacitor</p>
          <p>• Click "Discharge" to discharge the capacitor through the resistor</p>
          <p>• Observe the exponential charging and discharging curves</p>
          <p>• Note that after 1 time constant (τ), the capacitor reaches 63% charge</p>
          <p>• The time constant τ = RC determines how fast the process occurs</p>
        </div>
      </Card>
    </div>
  );
}