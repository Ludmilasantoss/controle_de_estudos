// Tela 6 — Recompensa da semana, por criança, com as tarefas que contaram.
import { useState } from 'react';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro } from '../componentes/comum.jsx';
import { formatarCurta, somarDias, inicioDaSemana } from '../regras/datas.js';
import { formatarReais } from '../regras/recompensa.js';
import { ICONE_RESULTADO } from '../regras/caixas.js';
import { ICONE_STATUS, NOME_STATUS } from '../regras/registroItem.js';

export default function Recompensa() {
  const [deslocamento, setDeslocamento] = useState(0); // semanas a partir da atual
  const { dados, carregando, erro } = useCarregar(async () => {
    const hoje = await repositorio.hoje();
    const dataRef = somarDias(inicioDaSemana(hoje), deslocamento * 7);
    const criancas = await repositorio.listarCriancas();
    const resultados = await Promise.all(criancas.map((c) => repositorio.recompensaDaSemana(c.id, dataRef)));
    return { criancas, resultados, dataRef };
  }, [deslocamento]);

  if (carregando && !dados) return <Carregando />;
  if (erro) return <Erro erro={erro} />;
  const { criancas, resultados } = dados;
  const { inicio, fim } = resultados[0];

  return (
    <>
      <div className="acoes">
        <h1 style={{ marginRight: 'auto' }}>Recompensa da semana</h1>
        <button className="botao-secundario botao-pequeno" onClick={() => setDeslocamento(deslocamento - 1)}>
          ← anterior
        </button>
        <strong>
          {formatarCurta(inicio)} a {formatarCurta(fim)}
        </strong>
        <button className="botao-secundario botao-pequeno" onClick={() => setDeslocamento(deslocamento + 1)} disabled={deslocamento >= 0}>
          próxima →
        </button>
      </div>
      <p className="aviso">
        <b>Suposição:</b> a fórmula exata ainda não foi definida. Hoje está configurada como{' '}
        {resultados[0].formula === 'proporcional' ? 'proporcional (teto × feitas ÷ tarefas que contam)' : 'valor fixo por tarefa feita, até o teto'}. Mude em “Obrigações e
        agenda”. Só contam tarefas marcadas como “Conta para recompensa”; “Não se aplica” nunca conta.
      </p>

      <div className="grade-2">
        {criancas.map((c, i) => {
          const r = resultados[i];
          return (
            <div key={c.id} className="painel">
              <h2 style={{ marginTop: 0 }}>{c.apelido}</h2>
              <div className="numeros">
                <div>
                  <strong>{formatarReais(r.valor)}</strong>de {formatarReais(r.teto)}
                </div>
                <div>
                  <strong>
                    {r.feitas}/{r.contaveis}
                  </strong>
                  feitas / que contam
                </div>
              </div>
              {r.itens.length === 0 ? (
                <p className="suave">Nenhuma folha nesta semana.</p>
              ) : (
                <div className="tabela-rolagem">
                  <table>
                    <thead>
                      <tr>
                        <th>Dia</th>
                        <th>Tarefa</th>
                        <th>Marca</th>
                        <th>Contou?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.itens.map(({ tarefa, conta, feita, motivo }) => (
                        <tr key={tarefa.id} style={{ opacity: conta ? 1 : 0.55 }}>
                          <td>{formatarCurta(tarefa.data)}</td>
                          <td>{tarefa.topicoId ? `${tarefa.materia}: ${tarefa.titulo}` : tarefa.titulo}</td>
                          <td>
                            {tarefa.topicoId
                              ? ICONE_RESULTADO[tarefa.resultado] ?? '—'
                              : tarefa.status
                                ? `${ICONE_STATUS[tarefa.status]} ${NOME_STATUS[tarefa.status]}`
                                : '—'}
                          </td>
                          <td>{conta ? (feita ? '✔ conta e foi feita' : '✘ conta, não feita') : `fora: ${motivo}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
