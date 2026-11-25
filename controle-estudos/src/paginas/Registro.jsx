// Tela 3 — Registro rápido (feita para celular).
// Lista na mesma ordem da folha; um toque por item. Meta: folha inteira em menos de 1 minuto.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro, Caixa, agruparEmSequencia, nomePeriodo } from '../componentes/comum.jsx';
import { atualizarItem, textoSugestao, MARCAS, STATUS, ICONE_STATUS, NOME_STATUS } from '../regras/registroItem.js';
import { ICONE_RESULTADO, CAIXA_MAX } from '../regras/caixas.js';
import { NOME_MOTIVO } from '../regras/montarFolha.js';
import { NOME_TIPO_FOLHA } from '../regras/configuracao.js';
import { formatarLonga, formatarCurta, somarDias } from '../regras/datas.js';
import { itemEmBranco } from '../regras/pendencias.js';

const BOTOES_RESULTADO = ['acertou', 'parcial', 'errou'];
const BOTOES_STATUS = [STATUS.FEITO, STATUS.NAO_FEITO, STATUS.NAO_SE_APLICA];

export default function Registro() {
  const { criancaId, data } = useParams();
  const { dados, carregando, erro, recarregar } = useCarregar(() => repositorio.obterFolha(criancaId, data), [criancaId, data]);
  const [itens, setItens] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (dados) setItens(dados.itens);
  }, [dados]);

  if (carregando) return <Carregando />;
  if (erro) return <Erro erro={erro} />;
  if (!dados) {
    return (
      <div className="registro">
        <p>A folha de {formatarCurta(data)} ainda não foi gerada.</p>
        <button
          className="botao"
          onClick={async () => {
            await repositorio.gerarFolha(criancaId, data);
            recarregar();
          }}
        >
          Gerar folha agora
        </button>
      </div>
    );
  }

  const { folha, crianca } = dados;
  const preenchidos = itens.filter((i) => !itemEmBranco(i)).length;

  const despachar = (id, acao) => setItens((lista) => lista.map((i) => (i.id === id ? atualizarItem(i, acao) : i)));

  const marcarTodasFeitas = (secao) =>
    setItens((lista) => lista.map((i) => (!i.topicoId && i.secao === secao && !i.status ? { ...i, status: STATUS.FEITO } : i)));

  async function salvar(concluir) {
    setSalvando(true);
    try {
      const r = await repositorio.salvarRegistro(folha.id, itens, { concluir });
      setResumo({ ...r, concluir });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      recarregar();
    } finally {
      setSalvando(false);
    }
  }

  const grupos = agruparEmSequencia(itens, (i) => (i.topicoId ? `estudo:${i.materia}` : `${i.secao}:${i.periodo ?? 'sem_horario'}`));

  return (
    <div className="registro">
      <div className="registro-cabecalho">
        <h1>
          {crianca.apelido} · {formatarLonga(data)}
        </h1>
        <p className="suave">
          {NOME_TIPO_FOLHA[folha.tipoFolha]}
          {folha.blocoAutonomo && ' · bloco autônomo'}
          {' · '}
          <Link to={`/folha/${criancaId}/${data}`}>ver folha</Link>
        </p>
        {folha.registradaEm && !resumo && (
          <p className="aviso">Esta folha já foi registrada. Você pode corrigir e salvar de novo: o app desfaz o registro anterior.</p>
        )}
      </div>

      {resumo && <ResumoRegistro resumo={resumo} criancaId={criancaId} data={data} />}

      {grupos.map((g) => (
        <section key={g.chave + g.itens[0].id} className="registro-grupo">
          <h2>
            {g.itens[0].topicoId ? g.itens[0].materia : g.itens[0].secao === 'casa' ? `Casa, animais e apps · ${nomePeriodo(g.itens[0].periodo)}` : `Rotina · ${nomePeriodo(g.itens[0].periodo)}`}
            {!g.itens[0].topicoId && (
              <button className="botao-link" onClick={() => marcarTodasFeitas(g.itens[0].secao)}>
                tudo ✓
              </button>
            )}
          </h2>
          {g.itens.map((item) => (
            <ItemRegistro key={item.id} item={item} usaMarcas={crianca.usaMarcas} despachar={(acao) => despachar(item.id, acao)} />
          ))}
        </section>
      ))}

      <div className="barra-salvar">
        <span>
          {preenchidos}/{itens.length}
        </span>
        <button className="botao botao-secundario" disabled={salvando} onClick={() => salvar(false)}>
          Salvar rascunho
        </button>
        <button className="botao" disabled={salvando} onClick={() => salvar(true)}>
          Concluir registro
        </button>
      </div>
    </div>
  );
}

