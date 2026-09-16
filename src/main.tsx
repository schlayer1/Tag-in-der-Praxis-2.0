import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for offline app-shell capability
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!sessionStorage.getItem('tip_sw_reloaded')) {
      sessionStorage.setItem('tip_sw_reloaded', '1');
      window.location.reload();
    }
  });
}
