import { NavLink, Route, Routes } from 'react-router-dom';
import Hoje from './paginas/Hoje.jsx';
import Registro from './paginas/Registro.jsx';
import Folha from './paginas/Folha.jsx';
import Topicos from './paginas/Topicos.jsx';
import Cadastros from './paginas/Cadastros.jsx';
import Recompensa from './paginas/Recompensa.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="topo nao-imprimir">
        <span className="marca">📚 Controle de Estudos</span>
        <nav>
          <NavLink to="/" end>Hoje</NavLink>
          <NavLink to="/topicos">Tópicos</NavLink>
          <NavLink to="/cadastros">Obrigações e agenda</NavLink>
          <NavLink to="/recompensa">Recompensa</NavLink>
        </nav>
      </header>
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Hoje />} />
          <Route path="/registro/:criancaId/:data" element={<Registro />} />
          <Route path="/folha/:criancaId/:data" element={<Folha />} />
          <Route path="/topicos" element={<Topicos />} />
          <Route path="/cadastros" element={<Cadastros />} />
          <Route path="/recompensa" element={<Recompensa />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>
    </div>
  );
}
