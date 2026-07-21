import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initProfileTheme } from './data/profile';

// Aplica o tema salvo (cores da interface) antes da 1ª renderização.
initProfileTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
