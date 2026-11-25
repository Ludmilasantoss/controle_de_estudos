// Regras sobre o histórico de erros de um tópico.
import { RESULTADO } from './caixas.js';

export const LIMITE_AVISO_NOVA_AULA = 3;

/** Quantas vezes o tópico voltou à caixa 1 (= quantos ❌ no histórico). */
export function vezesQueVoltouParaCaixa1(errosDoTopico) {
  return errosDoTopico.filter((e) => e.resultado === RESULTADO.ERROU).length;
}

/** Aviso "talvez precise de nova aula": voltou à caixa 1 três vezes ou mais. */
export function precisaNovaAula(errosDoTopico) {
  return vezesQueVoltouParaCaixa1(errosDoTopico) >= LIMITE_AVISO_NOVA_AULA;
}

/** Histórico em ordem cronológica (mais recente por último). */
export function ordenarHistorico(erros) {
  return [...erros].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}
