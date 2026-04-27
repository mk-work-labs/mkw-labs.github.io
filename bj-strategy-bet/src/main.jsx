import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './apps/MainApp.jsx';
import { setupStorageErrorAlerts } from './storage/error-alerts.js';
import './styles/global.css';

setupStorageErrorAlerts();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
