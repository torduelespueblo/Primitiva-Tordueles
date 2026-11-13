import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with auto-update support
registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('WebApp Peña Primitiva Tordueles lista para uso sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
