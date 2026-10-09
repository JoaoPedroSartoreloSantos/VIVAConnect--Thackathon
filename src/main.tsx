import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA installability and offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('VIVA+ Service Worker ativo:', reg.scope);
      })
      .catch((err) => {
        console.warn('Erro ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
