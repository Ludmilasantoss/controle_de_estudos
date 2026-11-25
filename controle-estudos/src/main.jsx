import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { repositorio } from './data/repositorio.js';
import './estilos/base.css';
import './estilos/impressao.css';

// Na primeira execução, carrega os dados de exemplo.
repositorio.inicializar().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
