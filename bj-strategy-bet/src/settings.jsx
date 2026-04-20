import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SettingsApp from './apps/SettingsApp.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>
);