function ItemRegistro({ item, usaMarcas, despachar }) {
  const [aberto, setAberto] = useState(Boolean(item.observacao || item.caixaManual));
  const estudo = Boolean(item.topicoId);
  const marcado = estudo ? item.resultado : item.status;

  return (
    <div className={`item-registro ${marcado ? 'preenchido' : ''}`}>
      <div className="item-linha-titulo">
        <span className="item-numero">{item.ordem}</span>
        <div className="item-texto">
          <strong>{estudo ? item.enunciado : item.titulo}</strong>
          {estudo && (
            <small className="suave">
              {item.titulo} · <Caixa caixa={item.caixaNaFolha} /> · {NOME_MOTIVO[item.motivo]}
            </small>
          )}
        </div>
      </div>

      <div className="item-botoes">
        {estudo
          ? BOTOES_RESULTADO.map((r) => (
              <button key={r} className={`toque ${item.resultado === r ? 'ativo ' + r : ''}`} onClick={() => despachar({ tipo: 'resultado', valor: r })} aria-label={r}>
                {ICONE_RESULTADO[r]}
              </button>
            ))
          : BOTOES_STATUS.map((s) => (
              <button key={s} className={`toque ${item.status === s ? 'ativo ' + s : ''}`} onClick={() => despachar({ tipo: 'status', valor: s })} title={NOME_STATUS[s]}>
                {ICONE_STATUS[s]}
              </button>
            ))}
        {estudo &&
          usaMarcas &&
          MARCAS.map((m) => (
            <button key={m} className={`toque toque-marca ${item.marcas?.includes(m) ? 'ativo marca' : ''}`} onClick={() => despachar({ tipo: 'marca', valor: m })}>
              {m}
            </button>
          ))}
        <button className={`toque toque-mais ${aberto ? 'ativo' : ''}`} onClick={() => setAberto(!aberto)} aria-label="observação">
          ✎
        </button>
      </div>

      {item.sugerido && <p className="sugestao">{textoSugestao(item)}</p>}

      {aberto && (
        <div className="item-extra">
          <input
            type="text"
            placeholder={estudo ? 'Observação / erro literal (vai para o histórico)' : 'Observação'}
            value={item.observacao ?? ''}
            onChange={(e) => despachar({ tipo: 'observacao', valor: e.target.value })}
          />
          {estudo && (
            <label>
              Corrigir caixa:{' '}
              <select value={item.caixaManual ?? ''} onChange={(e) => despachar({ tipo: 'caixaManual', valor: e.target.value })}>
                <option value="">automático</option>
                {Array.from({ length: CAIXA_MAX }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    Caixa {c}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function ResumoRegistro({ resumo, criancaId, data }) {
  const amanha = somarDias(data, 1);
  return (
    <div className="painel painel-sucesso">
      <strong>{resumo.concluir ? 'Registro concluído.' : 'Rascunho salvo.'}</strong>
      {resumo.mudancas.length > 0 && (
        <ul className="lista-mudancas">
          {resumo.mudancas.map((m) => (
            <li key={m.topicoId}>
              {ICONE_RESULTADO[m.resultado]} {m.titulo}: caixa {m.antes.caixa} → {m.depois.dominado ? 'Dominado' : `caixa ${m.depois.caixa}`}
              {m.depois.proximaRevisao && <> · volta em {formatarCurta(m.depois.proximaRevisao)}</>}
            </li>
          ))}
        </ul>
      )}
      {resumo.regeneradas.length > 0 && <p>Folhas futuras atualizadas: {resumo.regeneradas.map(formatarCurta).join(', ')}.</p>}
      <p>
        <Link to="/">Voltar para Hoje</Link> · <Link to={`/folha/${criancaId}/${amanha}`}>Folha de {formatarCurta(amanha)}</Link>
      </p>
    </div>
  );
}
