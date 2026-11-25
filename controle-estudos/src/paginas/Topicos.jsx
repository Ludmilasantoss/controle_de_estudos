// Tela 4 — Tópicos: filtro por criança, matéria e caixa; histórico de erros datado e literal.
import { useState } from 'react';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro, Caixa } from '../componentes/comum.jsx';
import { formatarCurta } from '../regras/datas.js';
import { ICONE_RESULTADO, CAIXA_MAX } from '../regras/caixas.js';
import { precisaNovaAula, vezesQueVoltouParaCaixa1 } from '../regras/historico.js';

export default function Topicos() {
  const [filtro, setFiltro] = useState({ criancaId: '', materia: '', caixa: '' });
  const [abertos, setAbertos] = useState({});
  const [novaAula, setNovaAula] = useState(false);

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [topicos, criancas, materias, hoje] = await Promise.all([
      repositorio.listarTopicos(filtro),
      repositorio.listarCriancas(),
      repositorio.listarMaterias(),
      repositorio.hoje(),
    ]);
    return { topicos, criancas, materias, hoje };
  }, [filtro.criancaId, filtro.materia, filtro.caixa]);

  if (carregando && !dados) return <Carregando />;
  if (erro) return <Erro erro={erro} />;
  const { topicos, criancas, materias, hoje } = dados;
  const nomeDe = (id) => criancas.find((c) => c.id === id)?.apelido;
  const mudar = (campo) => (e) => setFiltro({ ...filtro, [campo]: e.target.value });

  return (
    <>
      <div className="acoes" style={{ justifyContent: 'space-between' }}>
        <h1>Tópicos</h1>
        <button className="botao" onClick={() => setNovaAula(!novaAula)}>
          + Nova aula / tópico
        </button>
      </div>

      {novaAula && (
        <FormNovaAula
          criancas={criancas}
          materias={materias}
          hoje={hoje}
          aoSalvar={() => {
            setNovaAula(false);
            recarregar();
          }}
        />
      )}

      <div className="filtros">
        <select value={filtro.criancaId} onChange={mudar('criancaId')}>
          <option value="">Todas as crianças</option>
          {criancas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apelido}
            </option>
          ))}
        </select>
        <select value={filtro.materia} onChange={mudar('materia')}>
          <option value="">Todas as matérias</option>
          {materias.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={filtro.caixa} onChange={mudar('caixa')}>
          <option value="">Todas as caixas</option>
          {Array.from({ length: CAIXA_MAX }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Caixa {i + 1}
            </option>
          ))}
          <option value="dominado">Dominados</option>
        </select>
        <span className="suave">{topicos.length} tópico(s)</span>
      </div>

      {topicos.map((t) => {
        const aberto = abertos[t.id];
        const alerta = precisaNovaAula(t.erros);
        return (
          <div key={t.id} className="topico">
            <div className="topico-cabecalho" onClick={() => setAbertos({ ...abertos, [t.id]: !aberto })}>
              <div>
                <span className="titulo">{t.titulo}</span>{' '}
                <small className="suave">
                  {nomeDe(t.criancaId)} · {t.materia}
                </small>
                {alerta && (
                  <span className="selo selo-alerta" style={{ marginLeft: 6 }}>
                    ⚠ talvez precise de nova aula
                  </span>
                )}
              </div>
              <div className="acoes">
                <Caixa caixa={t.caixa} dominado={t.dominado} />
                <small>
                  {t.dominado ? '—' : t.ultimaRevisao ? `próxima: ${formatarCurta(t.proximaRevisao)}` : `novo · a partir de ${formatarCurta(t.proximaRevisao)}`}
                </small>
                <small className="suave">{aberto ? '▲' : '▼'}</small>
              </div>
            </div>

            {aberto && (
              <div>
                <h3>Histórico de erros</h3>
                {t.erros.length === 0 ? (
                  <p className="suave">Sem erros registrados.</p>
                ) : (
                  <>
                    <p className="suave">Voltou à caixa 1: {vezesQueVoltouParaCaixa1(t.erros)} vez(es).</p>
                    <ul className="historico">
                      {t.erros.map((e) => (
                        <li key={e.id}>
                          <b>{formatarCurta(e.data)}</b> {ICONE_RESULTADO[e.resultado]} {e.marcas?.length > 0 && <span className="selo">{e.marcas.join(' ')}</span>}{' '}
                          {e.texto ? <span className="literal">{e.texto}</span> : <span className="suave">sem anotação</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <h3>Perguntas</h3>
                <ul>
                  {t.perguntas.map((p) => (
                    <li key={p.id}>
                      <small className="selo">{p.tipo}</small> {p.tipo === 'ditado' ? p.palavras.join(', ') : p.enunciado}
                      {p.resposta && <span className="suave"> → {p.resposta}</span>}
                    </li>
                  ))}
                </ul>
                <FormPergunta topicoId={t.id} aoSalvar={recarregar} />

                <h3>Corrigir caixa manualmente</h3>
                <CorrigirCaixa topico={t} aoSalvar={recarregar} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function CorrigirCaixa({ topico, aoSalvar }) {
  const [valor, setValor] = useState(topico.dominado ? 'dominado' : String(topico.caixa));
  return (
    <div className="acoes">
      <select value={valor} onChange={(e) => setValor(e.target.value)}>
        {Array.from({ length: CAIXA_MAX }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Caixa {i + 1}
          </option>
        ))}
        <option value="dominado">Dominado</option>
      </select>
      <button
        className="botao-secundario botao-pequeno"
        onClick={async () => {
          await repositorio.corrigirCaixa(topico.id, valor === 'dominado' ? 'dominado' : Number(valor));
          aoSalvar();
        }}
      >
        Salvar (próxima revisão = hoje + intervalo da caixa)
      </button>
    </div>
  );
}

function camposPergunta(tipo, enunciado, resposta, palavras) {
  return tipo === 'ditado'
    ? { tipo, enunciado: 'Ditado', resposta: '', palavras: palavras.split(',').map((p) => p.trim()).filter(Boolean) }
    : { tipo, enunciado, resposta, palavras: [] };
}

function FormPergunta({ topicoId, aoSalvar }) {
  const [tipo, setTipo] = useState('curta');
  const [enunciado, setEnunciado] = useState('');
  const [resposta, setResposta] = useState('');
  const [palavras, setPalavras] = useState('');
  return (
    <form
      className="acoes"
      onSubmit={async (e) => {
        e.preventDefault();
        await repositorio.adicionarPergunta(topicoId, camposPergunta(tipo, enunciado, resposta, palavras));
        setEnunciado('');
        setResposta('');
        setPalavras('');
        aoSalvar();
      }}
    >
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="curta">curta</option>
        <option value="aberta">aberta</option>
        <option value="ditado">ditado</option>
      </select>
      {tipo === 'ditado' ? (
        <input type="text" placeholder="palavras separadas por vírgula" value={palavras} onChange={(e) => setPalavras(e.target.value)} required />
      ) : (
        <>
          <input type="text" placeholder="Enunciado" value={enunciado} onChange={(e) => setEnunciado(e.target.value)} required />
          <input type="text" placeholder="Resposta (gabarito)" value={resposta} onChange={(e) => setResposta(e.target.value)} />
        </>
      )}
      <button className="botao-secundario botao-pequeno">+ Pergunta</button>
    </form>
  );
}

function FormNovaAula({ criancas, materias, hoje, aoSalvar }) {
  const [f, setF] = useState({ criancaId: criancas[0].id, data: hoje, materia: materias[0] ?? '', titulo: '', conteudo: '', tipo: 'curta', enunciado: '', resposta: '', palavras: '' });
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value });
  return (
    <form
      className="painel"
      onSubmit={async (e) => {
        e.preventDefault();
        await repositorio.registrarAula({
          criancaId: f.criancaId,
          data: f.data,
          materia: f.materia,
          titulo: f.titulo,
          conteudo: f.conteudo,
          pergunta: camposPergunta(f.tipo, f.enunciado, f.resposta, f.palavras),
        });
        aoSalvar();
      }}
    >
      <h3 style={{ marginTop: 0 }}>Diário de aulas — nova aula</h3>
      <p className="suave">O tópico entra na caixa 1 e aparece na próxima folha de Reforço a partir do dia seguinte.</p>
      <div className="acoes">
        <select value={f.criancaId} onChange={set('criancaId')}>
          {criancas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apelido}
            </option>
          ))}
        </select>
        <input type="date" value={f.data} onChange={set('data')} required />
        <input type="text" list="materias" placeholder="Matéria" value={f.materia} onChange={set('materia')} required />
        <datalist id="materias">
          {materias.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <input type="text" placeholder="Título do tópico" value={f.titulo} onChange={set('titulo')} required />
        <input type="text" placeholder="O que foi dado (opcional)" value={f.conteudo} onChange={set('conteudo')} />
      </div>
      <div className="acoes" style={{ marginTop: '0.5rem' }}>
        <span>Primeira pergunta:</span>
        <select value={f.tipo} onChange={set('tipo')}>
          <option value="curta">curta</option>
          <option value="aberta">aberta</option>
          <option value="ditado">ditado</option>
        </select>
        {f.tipo === 'ditado' ? (
          <input type="text" placeholder="palavras separadas por vírgula" value={f.palavras} onChange={set('palavras')} required />
        ) : (
          <>
            <input type="text" placeholder="Enunciado" value={f.enunciado} onChange={set('enunciado')} required />
            <input type="text" placeholder="Resposta" value={f.resposta} onChange={set('resposta')} />
          </>
        )}
        <button className="botao">Salvar aula</button>
      </div>
    </form>
  );
}
