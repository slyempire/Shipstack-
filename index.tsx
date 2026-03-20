
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Suppress Recharts defaultProps warning
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Support for defaultProps will be removed from function components')) {
    return;
  }
  originalConsoleError(...args);
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
