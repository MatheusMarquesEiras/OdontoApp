import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fontes embutidas no app (§offline): a fonte do texto e a dos ícones vêm do
// próprio instalador, não do Google Fonts. Sem isto, um PC sem internet abre o
// app com os ícones aparecendo como texto ("person", "search"…) e a letra
// serifada. Importadas ANTES do index.css para que as regras do app prevaleçam.
import 'material-symbols/outlined.css';
import '@fontsource-variable/inter/wght.css';
import './index.css';
import { initProfileTheme } from './data/profile';

// Aplica o tema salvo (cores da interface) antes da 1ª renderização.
initProfileTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
