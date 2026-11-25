// Gabarito: só para o adulto, com a resposta e o histórico de erros de cada item.
import CabecalhoFolha from './CabecalhoFolha.jsx';
import { Caixa } from '../comum.jsx';
import { NOME_MOTIVO } from '../../regras/montarFolha.js';
import { ICONE_RESULTADO } from '../../regras/caixas.js';
import { formatarCurta } from '../../regras/datas.js';
import { precisaNovaAula } from '../../regras/historico.js';

export default function Gabarito({ folha, crianca, itens, perguntasPorId, errosPorTopico, topicosPorId }) {
  const estudo = itens.filter((i) => i.topicoId);
  const tarefas = itens.filter((i) => !i.topicoId);

  return (
    <div className="folha folha-gabarito">
      <CabecalhoFolha folha={folha} crianca={crianca} titulo={`GABARITO · ${crianca.apelido}`} mostrarElogio={false} />
      <p className="legenda">Uso exclusivo do adulto. A ordem é a mesma da folha e do registro.</p>

      <table className="tabela-gabarito">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Resposta</th>
            <th>Histórico de erros</th>
          </tr>
        </thead>
        <tbody>
          {estudo.map((item) => {
            const pergunta = perguntasPorId[item.perguntaId];
            const erros = errosPorTopico[item.topicoId] ?? [];
            return (
              <tr key={item.id}>
                <td>{item.ordem}</td>
                <td>
                  <strong>{item.titulo}</strong>
                  <br />
                  <small>
                    {item.materia} · <Caixa caixa={item.caixaNaFolha} /> · {NOME_MOTIVO[item.motivo]}
                  </small>
                  {item.tipoPergunta !== 'ditado' && <div className="enunciado-gabarito">{item.enunciado}</div>}
                </td>
                <td>
                  {item.tipoPergunta === 'ditado' ? (
                    <ol className="palavras-ditado">
                      {item.palavras.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ol>
                  ) : (
                    pergunta?.resposta || '—'
                  )}
                </td>
                <td>
                  {precisaNovaAula(erros) && <div className="selo selo-alerta">talvez precise de nova aula</div>}
                  {erros.length === 0 ? (
                    <span className="suave">sem erros</span>
                  ) : (
                    <ul className="historico-gabarito">
                      {erros.map((e) => (
                        <li key={e.id}>
                          {formatarCurta(e.data)} {ICONE_RESULTADO[e.resultado]} {e.marcas?.length ? `[${e.marcas.join(' ')}] ` : ''}
                          {e.texto ? <q>{e.texto}</q> : <span className="suave">sem anotação</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tarefas.length > 0 && (
        <>
          <h2 className="folha-secao">Tarefas do dia</h2>
          <p>{tarefas.map((t) => `${t.ordem}. ${t.titulo}`).join(' · ')}</p>
        </>
      )}

      {folha.excedentes?.length > 0 && (
        <>
          <h2 className="folha-secao">Ficaram para a próxima folha (limite por bloco)</h2>
          <p>{folha.excedentes.map((e) => topicosPorId[e.topicoId]?.titulo ?? e.topicoId).join(' · ')}</p>
        </>
      )}
    </div>
  );
}
