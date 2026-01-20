// Mock Base44 Client for QuantIQ Physics Platform
// This simulates the base44 backend functionality

// Mock data storage
let mockData = {
  experiments: [
    {
      id: '1',
      title: 'Simple Pendulum',
      category: 'mechanics',
      difficulty: 'easy',
      description: 'Study oscillatory motion and understand the factors affecting the time period of a simple pendulum.',
      simulation_type: 'pendulum',
      aim: 'To study the motion of a simple pendulum and find its time period.',
      apparatus: ['Pendulum bob', 'String', 'Stand', 'Stopwatch', 'Measuring scale'],
      procedure: [
        'Set up the pendulum with desired length',
        'Displace the bob by a small angle (< 15°)',
        'Release the bob and start timing',
        'Count 20 oscillations and record time',
        'Calculate time period T = total time / 20',
        'Repeat for different lengths',
        'Plot T² vs L graph'
      ],
      theory: 'A simple pendulum consists of a point mass suspended by a massless string. For small angles, the time period T = 2π√(L/g), where L is length and g is acceleration due to gravity.',
      formulas: [
        { name: 'Time Period', expression: 'T = 2π√(L/g)', variables: 'T: time period, L: length, g: gravity' }
      ]
    },
    {
      id: '2',
      title: "Ohm's Law Verification",
      category: 'electricity',
      difficulty: 'medium',
      description: 'Verify Ohm\'s law and understand the relationship between voltage, current, and resistance.',
      simulation_type: 'ohms_law',
      aim: 'To verify Ohm\'s law and study V-I characteristics.',
      apparatus: ['Resistor', 'Ammeter', 'Voltmeter', 'Battery', 'Rheostat', 'Connecting wires'],
      theory: 'Ohm\'s law states that the current through a conductor is directly proportional to the voltage across it, provided temperature remains constant.',
      formulas: [
        { name: 'Ohm\'s Law', expression: 'V = IR', variables: 'V: voltage, I: current, R: resistance' },
        { name: 'Power', expression: 'P = VI = I²R = V²/R', variables: 'P: power' }
      ]
    },
    {
      id: '3',
      title: 'Projectile Motion',
      category: 'mechanics',
      difficulty: 'hard',
      description: 'Analyze the motion of projectiles and understand the factors affecting range and height.',
      simulation_type: 'projectile',
      aim: 'To study projectile motion and find the optimal angle for maximum range.',
      theory: 'Projectile motion is the motion of an object thrown into the air, subject only to gravity.',
      formulas: [
        { name: 'Range', expression: 'R = (v²sin2θ)/g', variables: 'R: range, v: initial velocity, θ: angle' },
        { name: 'Maximum Height', expression: 'H = (v²sin²θ)/(2g)', variables: 'H: maximum height' }
      ]
    },
    {
      id: '4',
      title: 'Wave Interference',
      category: 'waves',
      difficulty: 'medium',
      description: 'Study wave interference patterns and understand constructive and destructive interference.',
      simulation_type: 'wave',
      theory: 'When two waves meet, they interfere. Constructive interference occurs when waves are in phase, destructive when out of phase.'
    },
    {
      id: '5',
      title: 'Lens Optics',
      category: 'optics',
      difficulty: 'medium',
      description: 'Study image formation by convex and concave lenses.',
      simulation_type: 'lens',
      theory: 'Lenses form images by refracting light. The lens equation relates object distance, image distance, and focal length.',
      formulas: [
        { name: 'Lens Equation', expression: '1/f = 1/v + 1/u', variables: 'f: focal length, v: image distance, u: object distance' }
      ]
    }
  ],
  users: [
    { email: 'student@example.com', name: 'Physics Student' }
  ],
  userProgress: [],
  quizAttempts: [],
  pointTransactions: [],
  userBadges: [],
  dailyChallenges: [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      task_description: 'Complete 3 physics experiments today',
      category: 'mechanics',
      points_reward: 50,
      completed_by: []
    }
  ],
  chatMessages: []
};

