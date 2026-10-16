import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Progressive Web App (PWA) Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('PWA: New content available, updating service worker...');
    },
    onOfflineReady() {
      console.log('PWA: Application cached and ready for offline use.');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
