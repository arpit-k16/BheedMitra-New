/**
 * API Status Component - Shows backend connection status
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';

function ApiStatus() {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const health = await api.healthCheck();
      setStatus('connected');
      setDetails(health);
    } catch (error) {
      setStatus('disconnected');
      setDetails(null);
    }
  };

  const statusColor = {
    checking: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500'
  };

  const statusText = {
    checking: 'Connecting...',
    connected: 'API Connected',
    disconnected: 'API Offline'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${statusColor[status]} animate-pulse`} />
      <span className="text-xs text-gray-400">{statusText[status]}</span>
      {status === 'connected' && details && (
        <span className="text-xs text-gray-500">
          ({details.total_stations} stations)
        </span>
      )}
    </div>
  );
}

export default ApiStatus;