// Mock current user
let currentUser = { email: 'student@example.com', name: 'Physics Student' };

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Base44 Client
export const base44 = {
  auth: {
    me: async () => currentUser,
    login: async (email, password) => {
      currentUser = { email, name: email.split('@')[0] };
      return currentUser;
    },
    logout: async () => {
      currentUser = null;
    }
  },

  entities: {
    Experiment: {
      list: async () => mockData.experiments,
      filter: async (filters) => {
        return mockData.experiments.filter(exp => {
          return Object.keys(filters).every(key => {
            if (key === 'id') return exp.id === filters[key];
            return exp[key] === filters[key];
          });
        });
      },
      create: async (data) => {
        const newExp = { ...data, id: generateId() };
        mockData.experiments.push(newExp);
        return newExp;
      }
    },

    UserProgress: {
      filter: async (filters) => {
        return mockData.userProgress.filter(progress => {
          return Object.keys(filters).every(key => progress[key] === filters[key]);
        });
      },
      create: async (data) => {
        const newProgress = { 
          ...data, 
          id: generateId(),
          created_date: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        };
        mockData.userProgress.push(newProgress);
        return newProgress;
      },
      update: async (id, data) => {
        const index = mockData.userProgress.findIndex(p => p.id === id);
        if (index !== -1) {
          mockData.userProgress[index] = { ...mockData.userProgress[index], ...data };
          return mockData.userProgress[index];
        }
        return null;
      }
    },

    QuizAttempt: {
      filter: async (filters, orderBy = null, limit = null) => {
        let results = mockData.quizAttempts.filter(quiz => {
          return Object.keys(filters).every(key => quiz[key] === filters[key]);
        });
        
        if (orderBy === '-created_date') {
          results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        }
        
        if (limit) {
          results = results.slice(0, limit);
        }
        
        return results;
      },
      create: async (data) => {
        const newQuiz = { 
          ...data, 
          id: generateId(),
          created_date: new Date().toISOString()
        };
        mockData.quizAttempts.push(newQuiz);
        return newQuiz;
      },
      list: async () => mockData.quizAttempts
    },

    PointTransaction: {
      filter: async (filters) => {
        return mockData.pointTransactions.filter(transaction => {
          return Object.keys(filters).every(key => transaction[key] === filters[key]);
        });
      },
      create: async (data) => {
        const newTransaction = { 
          ...data, 
          id: generateId(),
          created_date: new Date().toISOString()
        };
        mockData.pointTransactions.push(newTransaction);
        return newTransaction;
      },
      list: async () => mockData.pointTransactions
    },

    UserBadge: {
      filter: async (filters) => {
        return mockData.userBadges.filter(badge => {
          return Object.keys(filters).every(key => badge[key] === filters[key]);
        });
      },
      create: async (data) => {
        const newBadge = { 
          ...data, 
          id: generateId(),
          earned_date: new Date().toISOString()
        };
        mockData.userBadges.push(newBadge);
        return newBadge;
      }
    },

    DailyChallenge: {
      filter: async (filters) => {
        return mockData.dailyChallenges.filter(challenge => {
          return Object.keys(filters).every(key => challenge[key] === filters[key]);
        });
      }
    },

    ChatMessage: {
      filter: async (filters, orderBy = null, limit = null) => {
        let results = mockData.chatMessages.filter(message => {
          return Object.keys(filters).every(key => message[key] === filters[key]);
        });
        
        if (orderBy === '-created_date') {
          results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        }
        
        if (limit) {
          results = results.slice(0, limit);
        }
        
        return results;
      },
      create: async (data) => {
        const newMessage = { 
          ...data, 
          id: generateId(),
          created_date: new Date().toISOString()
        };
        mockData.chatMessages.push(newMessage);
        return newMessage;
      }
    }
  },

  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        // Mock AI responses for physics questions
        const responses = [
          "Newton's second law states that F = ma, where F is the net force applied to an object, m is its mass, and a is its acceleration. This fundamental law explains how forces cause changes in motion.",
          "Ohm's law describes the relationship between voltage (V), current (I), and resistance (R) in an electrical circuit: V = IR. This means that current is directly proportional to voltage and inversely proportional to resistance.",
          "A convex lens converges parallel light rays to a focal point. The distance from the lens to this point is called the focal length. The lens equation 1/f = 1/v + 1/u relates the focal length to object and image distances.",
          "Wave interference occurs when two or more waves overlap. Constructive interference happens when waves are in phase (peaks align), resulting in increased amplitude. Destructive interference occurs when waves are out of phase (peak meets trough), reducing amplitude.",
          "The time period of a simple pendulum depends on its length and gravitational acceleration: T = 2π√(L/g). Interestingly, it doesn't depend on the mass of the bob or the amplitude (for small angles)."
        ];
        
        // Simple keyword matching for more relevant responses
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('newton') || lowerPrompt.includes('force')) {
          return responses[0];
        } else if (lowerPrompt.includes('ohm') || lowerPrompt.includes('current') || lowerPrompt.includes('voltage')) {
          return responses[1];
        } else if (lowerPrompt.includes('lens') || lowerPrompt.includes('optics')) {
          return responses[2];
        } else if (lowerPrompt.includes('wave') || lowerPrompt.includes('interference')) {
          return responses[3];
        } else if (lowerPrompt.includes('pendulum') || lowerPrompt.includes('oscillation')) {
          return responses[4];
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }
};