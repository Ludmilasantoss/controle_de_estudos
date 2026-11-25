// Tela 2 — Folha para imprimir (versão da criança ou gabarito), pronta para window.print().
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro } from '../componentes/comum.jsx';
import FolhaRafael from '../componentes/folhas/FolhaRafael.jsx';
import FolhaMF from '../componentes/folhas/FolhaMF.jsx';
import Gabarito from '../componentes/folhas/Gabarito.jsx';
import { formatarCurta, somarDias } from '../regras/datas.js';

export default function Folha() {
  const { criancaId, data } = useParams();
  const [busca, setBusca] = useSearchParams();
  const versao = busca.get('versao') === 'gabarito' ? 'gabarito' : 'crianca';
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    // O app monta a folha do dia se ela ainda não existir (só de hoje em diante,
    // para não criar folhas antigas que virariam pendências).
    let r = await repositorio.obterFolha(criancaId, data);
    if (!r && data < (await repositorio.hoje())) return { vazia: true };
    if (!r) {
      await repositorio.gerarFolha(criancaId, data);
      r = await repositorio.obterFolha(criancaId, data);
    }
    return r;
  }, [criancaId, data]);
  const [elogio, setElogio] = useState('');

  useEffect(() => {
    if (dados?.folha) setElogio(dados.folha.elogio ?? '');
  }, [dados]);

  if (carregando) return <Carregando />;
  if (erro) return <Erro erro={erro} />;

  if (dados.vazia) {
    return (
      <div className="painel">
        <p>Não houve folha em {formatarCurta(data)}.</p>
        <Link to={`/folha/${criancaId}/${somarDias(data, 1)}`}>Ver {formatarCurta(somarDias(data, 1))} →</Link>
      </div>
    );
  }

  const { folha, crianca } = dados;

  async function imprimir() {
    await repositorio.atualizarFolha(folha.id, { impressaEm: new Date().toISOString() });
    window.print();
    recarregar();
  }

  async function regenerar() {
    await repositorio.gerarFolha(criancaId, data, { regenerar: true });
    recarregar();
  }

  const FolhaDaCrianca = crianca.layout === 'mf' ? FolhaMF : FolhaRafael;

  return (
    <>
      <div className="ferramentas-folha nao-imprimir painel">
        <div className="acoes">
          <Link to={`/folha/${criancaId}/${somarDias(data, -1)}${versao === 'gabarito' ? '?versao=gabarito' : ''}`}>← {formatarCurta(somarDias(data, -1))}</Link>
          <strong>
            {crianca.apelido} · {formatarCurta(data)}
          </strong>
          <Link to={`/folha/${criancaId}/${somarDias(data, 1)}${versao === 'gabarito' ? '?versao=gabarito' : ''}`}>{formatarCurta(somarDias(data, 1))} →</Link>
          <span style={{ flex: 1 }} />
          <button className={versao === 'crianca' ? 'botao botao-pequeno' : 'botao-secundario botao-pequeno'} onClick={() => setBusca({})}>
            Folha da criança
          </button>
          <button className={versao === 'gabarito' ? 'botao botao-pequeno' : 'botao-secundario botao-pequeno'} onClick={() => setBusca({ versao: 'gabarito' })}>
            Gabarito
          </button>
          <button className="botao botao-pequeno" onClick={imprimir}>
            🖨️ Imprimir
          </button>
        </div>

        {folha.desatualizada && (
          <p className="aviso">Esta folha foi impressa antes do último registro. Regenere se quiser a versão atualizada.</p>
        )}
        {folha.registradaEm && <p className="suave">Folha registrada — não pode mais ser regenerada.</p>}

        <div className="acoes" style={{ marginTop: '0.5rem' }}>
          <label style={{ flex: 1, minWidth: 260 }}>
            Elogio concreto de ontem (vai impresso; deixe vazio para escrever à mão):
            <textarea value={elogio} onChange={(e) => setElogio(e.target.value)} onBlur={() => repositorio.atualizarFolha(folha.id, { elogio })} />
          </label>
        </div>
        <div className="acoes">
          <label>
            <input
              type="checkbox"
              checked={Boolean(folha.blocoAutonomo)}
              onChange={async (e) => {
                await repositorio.atualizarFolha(folha.id, { blocoAutonomo: e.target.checked });
                recarregar();
              }}
            />{' '}
            Bloco autônomo (adulto ausente)
          </label>
          {!folha.registradaEm && (
            <button className="botao-secundario botao-pequeno" onClick={regenerar}>
              Regenerar folha
            </button>
          )}
          <Link className="botao-secundario botao-pequeno" to={`/registro/${criancaId}/${data}`}>
            Registrar resultados
          </Link>
          {folha.impressaEm && <span className="suave">Impressa em {new Date(folha.impressaEm).toLocaleString('pt-BR')}</span>}
        </div>
      </div>

      {versao === 'gabarito' ? <Gabarito {...dados} /> : <FolhaDaCrianca {...dados} />}
    </>
  );
}
