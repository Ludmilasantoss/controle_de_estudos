// Tela 5 — Obrigações fixas e agenda (cadastro simples) + configurações do método.
import { useEffect, useState } from 'react';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro } from '../componentes/comum.jsx';
import { NOMES_DIAS_CURTOS } from '../regras/datas.js';
import { TIPO_FOLHA, NOME_TIPO_FOLHA, PERIODOS, NOME_PERIODO, TIPOS_TAREFA } from '../regras/configuracao.js';

const TIPOS_OBRIGACAO = TIPOS_TAREFA.filter((t) => t !== 'Nova' && t !== 'Revisão');
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

export default function Cadastros() {
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [criancas, obrigacoes, agenda, config] = await Promise.all([
      repositorio.listarCriancas(),
      repositorio.listarObrigacoes(),
      repositorio.obterAgenda(),
      repositorio.obterConfig(),
    ]);
    return { criancas, obrigacoes, agenda, config };
  }, []);

  if (carregando && !dados) return <Carregando />;
  if (erro) return <Erro erro={erro} />;
  const { criancas, obrigacoes, agenda, config } = dados;

  return (
    <>
      <h1>Obrigações fixas e agenda</h1>

      <h2>Obrigações fixas</h2>
      <p className="suave">Geram tarefas na folha nos dias marcados. Casa, animais e apps vão para a página separada; apps não têm horário.</p>
      {criancas.map((c) => (
        <div key={c.id} className="painel">
          <h3 style={{ marginTop: 0 }}>{c.apelido}</h3>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Dias</th>
                  <th>Recompensa</th>
                  <th>Ativa</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {obrigacoes
                  .filter((o) => o.criancaId === c.id)
                  .map((o) => (
                    <LinhaObrigacao key={o.id} obrigacao={o} aoMudar={recarregar} />
                  ))}
                <LinhaObrigacao obrigacao={{ criancaId: c.id, titulo: '', tipo: 'Casa', periodo: 'manha', dias: [0, 1, 2, 3, 4, 5, 6], contaRecompensa: true, ativa: true }} nova aoMudar={recarregar} />
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <h2>Agenda semanal</h2>
      <div className="painel tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th>Criança</th>
              {ORDEM_DIAS.map((d) => (
                <th key={d}>{NOMES_DIAS_CURTOS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criancas.map((c) => (
              <tr key={c.id}>
                <td>{c.apelido}</td>
                {ORDEM_DIAS.map((d) => {
                  const linha = agenda.find((a) => a.criancaId === c.id && a.diaSemana === d);
                  return (
                    <td key={d}>
                      <select
                        value={linha?.tipoFolha ?? ''}
                        onChange={async (e) => {
                          await repositorio.definirAgenda(c.id, d, e.target.value);
                          recarregar();
                        }}
                      >
                        {Object.values(TIPO_FOLHA).map((t) => (
                          <option key={t} value={t}>
                            {NOME_TIPO_FOLHA[t]}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="suave">
          O bloco autônomo (adulto ausente) é marcado por dia, na própria folha. O horário das “Revisões do dia” do Rafael fica no cadastro da criança (dados de exemplo).
        </p>
      </div>

      <h2>Configurações do método</h2>
      <FormConfig config={config} aoSalvar={recarregar} />

      <h2>Dados de exemplo</h2>
      <div className="painel">
        <p>Apaga tudo o que está salvo neste navegador e recarrega os dados fictícios, com datas a partir de hoje.</p>
        <button
          className="botao botao-perigo"
          onClick={async () => {
            if (!window.confirm('Apagar os dados atuais e restaurar os dados de exemplo?')) return;
            await repositorio.restaurarExemplo();
            window.location.href = '/';
          }}
        >
          Restaurar dados de exemplo
        </button>
      </div>
    </>
  );
}

function LinhaObrigacao({ obrigacao, nova = false, aoMudar }) {
  const [o, setO] = useState(obrigacao);
  const [alterada, setAlterada] = useState(false);
  useEffect(() => {
    setO(obrigacao);
    setAlterada(false);
  }, [obrigacao]);

  const mudar = (campo, valor) => {
    setO({ ...o, [campo]: valor });
    setAlterada(true);
  };
  const alternarDia = (d) => mudar('dias', o.dias.includes(d) ? o.dias.filter((x) => x !== d) : [...o.dias, d]);

  async function salvar() {
    if (!o.titulo.trim()) return;
    await repositorio.salvarObrigacao(o);
    if (nova) setO(obrigacao);
    aoMudar();
  }

  return (
    <tr>
      <td>
        <input type="text" value={o.titulo} placeholder={nova ? 'Nova obrigação…' : ''} onChange={(e) => mudar('titulo', e.target.value)} />
      </td>
      <td>
        <select value={o.tipo} onChange={(e) => mudar('tipo', e.target.value)}>
          {TIPOS_OBRIGACAO.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </td>
      <td>
        {o.tipo === 'App' ? (
          <span className="suave">sem horário</span>
        ) : (
          <select value={o.periodo ?? 'manha'} onChange={(e) => mudar('periodo', e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {NOME_PERIODO[p]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td>
        <div className="dias">
          {ORDEM_DIAS.map((d) => (
            <label key={d}>
              <input type="checkbox" checked={o.dias.includes(d)} onChange={() => alternarDia(d)} />
              {NOMES_DIAS_CURTOS[d]}
            </label>
          ))}
        </div>
      </td>
      <td>
        <input type="checkbox" checked={o.contaRecompensa !== false} onChange={(e) => mudar('contaRecompensa', e.target.checked)} />
      </td>
      <td>
        <input type="checkbox" checked={o.ativa !== false} onChange={(e) => mudar('ativa', e.target.checked)} />
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {(alterada || nova) && (
          <button className="botao botao-pequeno" onClick={salvar}>
            {nova ? 'Adicionar' : 'Salvar'}
          </button>
        )}
        {!nova && (
          <button
            className="botao-link"
            onClick={async () => {
              if (!window.confirm(`Excluir "${o.titulo}"?`)) return;
              await repositorio.excluirObrigacao(o.id);
              aoMudar();
            }}
          >
            excluir
          </button>
        )}
      </td>
    </tr>
  );
}

function FormConfig({ config, aoSalvar }) {
  const [c, setC] = useState(config);
  const num = (campo) => (e) => setC({ ...c, [campo]: Number(e.target.value) });
  const rec = (campo, valor) => setC({ ...c, recompensa: { ...c.recompensa, [campo]: valor } });

  return (
    <form
      className="painel"
      onSubmit={async (e) => {
        e.preventDefault();
        await repositorio.salvarConfig(c);
        aoSalvar();
      }}
    >
      <div className="grade-2">
        <div>
          <h3 style={{ marginTop: 0 }}>Revisões</h3>
          <label>
            Limite de revisões por bloco (matéria):{' '}
            <input type="number" min="1" max="20" value={c.limitePorBloco} onChange={num('limitePorBloco')} style={{ width: 70 }} />
          </label>
          <br />
          <label>
            Limite na sexta: <input type="number" min="1" max="30" value={c.limitePorBlocoSexta} onChange={num('limitePorBlocoSexta')} style={{ width: 70 }} />
          </label>
          <br />
          <label>
            Limite no domingo: <input type="number" min="1" max="30" value={c.limitePorBlocoDomingo} onChange={num('limitePorBlocoDomingo')} style={{ width: 70 }} />
          </label>
          <br />
          <label>
            Quiz de sexta: 🟡/❌ dos últimos <input type="number" min="1" max="14" value={c.janelaQuizDias} onChange={num('janelaQuizDias')} style={{ width: 60 }} /> dias
          </label>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>Recompensa (suposição)</h3>
          <label>
            Teto semanal (R$): <input type="number" min="0" step="0.5" value={c.recompensa.teto} onChange={(e) => rec('teto', Number(e.target.value))} style={{ width: 80 }} />
          </label>
          <br />
          <label>
            Fórmula:{' '}
            <select value={c.recompensa.formula} onChange={(e) => rec('formula', e.target.value)}>
              <option value="proporcional">Proporcional: teto × feitas ÷ que contam</option>
              <option value="por_tarefa">Valor fixo por tarefa feita (até o teto)</option>
            </select>
          </label>
          {c.recompensa.formula === 'por_tarefa' && (
            <>
              <br />
              <label>
                Valor por tarefa (R$):{' '}
                <input type="number" min="0" step="0.1" value={c.recompensa.valorPorTarefa} onChange={(e) => rec('valorPorTarefa', Number(e.target.value))} style={{ width: 80 }} />
              </label>
            </>
          )}
          <br />
          <label>
            <input type="checkbox" checked={c.estudoContaRecompensa} onChange={(e) => setC({ ...c, estudoContaRecompensa: e.target.checked })} /> Itens de estudo contam
            para a recompensa (vale para folhas geradas depois)
          </label>
        </div>
      </div>
      <button className="botao" style={{ marginTop: '0.75rem' }}>
        Salvar configurações
      </button>
    </form>
  );
}
