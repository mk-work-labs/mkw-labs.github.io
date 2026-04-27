import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SettingsApp from './apps/SettingsApp.jsx';
import { setupStorageErrorAlerts } from './storage/error-alerts.js';
import './styles/global.css';

setupStorageErrorAlerts();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>
);
