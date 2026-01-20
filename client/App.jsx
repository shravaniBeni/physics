import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VirtualLab from './pages/VirtualLab';
import ExperimentDetail from './pages/ExperimentDetail';
import ExperimentGuide from './pages/ExperimentGuide';
import AIAssistant from './pages/AIAssistant';
import ConceptVisualizer from './pages/ConceptVisualizer';
import Practice from './pages/Practice';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Home page without layout */}
        <Route path="/" element={<Home />} />
        
        {/* App pages with layout */}
        <Route path="/dashboard" element={
          <Layout currentPageName="Dashboard">
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/virtuallab" element={
          <Layout currentPageName="VirtualLab">
            <VirtualLab />
          </Layout>
        } />
        
        <Route path="/experimentdetail" element={
          <Layout currentPageName="ExperimentDetail">
            <ExperimentDetail />
          </Layout>
        } />
        
        <Route path="/experimentguide" element={
          <Layout currentPageName="ExperimentGuide">
            <ExperimentGuide />
          </Layout>
        } />
        
        <Route path="/aiassistant" element={
          <Layout currentPageName="AIAssistant">
            <AIAssistant />
          </Layout>
        } />
        
        <Route path="/conceptvisualizer" element={
          <Layout currentPageName="ConceptVisualizer">
            <ConceptVisualizer />
          </Layout>
        } />
        
        <Route path="/practice" element={
          <Layout currentPageName="Practice">
            <Practice />
          </Layout>
        } />
        
        <Route path="/analytics" element={
          <Layout currentPageName="Analytics">
            <Analytics />
          </Layout>
        } />
        
        <Route path="/leaderboard" element={
          <Layout currentPageName="Leaderboard">
            <Leaderboard />
          </Layout>
        } />
        
        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}