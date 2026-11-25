// Versão do Rafael: estudo em quantas páginas precisar; casa, animais e apps em página separada.
import CabecalhoFolha from './CabecalhoFolha.jsx';
import { agruparEmSequencia, nomePeriodo } from '../comum.jsx';
import { diaDaSemana } from '../../regras/datas.js';

/** Linhas de resposta: pergunta aberta ≥ 3; ditado ≥ 2 (mais se houver muitas palavras). */
export function linhasDeResposta(item) {
  if (item.tipoPergunta === 'aberta') return 3;
  if (item.tipoPergunta === 'ditado') return Math.max(2, Math.ceil((item.palavras?.length ?? 0) / 4));
  return 1;
}

function Linhas({ n }) {
  return (
    <div className="linhas">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="linha" />
      ))}
    </div>
  );
}

export default function FolhaRafael({ folha, crianca, itens }) {
  const estudo = itens.filter((i) => i.topicoId);
  const rotinaEstudo = itens.filter((i) => !i.topicoId && i.secao === 'estudo');
  const casa = itens.filter((i) => i.secao === 'casa');
  const bloco = crianca.blocoRevisoes;
  const temBlocoHoje = bloco && bloco.dias.includes(diaDaSemana(folha.data));

  return (
    <div className="folha folha-rafael">
      <CabecalhoFolha folha={folha} crianca={crianca} />

      {estudo.length > 0 && (
        <section>
          <h2 className="folha-secao">
            {temBlocoHoje ? `${bloco.titulo} (${bloco.horario})` : 'Estudo'}
          </h2>
          <p className="legenda">Marque <b>*</b> se olhou o livro e <b>?</b> se não tem certeza.</p>
          {agruparEmSequencia(estudo, (i) => i.materia).map((g) => (
            <div key={g.chave} className="bloco-materia">
              <h3>{g.chave}</h3>
              {g.itens.map((item) => (
                <div key={item.id} className="questao">
                  <div className="questao-enunciado">
                    <span className="questao-numero">{item.ordem}.</span>
                    {item.tipo === 'Nova' && <span className="etiqueta-nova">novo</span>}
                    <span>{item.tipoPergunta === 'ditado' ? `${item.titulo} — escreva as palavras que o adulto ditar.` : item.enunciado}</span>
                    <span className="marcas-papel">* ?</span>
                  </div>
                  <Linhas n={linhasDeResposta(item)} />
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {rotinaEstudo.length > 0 && (
        <section>
          <h2 className="folha-secao">Rotina</h2>
          <ListaMarcavel itens={rotinaEstudo} />
        </section>
      )}

      {casa.length > 0 && (
        <section className={estudo.length || rotinaEstudo.length ? 'pagina-separada' : ''}>
          {(estudo.length > 0 || rotinaEstudo.length > 0) && (
            <div className="cabecalho-continuacao">
              <div className="faixa-leia">LEIA TUDO — a lista muda todo dia</div>
              {crianca.apelido} · {folha.data.split('-').reverse().join('/')}
            </div>
          )}
          <h2 className="folha-secao">Casa, animais e apps</h2>
          <p className="legenda">✓ feito · ✗ não feito · ● não se aplica</p>
          {agruparEmSequencia(casa, (i) => i.periodo ?? 'sem_horario').map((g) => (
            <div key={g.chave}>
              <h3>{nomePeriodo(g.itens[0].periodo)}</h3>
              <ListaMarcavel itens={g.itens} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export function ListaMarcavel({ itens, comEmoji = false }) {
  return (
    <ul className="lista-marcavel">
      {itens.map((item) => (
        <li key={item.id}>
          <span className="quadrado" />
          <span className="questao-numero">{item.ordem}.</span>
          {comEmoji && <span className="emoji">{item.emoji}</span>}
          {item.titulo}
        </li>
      ))}
    </ul>
  );
}
