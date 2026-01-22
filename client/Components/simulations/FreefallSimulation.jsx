import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Play, Pause, RotateCcw, ArrowDown, Timer, Eye, Settings } from 'lucide-react';

export default function FreefallSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [height, setHeight] = useState([20]);
  const [gravity, setGravity] = useState([9.81]);
  const [airResistance, setAirResistance] = useState(false);
  const [selectedObject, setSelectedObject] = useState('ball');
  const [showTrails, setShowTrails] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [time, setTime] = useState(0);
  const [position, setPosition] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [hasHitGround, setHasHitGround] = useState(false);
  const [trails, setTrails] = useState([]);
  const [impactEffect, setImpactEffect] = useState(false);
  const animationRef = useRef();

  const objects = {
    ball: { 
      name: 'Ball', 
      mass: 0.5, 
      dragCoeff: 0.47, 
      radius: 0.1, 
      color: '#EF4444', 
      emoji: '🔴',
      density: 1000
    },
    feather: { 
      name: 'Feather', 
      mass: 0.001, 
      dragCoeff: 1.3, 
      radius: 0.05, 
      color: '#F59E0B', 
      emoji: '🪶',
      density: 50
    },
    hammer: { 
      name: 'Hammer', 
      mass: 2.0, 
      dragCoeff: 0.8, 
      radius: 0.08, 
      color: '#6B7280', 
      emoji: '🔨',
      density: 7800
    },
    paper: { 
      name: 'Paper', 
      mass: 0.005, 
      dragCoeff: 1.1, 
      radius: 0.06, 
      color: '#F3F4F6', 
      emoji: '📄',
      density: 800
    },
    bowling: { 
      name: 'Bowling Ball', 
      mass: 7.0, 
      dragCoeff: 0.2, 
      radius: 0.12, 
      color: '#1F2937', 
      emoji: '🎳',
      density: 1400
    }
  };

  const planets = {
    earth: { name: 'Earth', gravity: 9.81, emoji: '🌍' },
    moon: { name: 'Moon', gravity: 1.62, emoji: '🌙' },
    mars: { name: 'Mars', gravity: 3.71, emoji: '🔴' },
    jupiter: { name: 'Jupiter', gravity: 24.79, emoji: '🪐' },
    sun: { name: 'Sun', gravity: 274.0, emoji: '☀️' }
  };

  useEffect(() => {
    if (isRunning && !hasHitGround) {
      const animate = () => {
        setTime(prevTime => {
          const newTime = prevTime + 0.02; // 50 FPS for smoother animation
          const dt = 0.02;
          
          const obj = objects[selectedObject];
          
          // Calculate new velocity first
          setVelocity(prevVel => {
            let acceleration = gravity[0];
            
            // Apply air resistance if enabled
            if (airResistance && prevVel > 0) {
              const area = Math.PI * obj.radius * obj.radius;
              const airDensity = 1.225; // kg/m³ at sea level
              const dragForce = 0.5 * airDensity * prevVel * prevVel * obj.dragCoeff * area;
              const dragAcceleration = dragForce / obj.mass;
              acceleration = gravity[0] - dragAcceleration;
            }
            
            const newVel = prevVel + acceleration * dt;
            
            // Update position based on new velocity
            setPosition(prevPos => {
              const newPos = prevPos - newVel * dt; // Subtract because we're falling down
              
              // Add trail point
              if (showTrails && newTime % 0.1 < 0.02) {
                setTrails(prev => {
                  const yPos = 16 + ((height[0] - newPos) / height[0]) * (480 - 80);
                  const newTrails = [...prev, { 
                    x: 50, 
                    y: Math.max(16, Math.min(480, yPos)),
                    time: newTime,
                    alpha: 1
                  }];
                  return newTrails.slice(-15); // Keep last 15 points
                });
              }
              
              // Check if object hit the ground
              if (newPos <= 0) {
                setHasHitGround(true);
                setIsRunning(false);
                setImpactEffect(true);
                setTimeout(() => setImpactEffect(false), 800);
                return 0;
              }
              
              return Math.max(0, newPos);
            });
            
            return Math.max(0, newVel);
          });
          
          return newTime;
        });
        
        if (isRunning && !hasHitGround) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, hasHitGround, height, gravity, airResistance, selectedObject, showTrails]);

  // Fade out trails
  useEffect(() => {
    const interval = setInterval(() => {
      setTrails(prev => prev.map(trail => ({
        ...trail,
        alpha: Math.max(0, trail.alpha - 0.08)
      })).filter(trail => trail.alpha > 0));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setPosition(height[0]); // Start at the top
    setVelocity(0);
    setHasHitGround(false);
    setTrails([]);
    setImpactEffect(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Initialize position when height changes
  useEffect(() => {
    if (!isRunning) {
      setPosition(height[0]);
    }
  }, [height, isRunning]);

  const calculateFallTime = () => {
    if (airResistance) {
      return "Variable (air resistance)";
    }
    return Math.sqrt(2 * height[0] / gravity[0]).toFixed(2) + " s";
  };

  const calculateFinalVelocity = () => {
    if (airResistance) {
      const obj = objects[selectedObject];
      const terminalVel = Math.sqrt((2 * obj.mass * gravity[0]) / (1.225 * obj.dragCoeff * Math.PI * obj.radius * obj.radius));
      return `~${terminalVel.toFixed(1)} m/s (terminal)`;
    }
    return Math.sqrt(2 * gravity[0] * height[0]).toFixed(1) + " m/s";
  };

  const setPlanetGravity = (planetKey) => {
    setGravity([planets[planetKey].gravity]);
  };

  const getObjectYPosition = () => {
    // Calculate Y position: start at top (16px) and move down as position decreases
    const progress = (height[0] - position) / height[0]; // 0 at top, 1 at bottom
    return 16 + progress * (480 - 80); // 480 is container height, 80 is margin
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-red-400" />
            Advanced Free Fall Simulation
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              disabled={hasHitGround}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Pause' : 'Drop'}
            </Button>
            <Button onClick={reset} variant="outline" className="border-slate-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Height Control */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Drop Height: {height[0]} m
            </label>
            <Slider
              value={height}
              onValueChange={setHeight}
              min={1}
              max={100}
              step={1}
              className="mb-2"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 m</span>
              <span>100 m</span>
            </div>
          </div>

          {/* Object Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Object Type
            </label>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(objects).slice(0, 3).map(([key, obj]) => (
                <button
                  key={key}
                  onClick={() => setSelectedObject(key)}
                  disabled={isRunning}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    selectedObject === key
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm">{obj.emoji}</span>
                  <span>{obj.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Planet Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Gravity Environment
            </label>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(planets).slice(0, 3).map(([key, planet]) => (
                <button
                  key={key}
                  onClick={() => setPlanetGravity(key)}
                  disabled={isRunning}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    Math.abs(gravity[0] - planet.gravity) < 0.1
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm">{planet.emoji}</span>
                  <span>{planet.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Settings className="w-4 h-4 inline mr-1" />
              Settings
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setAirResistance(!airResistance)}
                disabled={isRunning}
                className={`w-full p-2 rounded-lg border text-xs font-medium transition-all ${
                  airResistance
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                Air Resistance: {airResistance ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowTrails(!showTrails)}
                className={`w-full p-2 rounded-lg border text-xs font-medium transition-all ${
                  showTrails
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Eye className="w-3 h-3 inline mr-1" />
                Motion Trails
              </button>
              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`w-full p-2 rounded-lg border text-xs font-medium transition-all ${
                  showVectors
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                Vector Display
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Visualization */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Realistic Drop Visualization</h4>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Animation Area */}
          <div className="xl:col-span-2">
            <div className="relative bg-gradient-to-b from-sky-900 via-sky-800 to-slate-900 rounded-lg h-[500px] overflow-hidden border border-slate-700">
              {/* Background elements */}
              <div className="absolute inset-0 opacity-20">
                {/* Clouds */}
                <div className="absolute top-4 left-8 w-16 h-8 bg-white rounded-full opacity-30"></div>
                <div className="absolute top-6 left-12 w-12 h-6 bg-white rounded-full opacity-30"></div>
                <div className="absolute top-8 right-16 w-20 h-10 bg-white rounded-full opacity-30"></div>
                
                {/* Building silhouettes */}
                <div className="absolute bottom-16 left-4 w-8 h-32 bg-slate-800 opacity-60"></div>
                <div className="absolute bottom-16 left-16 w-12 h-40 bg-slate-800 opacity-60"></div>
                <div className="absolute bottom-16 right-8 w-10 h-36 bg-slate-800 opacity-60"></div>
              </div>

              {/* Ground with impact effect */}
              <div className={`absolute bottom-0 left-0 right-0 h-4 bg-green-800 border-t-2 border-green-600 transition-all duration-300 ${
                impactEffect ? 'animate-pulse bg-yellow-600 border-yellow-400' : ''
              }`}>
                {impactEffect && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50 animate-ping"></div>
                )}
              </div>
              
              {/* Height markers */}
              <div className="absolute left-2 top-4 bottom-16 flex flex-col justify-between text-xs text-slate-300">
                {Array.from({ length: 11 }, (_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-3 h-px bg-slate-500 mr-2"></div>
                    <span className="bg-slate-900/70 px-1 rounded text-xs">
                      {Math.round(height[0] * (10 - i) / 10)}m
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Motion trails */}
              {showTrails && trails.map((trail, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${trail.x}%`,
                    top: `${trail.y}px`,
                    backgroundColor: objects[selectedObject].color,
                    opacity: trail.alpha * 0.6,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
              
              {/* Falling Object */}
              <div
                className="absolute transition-all duration-75 flex items-center justify-center"
                style={{
                  left: '50%',
                  top: `${getObjectYPosition()}px`,
                  width: `${Math.max(20, objects[selectedObject].radius * 200)}px`,
                  height: `${Math.max(20, objects[selectedObject].radius * 200)}px`,
                  transform: 'translate(-50%, -50%)',
                  filter: hasHitGround ? 'brightness(1.5)' : 'none'
                }}
              >
                {/* Object shadow */}
                <div
                  className="absolute rounded-full opacity-30"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    transform: `translate(2px, 2px) scale(${0.8 + velocity * 0.01})`,
                    filter: 'blur(2px)'
                  }}
                />
                
                {/* Main object */}
                <div
                  className="relative rounded-full flex items-center justify-center text-white font-bold border-2 border-white/20"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: objects[selectedObject].color,
                    boxShadow: hasHitGround 
                      ? '0 0 30px rgba(239, 68, 68, 0.8)' 
                      : `0 ${Math.min(velocity, 20)}px ${Math.min(velocity * 2, 40)}px rgba(0,0,0,0.3)`,
                    animation: velocity > 15 ? 'pulse 0.2s infinite' : 'none'
                  }}
                >
                  <span style={{ fontSize: `${Math.max(12, objects[selectedObject].radius * 100)}px` }}>
                    {objects[selectedObject].emoji}
                  </span>
                </div>
                
                {/* Speed lines for fast motion */}
                {velocity > 15 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute w-px bg-white opacity-60"
                        style={{
                          left: `${30 + i * 20}%`,
                          top: '-20px',
                          height: `${Math.min(velocity * 2, 60)}px`,
                          animation: 'fadeInOut 0.3s infinite'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Velocity vector */}
              {showVectors && velocity > 0.5 && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ top: `${getObjectYPosition() + 40}px` }}
                >
                  <div className="flex flex-col items-center">
                    <ArrowDown 
                      className="text-yellow-400 drop-shadow-lg" 
                      style={{ 
                        height: `${Math.min(velocity * 2, 40)}px`,
                        width: `${Math.min(velocity * 2, 40)}px`
                      }} 
                    />
                    <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-yellow-400 mt-1 border border-yellow-400/30">
                      v = {velocity.toFixed(1)} m/s
                    </div>
                  </div>
                </div>
              )}

              {/* Air resistance indicator */}
              {airResistance && velocity > 2 && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                  style={{ top: `${getObjectYPosition() - 30}px` }}
                >
                  <div className="flex items-center justify-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-blue-400 rounded-full mx-px opacity-60 animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Data Display */}
          <div className="space-y-4">
            {/* Real-time measurements */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Time
                </div>
                <div className="text-lg font-semibold text-cyan-400">
                  {time.toFixed(2)} s
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Height</div>
                <div className="text-lg font-semibold text-green-400">
                  {position.toFixed(1)} m
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Velocity</div>
                <div className="text-lg font-semibold text-orange-400">
                  {velocity.toFixed(1)} m/s
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Energy</div>
                <div className="text-lg font-semibold text-purple-400">
                  {(0.5 * objects[selectedObject].mass * velocity * velocity).toFixed(1)} J
                </div>
              </div>
            </div>

            {/* Object properties */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-lg">{objects[selectedObject].emoji}</span>
                {objects[selectedObject].name}
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mass:</span>
                  <span className="text-white">{objects[selectedObject].mass} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Drag Coefficient:</span>
                  <span className="text-white">{objects[selectedObject].dragCoeff}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radius:</span>
                  <span className="text-white">{objects[selectedObject].radius} m</span>
                </div>
                {airResistance && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Terminal Velocity:</span>
                    <span className="text-orange-400">
                      {Math.sqrt((2 * objects[selectedObject].mass * gravity[0]) / 
                        (1.225 * objects[selectedObject].dragCoeff * Math.PI * objects[selectedObject].radius * objects[selectedObject].radius)
                      ).toFixed(1)} m/s
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Theoretical predictions */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h5 className="text-sm font-semibold text-white mb-3">Predictions</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fall Time:</span>
                  <span className="text-cyan-400">{calculateFallTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Velocity:</span>
                  <span className="text-orange-400">{calculateFinalVelocity()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gravity:</span>
                  <span className="text-purple-400">{gravity[0]} m/s²</span>
                </div>
              </div>
            </div>

            {/* Status with enhanced feedback */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Status:</span>
                <Badge className={
                  hasHitGround ? "bg-red-500/20 text-red-400 animate-pulse" :
                  isRunning ? "bg-green-500/20 text-green-400" :
                  "bg-slate-500/20 text-slate-400"
                }>
                  {hasHitGround ? "💥 Impact!" : isRunning ? "🏃 Falling" : "⏸️ Ready"}
                </Badge>
              </div>
              {hasHitGround && (
                <div className="text-xs text-red-300 mt-2">
                  Impact velocity: {velocity.toFixed(1)} m/s
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Instructions */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Interactive Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-semibold text-cyan-400 mb-2">Controls</h5>
            <div className="space-y-1 text-sm text-slate-300">
              <p>• Adjust drop height (1-100 meters)</p>
              <p>• Choose different objects with varying properties</p>
              <p>• Select planetary environments</p>
              <p>• Toggle air resistance for realistic physics</p>
              <p>• Enable motion trails and velocity vectors</p>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-orange-400 mb-2">Observations</h5>
            <div className="space-y-1 text-sm text-slate-300">
              <p>• Compare fall times of different objects</p>
              <p>• Observe terminal velocity with air resistance</p>
              <p>• Watch energy conversion (potential → kinetic)</p>
              <p>• Notice gravity effects on different planets</p>
              <p>• Study the impact of object properties</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}