import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../Components/ui/button';
import { Card } from '../Components/ui/card';
import ApiTest from '../Components/ApiTest';
import { 
  Play, 
  Sparkles, 
  FlaskConical, 
  MessageCircle, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
  Zap,
  BookOpen,
  Target
} from 'lucide-react';

const features = [
  {
    icon: FlaskConical,
    title: 'Interactive Virtual Lab',
    description: 'Conduct physics experiments with real-time simulations and instant feedback',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    icon: MessageCircle,
    title: 'AI Physics Tutor',
    description: 'Get personalized explanations and step-by-step guidance from our AI assistant',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track your progress with detailed insights and personalized study recommendations',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: Target,
    title: 'Exam-Focused Content',
    description: 'Tailored for JEE, NEET, CET, and Board exam preparation with targeted practice',
    color: 'from-orange-500 to-red-600'
  }
];

const experiments = [
  { name: 'Simple Pendulum', icon: '⚙️', description: 'Study oscillatory motion and time period calculations' },
  { name: "Ohm's Law", icon: '⚡', description: 'Explore the relationship between voltage, current, and resistance' },
  { name: 'Lens Optics', icon: '🔬', description: 'Understand image formation and focal length concepts' },
  { name: 'Wave Motion', icon: '🌊', description: 'Visualize wave properties and interference patterns' }
];

const stats = [
  { value: '10,000+', label: 'Students Learning', icon: Users },
  { value: '50+', label: 'Interactive Experiments', icon: FlaskConical },
  { value: '95%', label: 'Concept Clarity', icon: CheckCircle },
  { value: '4.8/5', label: 'Student Rating', icon: Award }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-6">
              <Sparkles className="w-6 h-6" />
              <span className="text-lg font-medium">Welcome to QuantIQ</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
              Master Physics Through
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Interactive Learning
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
              Transform your physics understanding with AI-powered virtual experiments, 
              personalized tutoring, and exam-focused practice designed for JEE, NEET, and Board success.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25">
                  <Play className="w-5 h-5 mr-2" />
                  Start Learning Now
                </Button>
              </Link>
              <Link to={createPageUrl('VirtualLab')}>
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <FlaskConical className="w-5 h-5 mr-2" />
                  Explore Virtual Lab
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose QuantIQ?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Experience physics like never before with our cutting-edge learning platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 p-6 hover:border-cyan-500/50 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experiments Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Interactive Physics Experiments
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Hands-on simulations that make complex physics concepts crystal clear
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiments.map((exp, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 p-6 hover:border-purple-500/50 transition-all group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {exp.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {exp.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{exp.description}</p>
                <div className="flex items-center text-purple-400 text-sm font-medium">
                  Try Now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to={createPageUrl('VirtualLab')}>
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                View All Experiments
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-slate-900 border border-slate-800 p-12">
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Physics Learning?
              </h2>
              <p className="text-xl text-slate-400 mb-8">
                Join thousands of students who are mastering physics concepts through interactive learning
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Zap className="w-5 h-5 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* API Connection Test */}
            <div className="mt-12">
              <ApiTest />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}