import React, { useState } from 'react';
import { Card } from '../Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Components/ui/tabs';
import { Badge } from '../Components/ui/badge';
import { 
  Atom, 
  Zap, 
  Waves, 
  Flame, 
  Lightbulb,
  ArrowRight,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

const concepts = {
  mechanics: [
    {
      title: "Newton's Laws of Motion",
      formula: "F = ma",
      variables: { F: "Force (N)", m: "Mass (kg)", a: "Acceleration (m/s²)" },
      realLife: "When you push a shopping cart, heavier carts need more force to accelerate at the same rate.",
      animation: "force"
    },
    {
      title: "Kinetic Energy",
      formula: "KE = ½mv²",
      variables: { KE: "Kinetic Energy (J)", m: "Mass (kg)", v: "Velocity (m/s)" },
      realLife: "A fast-moving car has more kinetic energy than a slow one, which is why high-speed accidents are more destructive.",
      animation: "energy"
    },
    {
      title: "Gravitational Potential Energy",
      formula: "PE = mgh",
      variables: { PE: "Potential Energy (J)", m: "Mass (kg)", g: "Gravity (m/s²)", h: "Height (m)" },
      realLife: "Water stored in elevated tanks has potential energy that's converted to kinetic energy when released.",
      animation: "potential"
    }
  ],
  electricity: [
    {
      title: "Ohm's Law",
      formula: "V = IR",
      variables: { V: "Voltage (V)", I: "Current (A)", R: "Resistance (Ω)" },
      realLife: "Like water in a pipe - voltage is pressure, current is flow rate, resistance is pipe narrowness.",
      animation: "circuit"
    },
    {
      title: "Electric Power",
      formula: "P = VI",
      variables: { P: "Power (W)", V: "Voltage (V)", I: "Current (A)" },
      realLife: "A 100W bulb consumes more power than a 60W bulb when connected to the same voltage source.",
      animation: "power"
    },
    {
      title: "Capacitance",
      formula: "C = Q/V",
      variables: { C: "Capacitance (F)", Q: "Charge (C)", V: "Voltage (V)" },
      realLife: "Capacitors store energy like tiny batteries, powering camera flashes and smoothing power supplies.",
      animation: "capacitor"
    }
  ],
  waves: [
    {
      title: "Wave Equation",
      formula: "v = fλ",
      variables: { v: "Wave Speed (m/s)", f: "Frequency (Hz)", λ: "Wavelength (m)" },
      realLife: "Sound waves with higher frequency (pitch) have shorter wavelengths.",
      animation: "wave"
    },
    {
      title: "Doppler Effect",
      formula: "f' = f(v ± vd)/(v ∓ vs)",
      variables: { "f'": "Observed Frequency", f: "Source Frequency", v: "Wave Speed", vd: "Detector Speed", vs: "Source Speed" },
      realLife: "Ambulance sirens sound higher when approaching and lower when moving away.",
      animation: "doppler"
    }
  ],
  optics: [
    {
      title: "Lens Formula",
      formula: "1/f = 1/v + 1/u",
      variables: { f: "Focal Length", v: "Image Distance", u: "Object Distance" },
      realLife: "Cameras and eyeglasses use this principle to focus light and form clear images.",
      animation: "lens"
    },
    {
      title: "Snell's Law",
      formula: "n₁ sin θ₁ = n₂ sin θ₂",
      variables: { n: "Refractive Index", θ: "Angle of incidence/refraction" },
      realLife: "A straw in water appears bent due to light refraction at the water surface.",
      animation: "refraction"
    }
  ],
  thermodynamics: [
    {
      title: "Ideal Gas Law",
      formula: "PV = nRT",
      variables: { P: "Pressure (Pa)", V: "Volume (m³)", n: "Moles", R: "Gas Constant", T: "Temperature (K)" },
      realLife: "Inflating a tire increases pressure as you add more gas molecules.",
      animation: "gas"
    },
    {
      title: "Heat Transfer",
      formula: "Q = mcΔT",
      variables: { Q: "Heat (J)", m: "Mass (kg)", c: "Specific Heat", ΔT: "Temperature Change" },
      realLife: "Water takes longer to heat up than oil because it has higher specific heat capacity.",
      animation: "heat"
    }
  ]
};

const categoryInfo = {
  mechanics: { icon: Atom, color: 'cyan', label: 'Mechanics' },
  electricity: { icon: Zap, color: 'yellow', label: 'Electricity' },
  waves: { icon: Waves, color: 'purple', label: 'Waves' },
  optics: { icon: Lightbulb, color: 'blue', label: 'Optics' },
  thermodynamics: { icon: Flame, color: 'orange', label: 'Thermodynamics' }
};

function FormulaCard({ concept }) {
  const [showAnimation, setShowAnimation] = useState(false);

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">{concept.title}</h3>
        
        {/* Formula Display */}
        <div className="relative p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl md:text-4xl font-mono text-center text-cyan-400"
          >
            {concept.formula}
          </motion.div>
          
          {/* Variable breakdown */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {Object.entries(concept.variables).map(([symbol, meaning]) => (
              <Badge 
                key={symbol}
                className="bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors cursor-help"
                title={meaning}
              >
                <span className="text-cyan-400 font-mono mr-1">{symbol}</span>
                <span className="text-xs">{meaning}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Real-life example */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">Real-life Example</p>
              <p className="text-sm text-slate-300">{concept.realLife}</p>
            </div>
          </div>
        </div>

        {/* Animation placeholder */}
        <button
          onClick={() => setShowAnimation(!showAnimation)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
        >
          <Play className="w-4 h-4" />
          {showAnimation ? 'Hide Animation' : 'View Animated Diagram'}
        </button>

        {showAnimation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
          >
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  {concept.animation === 'force' && '🚗'}
                  {concept.animation === 'energy' && '⚡'}
                  {concept.animation === 'potential' && '🏔️'}
                  {concept.animation === 'circuit' && '💡'}
                  {concept.animation === 'power' && '🔋'}
                  {concept.animation === 'capacitor' && '📸'}
                  {concept.animation === 'wave' && '🌊'}
                  {concept.animation === 'doppler' && '🚑'}
                  {concept.animation === 'lens' && '🔍'}
                  {concept.animation === 'refraction' && '🥤'}
                  {concept.animation === 'gas' && '🎈'}
                  {concept.animation === 'heat' && '🔥'}
                </motion.div>
                <p className="text-sm text-slate-400">Interactive animation coming soon</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

export default function ConceptVisualizer() {
  const [activeCategory, setActiveCategory] = useState('mechanics');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Concept Visualizer</h1>
        <p className="text-slate-400">Understand physics formulas with visual breakdowns and real-life examples</p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-slate-800/50 border border-slate-700 p-1 flex flex-wrap h-auto gap-1">
          {Object.entries(categoryInfo).map(([key, { icon: Icon, color, label }]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400"
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(concepts).map(([category, categoryConceptsList]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categoryConceptsList.map((concept, i) => (
                <FormulaCard key={i} concept={concept} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Pro Tip</h3>
        <p className="text-slate-300">
          Understanding the units in a formula helps you remember it better. For example, in F = ma, 
          Force (Newtons) = Mass (kg) × Acceleration (m/s²). Check that units balance on both sides!
        </p>
      </Card>
    </div>
  );
}