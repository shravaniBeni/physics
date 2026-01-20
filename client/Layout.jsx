import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Home, 
  FlaskConical, 
  BookOpen, 
  MessageCircle, 
  Lightbulb, 
  ClipboardCheck, 
  BarChart3,
  Menu,
  X,
  Atom,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PointsDisplay from './Components/gamification/PointsDisplay';

const navItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Virtual Lab', icon: FlaskConical, page: 'VirtualLab' },
  { name: 'Experiment Guide', icon: BookOpen, page: 'ExperimentGuide' },
  { name: 'AI Assistant', icon: MessageCircle, page: 'AIAssistant' },
  { name: 'Concept Visualizer', icon: Lightbulb, page: 'ConceptVisualizer' },
  { name: 'Practice & Quiz', icon: ClipboardCheck, page: 'Practice' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        :root {
          --accent-cyan: #06b6d4;
          --accent-blue: #3b82f6;
          --accent-purple: #8b5cf6;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-border {
          border: 1px solid transparent;
          background: linear-gradient(var(--bg), var(--bg)) padding-box,
                      linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)) border-box;
        }
        .glow-cyan {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
        }
        .glow-purple {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Atom className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Physics Pocket Lab</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-40 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center glow-cyan">
              <Atom className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl gradient-text">Physics Pocket Lab</h1>
              <p className="text-xs text-slate-500">Virtual Experiments</p>
            </div>
          </div>
        </div>

        <div className="mt-20 lg:mt-4 px-4 mb-4">
          <PointsDisplay />
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border border-slate-700">
            <p className="text-sm text-slate-400">Need help?</p>
            <p className="text-xs text-slate-500 mt-1">Ask our AI Assistant for physics explanations</p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}