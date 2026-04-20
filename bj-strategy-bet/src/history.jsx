import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import HistoryApp from './apps/HistoryApp.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HistoryApp />
  </StrictMode>
);
