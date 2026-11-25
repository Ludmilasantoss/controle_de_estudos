// Como um item muda na tela de Registro rápido. Funções puras (estilo reducer).
//
// Itens de estudo têm `resultado` (acertou/parcial/errou) e podem ter marcas `*` e `?`.
// Tarefas (casa, animais, apps...) têm `status`.
//
// Regra das marcas: `*` (olhou o livro) ou `?` (não tem certeza) com resposta certa
// SUGEREM 🟡. O adulto sempre decide: tocar ✅ de novo mantém ✅.
import { RESULTADO } from './caixas.js';

export const MARCAS = ['*', '?'];

export const STATUS = Object.freeze({
  FEITO: 'feito', // ✓
  NAO_FEITO: 'nao_feito', // ✗ ou sem marca
  NAO_SE_APLICA: 'nao_se_aplica', // ● ou riscado
});

export const ICONE_STATUS = { feito: '✓', nao_feito: '✗', nao_se_aplica: '●' };
export const NOME_STATUS = { feito: 'Feito', nao_feito: 'Não feito', nao_se_aplica: 'Não se aplica' };

export function temMarcaDeDuvida(marcas = []) {
  return marcas.some((m) => MARCAS.includes(m));
}

/**
 * @param {object} item  { resultado, marcas, sugerido, status, observacao, caixaManual }
 * @param {object} acao  { tipo: 'resultado'|'marca'|'status'|'observacao'|'caixaManual'|'limpar', valor }
 */
export function atualizarItem(item, acao) {
  const marcas = item.marcas ?? [];

  switch (acao.tipo) {
    case 'resultado': {
      const r = acao.valor;
      if (r === RESULTADO.ACERTOU) {
        // 1º toque em ✅ com marca → sugere 🟡. Se a sugestão já está na tela, o toque confirma ✅.
        if (temMarcaDeDuvida(marcas) && !item.sugerido && item.resultado !== RESULTADO.ACERTOU) {
          return { ...item, resultado: RESULTADO.PARCIAL, sugerido: true };
        }
        return { ...item, resultado: RESULTADO.ACERTOU, sugerido: false };
      }
      return { ...item, resultado: r, sugerido: false };
    }

    case 'marca': {
      const m = acao.valor;
      const novas = marcas.includes(m) ? marcas.filter((x) => x !== m) : [...marcas, m];
      let { resultado, sugerido } = item;
      if (resultado === RESULTADO.ACERTOU && temMarcaDeDuvida(novas)) {
        resultado = RESULTADO.PARCIAL;
        sugerido = true;
      } else if (resultado === RESULTADO.PARCIAL && sugerido && !temMarcaDeDuvida(novas)) {
        // A sugestão só existia por causa da marca: tirou a marca, volta para ✅.
        resultado = RESULTADO.ACERTOU;
        sugerido = false;
      }
      return { ...item, marcas: novas, resultado, sugerido };
    }

    case 'status':
      return { ...item, status: item.status === acao.valor ? null : acao.valor };

    case 'observacao':
      return { ...item, observacao: acao.valor };

    case 'caixaManual':
      return { ...item, caixaManual: acao.valor ? Number(acao.valor) : null };

    case 'limpar':
      return { ...item, resultado: null, status: null, marcas: [], sugerido: false, observacao: '', caixaManual: null };

    default:
      return item;
  }
}

/** Texto curto que a tela mostra quando o 🟡 foi sugerido pelo app. */
export function textoSugestao(item) {
  if (!item.sugerido) return '';
  return `🟡 sugerido por ${(item.marcas ?? []).join(' ')} — toque ✅ de novo para manter ✅`;
}
