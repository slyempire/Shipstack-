
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Suppress specific console logs and errors
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('Support for defaultProps will be removed from function components') || 
      msg.includes('Data read, but end of buffer not reached') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('WebSocket closed without opened')) {
    return;
  }
  originalConsoleError(...args);
};

console.log = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('ThemeManager: Theme update')) {
    return;
  }
  originalConsoleLog(...args);
};

// Global error suppression for Spline
window.onerror = (message) => {
  if (typeof message === 'string' && message.includes('Data read, but end of buffer not reached')) {
    return true; // Suppress the error
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
