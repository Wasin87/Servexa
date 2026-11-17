import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('WebSocket closed without opened')) {
      event.preventDefault();
    }
  });
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.update().catch(() => {});
      });
    }).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
