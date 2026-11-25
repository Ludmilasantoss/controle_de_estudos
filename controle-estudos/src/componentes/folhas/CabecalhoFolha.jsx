import QrRegistro from '../QrRegistro.jsx';
import { formatarLonga } from '../../regras/datas.js';
import { NOME_TIPO_FOLHA } from '../../regras/configuracao.js';

/** Topo comum às três versões: faixa amarela, identificação, QR code e elogio. */
export default function CabecalhoFolha({ folha, crianca, titulo, mostrarElogio = true }) {
  return (
    <header className="folha-cabecalho">
      <div className="faixa-leia">LEIA TUDO — a lista muda todo dia</div>
      <div className="folha-identificacao">
        <div>
          <div className="folha-nome">{titulo ?? crianca.apelido}</div>
          <div className="folha-data">{formatarLonga(folha.data)}</div>
          <div className="folha-tipo">{NOME_TIPO_FOLHA[folha.tipoFolha]}</div>
          {folha.blocoAutonomo && <div className="folha-autonomo">Bloco autônomo: faça sozinho(a) e deixe a folha na mesa.</div>}
        </div>
        <QrRegistro criancaId={crianca.id} data={folha.data} />
      </div>
      {mostrarElogio && (
        <div className="folha-elogio">
          <span className="rotulo">⭐ Elogio de ontem:</span>
          {folha.elogio ? <span className="texto-elogio">{folha.elogio}</span> : <span className="linha-escrever" />}
        </div>
      )}
    </header>
  );
}
