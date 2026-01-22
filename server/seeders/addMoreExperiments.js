const mongoose = require('mongoose');
const Experiment = require('../models/Experiment');
require('dotenv').config();

const additionalExperiments = [
  // Mechanics - Projectile Motion
  {
    title: "Projectile Motion Analysis",
    description: "Study the motion of projectiles under gravity and analyze trajectory patterns",
    category: "mechanics",
    difficulty: "medium",
    estimatedTime: 40,
    objectives: [
      "Understand projectile motion principles",
      "Analyze horizontal and vertical motion components",
      "Calculate range, height, and time of flight",
      "Study the effect of launch angle on trajectory"
    ],
    materials: [
      { name: "Projectile launcher", quantity: "1", optional: false },
      { name: "Measuring tape", quantity: "1", optional: false },
      { name: "Stopwatch", quantity: "1", optional: false },
      { name: "Protractor", quantity: "1", optional: false },
      { name: "Safety goggles", quantity: "1 per student", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Set up the projectile launcher at a known height", notes: "Ensure stable mounting and clear trajectory path" },
      { step: 2, instruction: "Launch projectile at different angles (30°, 45°, 60°)", notes: "Record launch angle and initial velocity" },
      { step: 3, instruction: "Measure horizontal range for each angle", notes: "Use measuring tape for accurate distance measurement" },
      { step: 4, instruction: "Calculate theoretical range using kinematic equations", notes: "Compare with experimental values" },
      { step: 5, instruction: "Plot trajectory and analyze motion components", notes: "Separate horizontal and vertical motion analysis" }
    ],
    theory: {
      concepts: ["Projectile Motion", "Kinematics", "Gravity", "Trajectory", "Range"],
      formulas: [
        {
          name: "Range Formula",
          formula: "R = (v₀²sin(2θ))/g",
          variables: [
            { symbol: "R", description: "Range", unit: "meters" },
            { symbol: "v₀", description: "Initial velocity", unit: "m/s" },
            { symbol: "θ", description: "Launch angle", unit: "degrees" },
            { symbol: "g", description: "Gravitational acceleration", unit: "m/s²" }
          ]
        },
        {
          name: "Maximum Height",
          formula: "H = (v₀²sin²(θ))/(2g)",
          variables: [
            { symbol: "H", description: "Maximum height", unit: "meters" }
          ]
        }
      ],
      background: "Projectile motion is a form of motion experienced by an object that is projected near the Earth's surface and moves along a curved path under the action of gravity only."
    },
    simulation: {
      type: "projectile",
      parameters: {
        maxVelocity: 50,
        minVelocity: 5,
        maxAngle: 90,
        minAngle: 0,
        gravity: 9.81
      }
    },
    quiz: [
      {
        question: "At what angle should a projectile be launched for maximum range?",
        type: "multiple-choice",
        options: ["30°", "45°", "60°", "90°"],
        correctAnswer: 1,
        explanation: "Maximum range occurs at 45° launch angle when air resistance is neglected.",
        points: 2
      },
      {
        question: "If initial velocity is 20 m/s at 45°, what is the range? (g = 10 m/s²)",
        type: "numerical",
        correctAnswer: 40,
        explanation: "Using R = v₀²sin(2θ)/g = 20²×sin(90°)/10 = 400/10 = 40m",
        points: 3
      }
    ],
    tags: ["projectile", "kinematics", "gravity", "trajectory", "mechanics"]
  },

  // Optics - Lens Experiment
  {
    title: "Convex Lens Image Formation",
    description: "Investigate image formation by convex lenses and verify lens equation",
    category: "optics",
    difficulty: "medium",
    estimatedTime: 50,
    objectives: [
      "Understand image formation by convex lenses",
      "Verify the lens equation experimentally",
      "Measure focal length of convex lens",
      "Study real and virtual image characteristics"
    ],
    materials: [
      { name: "Convex lens", quantity: "1", optional: false },
      { name: "Optical bench", quantity: "1", optional: false },
      { name: "Light source", quantity: "1", optional: false },
      { name: "Screen", quantity: "1", optional: false },
      { name: "Object (candle/LED)", quantity: "1", optional: false },
      { name: "Ruler", quantity: "1", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Set up optical bench with lens, object, and screen", notes: "Ensure proper alignment of optical components" },
      { step: 2, instruction: "Find focal length by focusing distant object", notes: "Use distant light source or window" },
      { step: 3, instruction: "Place object at different distances from lens", notes: "Start from beyond 2F and move closer" },
      { step: 4, instruction: "Adjust screen to get sharp image for each position", notes: "Record object and image distances" },
      { step: 5, instruction: "Measure image size and calculate magnification", notes: "Compare with theoretical predictions" }
    ],
    theory: {
      concepts: ["Refraction", "Focal Length", "Image Formation", "Magnification", "Lens Equation"],
      formulas: [
        {
          name: "Lens Equation",
          formula: "1/f = 1/u + 1/v",
          variables: [
            { symbol: "f", description: "Focal length", unit: "cm" },
            { symbol: "u", description: "Object distance", unit: "cm" },
            { symbol: "v", description: "Image distance", unit: "cm" }
          ]
        },
        {
          name: "Magnification",
          formula: "m = v/u = h'/h",
          variables: [
            { symbol: "m", description: "Magnification", unit: "dimensionless" },
            { symbol: "h'", description: "Image height", unit: "cm" },
            { symbol: "h", description: "Object height", unit: "cm" }
          ]
        }
      ],
      background: "A convex lens converges parallel rays of light to a focal point. The relationship between object distance, image distance, and focal length is given by the lens equation."
    },
    simulation: {
      type: "lens",
      parameters: {
        maxFocalLength: 30,
        minFocalLength: 5,
        maxObjectDistance: 100,
        minObjectDistance: 1
      }
    },
    quiz: [
      {
        question: "When object is placed at 2F from a convex lens, where is the image formed?",
        type: "multiple-choice",
        options: ["At F", "At 2F", "Beyond 2F", "Between F and 2F"],
        correctAnswer: 1,
        explanation: "When object is at 2F, image is formed at 2F on the other side with same size.",
        points: 2
      }
    ],
    tags: ["optics", "lens", "refraction", "image-formation", "focal-length"]
  },

  // Waves - Wave Motion
  {
    title: "Wave Properties and Interference",
    description: "Study wave properties including wavelength, frequency, and interference patterns",
    category: "waves",
    difficulty: "hard",
    estimatedTime: 60,
    objectives: [
      "Understand wave properties and characteristics",
      "Measure wavelength and frequency",
      "Observe wave interference patterns",
      "Study standing wave formation"
    ],
    materials: [
      { name: "Wave generator", quantity: "1", optional: false },
      { name: "Ripple tank", quantity: "1", optional: false },
      { name: "Stroboscope", quantity: "1", optional: false },
      { name: "Ruler", quantity: "1", optional: false },
      { name: "Barriers and obstacles", quantity: "Various", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Set up ripple tank with wave generator", notes: "Ensure water depth is uniform" },
      { step: 2, instruction: "Generate waves and measure wavelength", notes: "Use stroboscope to freeze wave motion" },
      { step: 3, instruction: "Vary frequency and observe wavelength changes", notes: "Verify wave equation v = fλ" },
      { step: 4, instruction: "Create interference using two sources", notes: "Observe constructive and destructive interference" },
      { step: 5, instruction: "Study reflection and refraction patterns", notes: "Use barriers and different depths" }
    ],
    theory: {
      concepts: ["Wave Motion", "Wavelength", "Frequency", "Interference", "Standing Waves"],
      formulas: [
        {
          name: "Wave Equation",
          formula: "v = fλ",
          variables: [
            { symbol: "v", description: "Wave speed", unit: "m/s" },
            { symbol: "f", description: "Frequency", unit: "Hz" },
            { symbol: "λ", description: "Wavelength", unit: "m" }
          ]
        },
        {
          name: "Period",
          formula: "T = 1/f",
          variables: [
            { symbol: "T", description: "Period", unit: "seconds" }
          ]
        }
      ],
      background: "Waves are disturbances that transfer energy through space or matter. They exhibit properties like reflection, refraction, interference, and diffraction."
    },
    simulation: {
      type: "wave",
      parameters: {
        maxFrequency: 10,
        minFrequency: 0.1,
        maxAmplitude: 5,
        minAmplitude: 0.1
      }
    },
    quiz: [
      {
        question: "If wave speed is 340 m/s and frequency is 440 Hz, what is the wavelength?",
        type: "numerical",
        correctAnswer: 0.77,
        explanation: "Using λ = v/f = 340/440 = 0.77 m",
        points: 3
      }
    ],
    tags: ["waves", "interference", "wavelength", "frequency", "wave-motion"]
  },

  // Thermodynamics
  {
    title: "Heat Transfer and Thermal Expansion",
    description: "Investigate heat transfer mechanisms and thermal expansion of materials",
    category: "thermodynamics",
    difficulty: "medium",
    estimatedTime: 45,
    objectives: [
      "Understand heat transfer mechanisms",
      "Measure thermal expansion coefficients",
      "Study conduction, convection, and radiation",
      "Analyze temperature-dependent properties"
    ],
    materials: [
      { name: "Metal rods (different materials)", quantity: "3-4", optional: false },
      { name: "Thermometers", quantity: "3", optional: false },
      { name: "Heat source", quantity: "1", optional: false },
      { name: "Measuring scale", quantity: "1", optional: false },
      { name: "Stopwatch", quantity: "1", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Set up apparatus for thermal expansion measurement", notes: "Ensure accurate length measurement setup" },
      { step: 2, instruction: "Heat metal rods and measure expansion", notes: "Record temperature and length changes" },
      { step: 3, instruction: "Compare expansion of different materials", notes: "Calculate linear expansion coefficients" },
      { step: 4, instruction: "Study heat conduction through materials", notes: "Measure temperature distribution" },
      { step: 5, instruction: "Analyze heat transfer rates", notes: "Plot temperature vs time graphs" }
    ],
    theory: {
      concepts: ["Heat Transfer", "Thermal Expansion", "Conduction", "Convection", "Radiation"],
      formulas: [
        {
          name: "Linear Expansion",
          formula: "ΔL = αL₀ΔT",
          variables: [
            { symbol: "ΔL", description: "Change in length", unit: "m" },
            { symbol: "α", description: "Linear expansion coefficient", unit: "/°C" },
            { symbol: "L₀", description: "Original length", unit: "m" },
            { symbol: "ΔT", description: "Temperature change", unit: "°C" }
          ]
        },
        {
          name: "Heat Conduction",
          formula: "Q = kAΔT/d",
          variables: [
            { symbol: "Q", description: "Heat transfer rate", unit: "W" },
            { symbol: "k", description: "Thermal conductivity", unit: "W/m·K" },
            { symbol: "A", description: "Cross-sectional area", unit: "m²" },
            { symbol: "d", description: "Thickness", unit: "m" }
          ]
        }
      ],
      background: "Heat transfer occurs through conduction, convection, and radiation. Materials expand when heated due to increased molecular motion."
    },
    simulation: {
      type: "thermal",
      parameters: {
        maxTemperature: 200,
        minTemperature: 20,
        materials: ["aluminum", "steel", "copper", "brass"]
      }
    },
    quiz: [
      {
        question: "Which heat transfer mechanism requires matter to transfer energy?",
        type: "multiple-choice",
        options: ["Radiation only", "Conduction and convection", "Convection only", "All three mechanisms"],
        correctAnswer: 1,
        explanation: "Conduction and convection require matter, while radiation can occur through vacuum.",
        points: 2
      }
    ],
    tags: ["thermodynamics", "heat-transfer", "thermal-expansion", "conduction", "temperature"]
  },

  // Additional Mechanics - Free Fall
  {
    title: "Free Fall and Gravitational Acceleration",
    description: "Measure gravitational acceleration using free fall experiments",
    category: "mechanics",
    difficulty: "easy",
    estimatedTime: 35,
    objectives: [
      "Measure gravitational acceleration",
      "Understand free fall motion",
      "Analyze position-time relationships",
      "Study air resistance effects"
    ],
    materials: [
      { name: "Dropping apparatus", quantity: "1", optional: false },
      { name: "Timer/photogate", quantity: "1", optional: false },
      { name: "Measuring tape", quantity: "1", optional: false },
      { name: "Various objects", quantity: "5-6", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Set up dropping apparatus at known height", notes: "Ensure accurate height measurement" },
      { step: 2, instruction: "Drop objects and measure fall time", notes: "Use electronic timing for accuracy" },
      { step: 3, instruction: "Repeat for different heights", notes: "Collect multiple data points" },
      { step: 4, instruction: "Plot h vs t² graph", notes: "Should give straight line through origin" },
      { step: 5, instruction: "Calculate g from slope", notes: "Compare with standard value 9.81 m/s²" }
    ],
    theory: {
      concepts: ["Free Fall", "Gravitational Acceleration", "Kinematics", "Air Resistance"],
      formulas: [
        {
          name: "Free Fall Equation",
          formula: "h = ½gt²",
          variables: [
            { symbol: "h", description: "Height", unit: "m" },
            { symbol: "g", description: "Gravitational acceleration", unit: "m/s²" },
            { symbol: "t", description: "Time", unit: "s" }
          ]
        }
      ],
      background: "In free fall, objects accelerate downward at 9.81 m/s² regardless of mass (neglecting air resistance)."
    },
    simulation: {
      type: "freefall",
      parameters: {
        maxHeight: 50,
        minHeight: 1,
        gravity: 9.81,
        airResistance: true
      }
    },
    quiz: [
      {
        question: "Two objects of different masses are dropped simultaneously. Which hits the ground first?",
        type: "multiple-choice",
        options: ["Heavier object", "Lighter object", "Both hit simultaneously", "Depends on shape"],
        correctAnswer: 2,
        explanation: "In vacuum, all objects fall at the same rate regardless of mass.",
        points: 2
      }
    ],
    tags: ["free-fall", "gravity", "kinematics", "acceleration", "mechanics"]
  },

  // Additional Electricity
  {
    title: "Capacitor Charging and Discharging",
    description: "Study capacitor behavior in RC circuits and exponential processes",
    category: "electricity",
    difficulty: "hard",
    estimatedTime: 55,
    objectives: [
      "Understand capacitor charging/discharging",
      "Measure time constants in RC circuits",
      "Study exponential decay processes",
      "Analyze energy storage in capacitors"
    ],
    materials: [
      { name: "Capacitors (various values)", quantity: "3-4", optional: false },
      { name: "Resistors", quantity: "5", optional: false },
      { name: "DC power supply", quantity: "1", optional: false },
      { name: "Oscilloscope", quantity: "1", optional: false },
      { name: "Multimeter", quantity: "1", optional: false }
    ],
    procedure: [
      { step: 1, instruction: "Build RC charging circuit", notes: "Use breadboard for connections" },
      { step: 2, instruction: "Connect oscilloscope to monitor voltage", notes: "Observe charging curve" },
      { step: 3, instruction: "Measure time constant τ = RC", notes: "Time to reach 63% of final voltage" },
      { step: 4, instruction: "Study discharging process", notes: "Switch to discharge through resistor" },
      { step: 5, instruction: "Vary R and C values", notes: "Observe effect on time constant" }
    ],
    theory: {
      concepts: ["Capacitance", "RC Circuits", "Time Constant", "Exponential Decay", "Energy Storage"],
      formulas: [
        {
          name: "Charging Equation",
          formula: "V(t) = V₀(1 - e^(-t/RC))",
          variables: [
            { symbol: "V(t)", description: "Voltage at time t", unit: "V" },
            { symbol: "V₀", description: "Supply voltage", unit: "V" },
            { symbol: "R", description: "Resistance", unit: "Ω" },
            { symbol: "C", description: "Capacitance", unit: "F" }
          ]
        },
        {
          name: "Time Constant",
          formula: "τ = RC",
          variables: [
            { symbol: "τ", description: "Time constant", unit: "s" }
          ]
        }
      ],
      background: "Capacitors store electrical energy and exhibit exponential charging/discharging behavior in RC circuits."
    },
    simulation: {
      type: "rc-circuit",
      parameters: {
        maxCapacitance: 1000e-6,
        minCapacitance: 1e-6,
        maxResistance: 1e6,
        minResistance: 100
      }
    },
    quiz: [
      {
        question: "What percentage of final voltage does a capacitor reach after one time constant?",
        type: "multiple-choice",
        options: ["50%", "63%", "75%", "90%"],
        correctAnswer: 1,
        explanation: "After τ = RC, capacitor reaches 63% of final voltage (1 - 1/e ≈ 0.63).",
        points: 3
      }
    ],
    tags: ["capacitor", "rc-circuit", "exponential", "time-constant", "electricity"]
  }
];

async function seedAdditionalExperiments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if experiments already exist
    const existingCount = await Experiment.countDocuments();
    console.log(`Current experiments in database: ${existingCount}`);

    // Insert additional experiments
    const insertedExperiments = await Experiment.insertMany(additionalExperiments);
    console.log(`✅ Added ${insertedExperiments.length} new experiments!`);

    // Show summary
    const totalCount = await Experiment.countDocuments();
    console.log(`📊 Total experiments now: ${totalCount}`);

    // Show experiments by category
    const categories = await Experiment.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📚 Experiments by category:');
    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} experiments`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding experiments:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAdditionalExperiments();