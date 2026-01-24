import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './Components/auth/ProtectedRoute';
import Login from './Components/auth/Login';
import Register from './Components/auth/Register';
import UserProfile from './Components/auth/UserProfile';
import Layout from './Layout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VirtualLab from './pages/VirtualLab';
import HardwareLab from './pages/HardwareLab';
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
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth routes (only accessible when not logged in) */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Register />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes (require authentication) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout currentPageName="Dashboard">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout currentPageName="Profile">
              <UserProfile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/virtuallab" element={
          <ProtectedRoute>
            <Layout currentPageName="VirtualLab">
              <VirtualLab />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/hardwarelab" element={
          <ProtectedRoute>
            <Layout currentPageName="HardwareLab">
              <HardwareLab />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/experimentdetail" element={
          <ProtectedRoute>
            <Layout currentPageName="ExperimentDetail">
              <ExperimentDetail />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/experimentguide" element={
          <ProtectedRoute>
            <Layout currentPageName="ExperimentGuide">
              <ExperimentGuide />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/aiassistant" element={
          <ProtectedRoute>
            <Layout currentPageName="AIAssistant">
              <AIAssistant />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/conceptvisualizer" element={
          <ProtectedRoute>
            <Layout currentPageName="ConceptVisualizer">
              <ConceptVisualizer />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/practice" element={
          <ProtectedRoute>
            <Layout currentPageName="Practice">
              <Practice />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout currentPageName="Analytics">
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Layout currentPageName="Leaderboard">
              <Leaderboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Redirect unknown routes to dashboard for authenticated users, home for others */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          theme="dark"
          richColors
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}