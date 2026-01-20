# QuantIQ - AI-Powered Physics Learning Platform

QuantIQ is a modern, comprehensive physics learning platform designed for competitive exam aspirants (JEE, NEET, CET, Boards) who want to understand physics conceptually rather than through rote learning.

## 🚀 Features

### 🧪 Virtual Physics Laboratory
- **Interactive Simulations**: Real-time physics experiments with visual feedback
- **5 Core Experiments**:
  - Simple Pendulum (oscillatory motion, time period calculations)
  - Ohm's Law (V-I characteristics, resistance relationships)
  - Projectile Motion (trajectory analysis, range optimization)
  - Wave Interference (constructive/destructive patterns)
  - Lens Optics (image formation, focal length studies)

### 🤖 AI Physics Assistant
- Context-aware AI tutor focused on physics concepts
- Step-by-step explanations in simple language
- Two explanation modes: Quick & Detailed
- Guides students during virtual experiments
- Performance-based suggestions

### 📊 Analytics & Progress Tracking
- Topic-wise performance analysis
- Weak area identification with targeted recommendations
- Progress graphs and trend analysis
- Time spent tracking
- Completion statistics

### 🎯 Practice & Assessment
- AI-generated quizzes by topic and difficulty
- Instant feedback with detailed explanations
- Flashcard system for formulas and concepts
- Performance analytics and scoring

### 🏆 Gamification System
- Points and badges for achievements
- Daily challenges with bonus rewards
- Leaderboard competition
- Progress milestones and celebrations

### 💡 Concept Visualizer
- Interactive formula breakdowns
- Real-life examples and applications
- Visual representations of physics concepts
- Variable explanations and unit analysis

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Routing**: React Router
- **Icons**: Lucide React

## 📁 Project Structure

```
quantiq/
├── client/                 # Frontend application
│   ├── Components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── simulations/   # Physics simulation components
│   │   └── gamification/  # Gamification components
│   ├── pages/             # Application pages
│   ├── App.jsx           # Main app component
│   ├── Layout.js         # App layout wrapper
│   ├── main.jsx          # React entry point
│   ├── index.css         # Global styles
│   └── utils.js          # Utility functions
├── api/                   # Mock API client
├── lib/                   # Utility libraries
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quantiq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Key Pages & Features

### 🏠 Home Page
- Clean landing page with value proposition
- Feature highlights and experiment previews
- Call-to-action for getting started

### 📊 Dashboard
- Personalized learning overview
- Progress statistics and achievements
- Quick access to experiments and challenges
- Recent activity and suggestions

### 🧪 Virtual Lab
- Browse experiments by category and difficulty
- Search and filter functionality
- Experiment cards with progress tracking
- Direct access to simulations

### 🔬 Experiment Detail
- Interactive physics simulations
- Step-by-step experiment guides
- Theory explanations and formulas
- Progress tracking and completion

### 🤖 AI Assistant
- Chat interface with physics AI tutor
- Quick and detailed explanation modes
- Context-aware responses
- Chat history and suggestions

### 📈 Analytics
- Comprehensive performance dashboard
- Category-wise progress charts
- Quiz performance analysis
- Weak area identification

### 🎮 Practice & Quizzes
- Topic-based quiz generation
- Multiple difficulty levels
- Instant feedback and explanations
- Performance tracking

### 🏆 Leaderboard
- Global rankings by points
- Achievement showcases
- Competitive learning environment

## 🎨 Design System

### Color Palette
- **Primary**: Cyan (#06b6d4) to Purple (#8b5cf6) gradients
- **Background**: Dark slate theme (#0f172a, #1e293b)
- **Accent Colors**: 
  - Success: Emerald (#10b981)
  - Warning: Amber (#f59e0b)
  - Error: Rose (#ef4444)

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable text with proper contrast

### Components
- Consistent rounded corners and shadows
- Smooth micro-interactions and transitions
- Responsive design for all screen sizes
- Accessible color contrasts and focus states

## 🔧 Customization

### Adding New Experiments
1. Create simulation component in `client/Components/simulations/`
2. Add experiment data to mock API
3. Update experiment routing in `ExperimentDetail.jsx`

### Modifying UI Components
- All UI components are in `client/Components/ui/`
- Based on Shadcn/ui with Tailwind CSS
- Fully customizable and themeable

### Extending AI Responses
- Update the mock AI responses in `api/base44Client.js`
- Add keyword matching for better context awareness
- Integrate with real AI services as needed

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] Real backend integration
- [ ] Advanced physics simulations
- [ ] Mobile app development
- [ ] Collaborative learning features
- [ ] Advanced AI tutoring capabilities
- [ ] Integration with exam preparation platforms
- [ ] Offline mode support
- [ ] Multi-language support

---

**QuantIQ** - Transforming physics education through interactive learning and AI-powered guidance. Perfect for students preparing for competitive exams who want to truly understand physics concepts rather than memorize them.