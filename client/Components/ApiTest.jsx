import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { API_CONFIG, apiRequest } from '../config/api';

export default function ApiTest() {
  const [status, setStatus] = useState('Testing...');
  const [serverInfo, setServerInfo] = useState(null);

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      
      const data = await apiRequest(API_CONFIG.ENDPOINTS.HEALTH);
      setServerInfo(data);
      setStatus('✅ Connected successfully!');
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
      console.error('API Test Error:', error);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">API Connection Test</h3>
      
      <div className="space-y-3">
        <div>
          <span className="text-slate-400">API URL: </span>
          <span className="text-cyan-400">{API_CONFIG.BASE_URL}</span>
        </div>
        
        <div>
          <span className="text-slate-400">Status: </span>
          <span className={status.includes('✅') ? 'text-green-400' : status.includes('❌') ? 'text-red-400' : 'text-yellow-400'}>
            {status}
          </span>
        </div>
        
        {serverInfo && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700">
            <h4 className="text-white font-medium mb-2">Server Info:</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-slate-400">Status:</span> <span className="text-green-400">{serverInfo.status}</span></div>
              <div><span className="text-slate-400">Timestamp:</span> <span className="text-slate-300">{new Date(serverInfo.timestamp).toLocaleString()}</span></div>
              <div><span className="text-slate-400">Uptime:</span> <span className="text-slate-300">{Math.round(serverInfo.uptime)}s</span></div>
            </div>
          </div>
        )}
        
        <Button 
          onClick={testConnection}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          Test Again
        </Button>
      </div>
    </div>
  );
}