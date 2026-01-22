const Experiment = require('../models/Experiment');

const sampleExperiments = [
  {
    title: "Simple Pendulum Motion",
    description: "Investigate the relationship between pendulum length and period of oscillation",
    category: "mechanics",
    difficulty: "easy",
    estimatedTime: 30,
    objectives: [
      "Understand simple harmonic motion",
      "Measure pendulum period accurately",
      "Analyze the relationship between length and period"
    ],
    materials: [
      { name: "String", quantity: "1 meter", optional: false },
      { name: "Small mass (bob)", quantity: "1 piece", optional: false },
      { name: "Stopwatch", quantity: "1", optional: false },
      { name: "Ruler", quantity: "1", optional: false }
    ],
    procedure: [
      {
        step: 1,
        instruction: "Set up the pendulum with a length of 50 cm",
        notes: "Ensure the string is securely attached"
      },
      {
        step: 2,
        instruction: "Displace the bob by a small angle (less than 15°)",
        notes: "Small angles ensure simple harmonic motion"
      },
      {
        step: 3,
        instruction: "Release the bob and measure 10 complete oscillations",
        notes: "Count carefully to avoid errors"
      },
      {
        step: 4,
        instruction: "Calculate the period by dividing total time by 10",
        notes: "This reduces measurement uncertainty"
      },
      {
        step: 5,
        instruction: "Repeat with different lengths (30cm, 70cm, 100cm)",
        notes: "More data points improve analysis"
      }
    ],
    theory: {
      concepts: ["Simple Harmonic Motion", "Period", "Frequency", "Gravitational Acceleration"],
      formulas: [
        {
          name: "Pendulum Period",
          formula: "T = 2π√(L/g)",
          variables: [
            { symbol: "T", description: "Period of oscillation", unit: "seconds" },
            { symbol: "L", description: "Length of pendulum", unit: "meters" },
            { symbol: "g", description: "Gravitational acceleration", unit: "m/s²" }
          ]
        }
      ],
      background: "A simple pendulum consists of a mass suspended from a fixed point by a string or rod. For small angles, it exhibits simple harmonic motion with a period that depends only on the length and gravitational acceleration."
    },
    simulation: {
      type: "pendulum",
      parameters: {
        maxLength: 2.0,
        minLength: 0.1,
        maxAngle: 30,
        gravity: 9.81
      }
    },
    quiz: [
      {
        question: "What happens to the period when you double the length of a pendulum?",
        type: "multiple-choice",
        options: [
          "Period doubles",
          "Period increases by √2",
          "Period decreases by half",
          "Period remains the same"
        ],
        correctAnswer: 1,
        explanation: "According to T = 2π√(L/g), when length doubles, period increases by √2.",
        points: 2
      },
      {
        question: "Does the mass of the bob affect the period of a simple pendulum?",
        type: "true-false",
        correctAnswer: false,
        explanation: "The period formula T = 2π√(L/g) shows that mass does not affect the period.",
        points: 1
      }
    ],
    tags: ["pendulum", "oscillation", "gravity", "mechanics", "harmonic-motion"],
    isActive: true
  },
  {
    title: "Ohm's Law Investigation",
    description: "Explore the relationship between voltage, current, and resistance in electrical circuits",
    category: "electricity",
    difficulty: "medium",
    estimatedTime: 45,
    objectives: [
      "Understand Ohm's Law",
      "Measure voltage and current accurately",
      "Calculate resistance from experimental data",
      "Analyze I-V characteristics"
    ],
    materials: [
      { name: "DC Power Supply", quantity: "1", optional: false },
      { name: "Resistors (various values)", quantity: "5-10", optional: false },
      { name: "Multimeter", quantity: "2", optional: false },
      { name: "Breadboard", quantity: "1", optional: false },
      { name: "Connecting wires", quantity: "10", optional: false }
    ],
    procedure: [
      {
        step: 1,
        instruction: "Set up the circuit with a resistor and power supply",
        notes: "Use a breadboard for easy connections"
      },
      {
        step: 2,
        instruction: "Connect multimeters to measure voltage and current",
        notes: "Voltmeter in parallel, ammeter in series"
      },
      {
        step: 3,
        instruction: "Vary the voltage from 0V to 12V in 2V steps",
        notes: "Record both voltage and current readings"
      },
      {
        step: 4,
        instruction: "Plot I vs V graph and calculate slope",
        notes: "Slope gives 1/R (conductance)"
      },
      {
        step: 5,
        instruction: "Repeat with different resistor values",
        notes: "Compare calculated and measured resistance"
      }
    ],
    theory: {
      concepts: ["Electric Current", "Voltage", "Resistance", "Power"],
      formulas: [
        {
          name: "Ohm's Law",
          formula: "V = IR",
          variables: [
            { symbol: "V", description: "Voltage", unit: "Volts (V)" },
            { symbol: "I", description: "Current", unit: "Amperes (A)" },
            { symbol: "R", description: "Resistance", unit: "Ohms (Ω)" }
          ]
        },
        {
          name: "Electrical Power",
          formula: "P = VI = I²R = V²/R",
          variables: [
            { symbol: "P", description: "Power", unit: "Watts (W)" }
          ]
        }
      ],
      background: "Ohm's Law describes the relationship between voltage, current, and resistance in electrical circuits. It states that current is directly proportional to voltage and inversely proportional to resistance."
    },
    simulation: {
      type: "ohms-law",
      parameters: {
        maxVoltage: 20,
        resistorValues: [100, 220, 470, 1000, 2200],
        maxCurrent: 0.1
      }
    },
    quiz: [
      {
        question: "If voltage doubles and resistance stays constant, what happens to current?",
        type: "multiple-choice",
        options: [
          "Current halves",
          "Current doubles", 
          "Current stays the same",
          "Current quadruples"
        ],
        correctAnswer: 1,
        explanation: "From V = IR, if V doubles and R is constant, then I must double.",
        points: 2
      },
      {
        question: "Calculate the current when V = 12V and R = 4Ω",
        type: "numerical",
        correctAnswer: 3,
        explanation: "Using I = V/R = 12V/4Ω = 3A",
        points: 3
      }
    ],
    tags: ["ohms-law", "electricity", "circuits", "voltage", "current", "resistance"],
    isActive: true
  }
];

const seedExperiments = async () => {
  try {
    // Clear existing experiments
    await Experiment.deleteMany({});
    
    // Insert sample experiments
    const experiments = await Experiment.insertMany(sampleExperiments);
    
    console.log(`✅ Seeded ${experiments.length} experiments`);
    return experiments;
  } catch (error) {
    console.error('❌ Error seeding experiments:', error);
    throw error;
  }
};

module.exports = { seedExperiments, sampleExperiments };