import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './apps/MainApp.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
