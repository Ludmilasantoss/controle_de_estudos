// Tela 1 — Hoje (adulto): resumo do dia por criança, pendências e atalhos.
import { Link } from 'react-router-dom';
import { repositorio } from '../data/repositorio.js';
import { useCarregar } from '../componentes/useCarregar.js';
import { Carregando, Erro } from '../componentes/comum.jsx';
import { formatarLonga, formatarCurta, somarDias, hojeLocal, diaDaSemana } from '../regras/datas.js';
import { NOME_TIPO_FOLHA } from '../regras/configuracao.js';
import { itemEmBranco } from '../regras/pendencias.js';

async function carregarHoje() {
  const hoje = await repositorio.hoje();
  const criancas = await repositorio.listarCriancas();
  const porCrianca = [];
  for (const crianca of criancas) {
    // O app monta a folha do dia automaticamente.
    await repositorio.gerarFolha(crianca.id, hoje);
    const atual = await repositorio.obterFolha(crianca.id, hoje);
    const amanha = await repositorio.obterFolha(crianca.id, somarDias(hoje, 1));
    porCrianca.push({ crianca, atual, amanha });
  }
  const pendencias = await repositorio.listarPendencias();
  return { hoje, criancas, porCrianca, pendencias };
}

export default function Hoje() {
  const { dados, carregando, erro, recarregar } = useCarregar(carregarHoje, []);
  if (carregando) return <Carregando />;
  if (erro) return <Erro erro={erro} />;

  const { hoje, porCrianca, pendencias, criancas } = dados;
  const nomeDe = (id) => criancas.find((c) => c.id === id)?.apelido ?? id;
  const simulando = hoje !== hojeLocal();

  async function mudarData(nova) {
    await repositorio.definirDataSimulada(nova === hojeLocal() ? null : nova);
    recarregar();
  }

  return (
    <>
      <div className="barra-data">
        <h1 style={{ marginRight: 'auto' }}>Hoje · {formatarLonga(hoje)}</h1>
        <label className="suave">
          Data do app{' '}
          <input type="date" value={hoje} onChange={(e) => e.target.value && mudarData(e.target.value)} />
        </label>
        <button className="botao-secundario botao-pequeno" onClick={() => mudarData(somarDias(hoje, 1))}>
          Avançar 1 dia →
        </button>
        {simulando && (
          <button className="botao-secundario botao-pequeno" onClick={() => mudarData(hojeLocal())}>
            Voltar ao dia real
          </button>
        )}
      </div>
      {simulando && <p className="aviso">Simulando a data {formatarCurta(hoje)} para testar o ciclo. O dia real é {formatarCurta(hojeLocal())}.</p>}

      <h2>Pendências de dias anteriores</h2>
      {pendencias.length === 0 ? (
        <p className="suave">Nenhuma pendência. 🎉</p>
      ) : (
        <div className="painel">
          <p className="suave" style={{ marginTop: 0 }}>
            Nada mudou de caixa nesses itens. Registre agora ou deixe como está (eles continuam aparecendo nas próximas folhas enquanto estiverem vencidos).
          </p>
          <ul className="lista-pendencias">
            {pendencias.map((p) => (
              <li key={p.folha.id}>
                <strong>
                  {nomeDe(p.folha.criancaId)} · {formatarLonga(p.folha.data)}
                </strong>{' '}
                — {p.motivo === 'sem_registro' ? 'dia sem registro' : 'itens de estudo em branco'} ({p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'})
                <div className="acoes" style={{ marginTop: '0.25rem' }}>
                  <Link className="botao botao-pequeno" to={`/registro/${p.folha.criancaId}/${p.folha.data}`}>
                    Registrar agora
                  </Link>
                  <button
                    className="botao-secundario botao-pequeno"
                    onClick={async () => {
                      await repositorio.atualizarFolha(p.folha.id, { dispensada: true });
                      recarregar();
                    }}
                  >
                    Deixar como está
                  </button>
                  <small className="suave">{p.itens.slice(0, 4).map((i) => i.titulo).join(' · ')}{p.itens.length > 4 ? ' …' : ''}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2>Folhas do dia</h2>
      <div className="grade-2">
        {porCrianca.map(({ crianca, atual, amanha }) => (
          <CartaoCrianca key={crianca.id} crianca={crianca} hoje={hoje} atual={atual} amanha={amanha} />
        ))}
      </div>

      <p className="suave" style={{ marginTop: '2rem' }}>
        Ciclo: <b>1.</b> o app monta a folha · <b>2.</b> você imprime · <b>3.</b> registra pelo celular (QR code da folha) ·{' '}
        <b>4.</b> o motor de caixas atualiza as datas · <b>5.</b> a folha seguinte já sai certa.
      </p>
    </>
  );
}

function CartaoCrianca({ crianca, hoje, atual, amanha }) {
  const { folha, itens } = atual;
  const estudo = itens.filter((i) => i.topicoId);
  const tarefas = itens.filter((i) => !i.topicoId);
  const preenchidos = itens.filter((i) => !itemEmBranco(i)).length;
  const dataAmanha = somarDias(hoje, 1);
  const bloco = crianca.blocoRevisoes;
  const contagem = (motivo) => estudo.filter((i) => i.motivo === motivo).length;

  let situacao = 'Gerada — ainda não impressa';
  if (folha.registradaEm) situacao = '✅ Registrada';
  else if (folha.impressaEm) situacao = '🖨️ Impressa — aguardando registro';

  return (
    <div className="painel cartao-crianca">
      <h2>
        {crianca.apelido} <small className="suave">({crianca.idade} anos)</small>
      </h2>
      <div>
        <b>{NOME_TIPO_FOLHA[folha.tipoFolha]}</b> · {situacao}
        {folha.blocoAutonomo && <span className="selo" style={{ marginLeft: 6 }}>bloco autônomo</span>}
      </div>
      {bloco && bloco.dias.includes(diaDaSemana(hoje)) && (
        <div className="suave">
          {bloco.titulo} ({bloco.horario})
        </div>
      )}
      <div className="numeros">
        <div>
          <strong>{estudo.length}</strong>estudo
        </div>
        <div>
          <strong>{contagem('erro')}</strong>❌ da última
        </div>
        <div>
          <strong>{contagem('atrasado')}</strong>atrasados
        </div>
        <div>
          <strong>{tarefas.length}</strong>tarefas
        </div>
        <div>
          <strong>
            {preenchidos}/{itens.length}
          </strong>
          registrados
        </div>
      </div>
      {folha.excedentes?.length > 0 && <p className="suave">{folha.excedentes.length} revisão(ões) ficaram para a próxima folha pelo limite do bloco.</p>}
      <div className="acoes">
        <Link className="botao" to={`/registro/${crianca.id}/${hoje}`}>
          Registrar
        </Link>
        <Link className="botao-secundario" to={`/folha/${crianca.id}/${hoje}`}>
          🖨️ Folha
        </Link>
        <Link className="botao-secundario" to={`/folha/${crianca.id}/${hoje}?versao=gabarito`}>
          Gabarito
        </Link>
      </div>
      <p style={{ marginBottom: 0 }}>
        <Link to={`/folha/${crianca.id}/${dataAmanha}`}>
          Folha de amanhã ({formatarCurta(dataAmanha)}){amanha ? (amanha.folha.desatualizada ? ' — desatualizada' : ' — já gerada') : ''} →
        </Link>
      </p>
    </div>
  );
}
