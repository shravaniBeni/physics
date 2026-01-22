// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API
  BASE_URL: (() => {
    // In development, use localhost
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_API_URL || 'http://localhost:3002';
    }
    
    // In production, use environment variable or relative path
    return import.meta.env.VITE_API_URL || '/api';
  })(),
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/auth/profile',
      CHANGE_PASSWORD: '/api/auth/change-password'
    },
    EXPERIMENTS: {
      LIST: '/api/experiments',
      DETAIL: '/api/experiments',
      CATEGORIES: '/api/experiments/meta/categories'
    },
    PROGRESS: {
      LIST: '/api/user-progress',
      UPDATE: '/api/user-progress',
      EXPERIMENT: '/api/user-progress/experiment'
    },
    QUIZ: {
      GET: '/api/quiz/experiment',
      SUBMIT: '/api/quiz/submit',
      ATTEMPTS: '/api/quiz/attempts',
      GENERATE: '/api/quiz/experiment',
      ADAPTIVE: '/api/quiz/experiment',
      STATS: '/api/quiz/stats'
    },
    GAMIFICATION: {
      POINTS: '/api/gamification/points',
      BADGES: '/api/gamification/badges',
      LEADERBOARD: '/api/gamification/leaderboard',
      DAILY_CHALLENGES: '/api/gamification/daily-challenges'
    },
    AI: {
      CHAT: '/api/ai/chat',
      EXPERIMENT_EXPLANATION: '/api/ai/experiment',
      QUIZ_EXPLANATION: '/api/ai/quiz/explanation',
      STUDY_TIPS: '/api/ai/experiment',
      STATUS: '/api/ai/status'
    },
    HEALTH: '/api/health'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for making API requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};