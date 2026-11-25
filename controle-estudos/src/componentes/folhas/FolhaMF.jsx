// Versão da MF: letra grande, maiúsculas, emoji por item e ditado com 5 palavras por linha.
import CabecalhoFolha from './CabecalhoFolha.jsx';
import { agruparEmSequencia, emojiDoItem, nomePeriodo } from '../comum.jsx';

const PALAVRAS_POR_LINHA = 5;

function Ditado({ quantidade }) {
  const linhas = Math.max(1, Math.ceil(quantidade / PALAVRAS_POR_LINHA));
  let n = 0;
  return (
    <div className="ditado-mf">
      {Array.from({ length: linhas }, (_, l) => (
        <div key={l} className="ditado-linha">
          {Array.from({ length: Math.min(PALAVRAS_POR_LINHA, quantidade - l * PALAVRAS_POR_LINHA) }, () => {
            n += 1;
            return (
              <span key={n} className="ditado-palavra">
                <small>{n}</small>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function FolhaMF({ folha, crianca, itens }) {
  const estudo = itens.filter((i) => i.topicoId);
  // Mesma ordem do registro: rotina de estudo e depois casa/animais/apps por período.
  const rotina = itens.filter((i) => !i.topicoId && i.secao === 'estudo');
  const casa = itens.filter((i) => i.secao === 'casa');

  return (
    <div className="folha folha-mf">
      <CabecalhoFolha folha={folha} crianca={crianca} />

      {estudo.map((item) => (
        <div key={item.id} className="questao questao-mf">
          <div className="questao-enunciado">
            <span className="emoji">{emojiDoItem(item)}</span>
            <span className="questao-numero">{item.ordem}.</span>
            <span>{item.tipoPergunta === 'ditado' ? `DITADO: ${item.titulo}` : item.enunciado}</span>
          </div>
          {item.tipoPergunta === 'ditado' ? <Ditado quantidade={item.palavras.length || PALAVRAS_POR_LINHA} /> : <div className="linhas"><div className="linha" /></div>}
        </div>
      ))}

      {rotina.length > 0 && (
        <section>
          <h2 className="folha-secao">⭐ ROTINA</h2>
          <ListaMF itens={rotina} />
        </section>
      )}

      {casa.length > 0 && (
        <section>
          <h2 className="folha-secao">🏠 CASA, BICHOS E APPS</h2>
          {agruparEmSequencia(casa, (i) => i.periodo ?? 'sem_horario').map((g) => (
            <div key={g.chave}>
              <h3>{nomePeriodo(g.itens[0].periodo)}</h3>
              <ListaMF itens={g.itens} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ListaMF({ itens }) {
  return (
    <ul className="lista-marcavel">
      {itens.map((item) => (
        <li key={item.id}>
          <span className="quadrado" />
          <span className="questao-numero">{item.ordem}.</span>
          <span className="emoji">{emojiDoItem(item)}</span>
          {item.titulo}
        </li>
      ))}
    </ul>
  );
}
