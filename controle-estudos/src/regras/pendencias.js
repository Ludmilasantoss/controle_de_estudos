// Pendências: folhas de dias anteriores sem registro (ou com itens de estudo em branco).
// Nenhum tópico muda de caixa por causa de uma pendência: só listamos para o adulto decidir.
import { RESULTADO } from './caixas.js';

export function ehItemDeEstudo(item) {
  return Boolean(item.topicoId);
}

export function itemEmBranco(item) {
  if (ehItemDeEstudo(item)) return !item.resultado || item.resultado === RESULTADO.PENDENTE;
  return !item.status;
}

/**
 * @param {object} p
 * @param {Array} p.folhas   [{id, criancaId, data, registradaEm}]
 * @param {Array} p.tarefas  [{folhaId, topicoId?, resultado?, status?, ...}]
 * @param {string} p.hoje
 * @returns {Array<{folha, motivo:'sem_registro'|'itens_em_branco', itens:Array}>}
 */
export function listarPendencias({ folhas, tarefas, hoje }) {
  const porFolha = {};
  for (const t of tarefas) (porFolha[t.folhaId] ??= []).push(t);

  const pendencias = [];
  for (const folha of folhas) {
    if (folha.data >= hoje) continue;
    if (folha.dispensada) continue; // o adulto decidiu deixar como está
    const itens = (porFolha[folha.id] ?? []).sort((a, b) => a.ordem - b.ordem);

    if (!folha.registradaEm) {
      pendencias.push({ folha, motivo: 'sem_registro', itens: itens.filter(itemEmBranco) });
      continue;
    }
    // Folha registrada: tarefas sem marca já contam como "não feito";
    // só itens de estudo em branco continuam pendentes.
    const emBranco = itens.filter((i) => ehItemDeEstudo(i) && itemEmBranco(i));
    if (emBranco.length) pendencias.push({ folha, motivo: 'itens_em_branco', itens: emBranco });
  }
  return pendencias.sort((a, b) => (a.folha.data < b.folha.data ? -1 : 1));
}
