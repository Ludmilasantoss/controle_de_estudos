// Recompensa por esforço. Teto semanal por criança.
// ATENÇÃO: a fórmula é uma SUPOSIÇÃO configurável (ver CONFIG_PADRAO.recompensa e o README).
import { comPadroes } from './configuracao.js';
import { STATUS } from './registroItem.js';
import { RESULTADO } from './caixas.js';

const RESULTADOS_FEITOS = [RESULTADO.ACERTOU, RESULTADO.PARCIAL, RESULTADO.ERROU];

/** Decide se uma tarefa conta e se foi feita, com o motivo para mostrar na tela. */
export function classificarTarefa(t) {
  if (!t.contaRecompensa) return { conta: false, feita: false, motivo: 'Não marcada para recompensa' };
  if (t.status === STATUS.NAO_SE_APLICA) return { conta: false, feita: false, motivo: 'Não se aplica' };

  if (t.topicoId) {
    // Esforço, não acerto: qualquer resultado registrado conta como feito.
    const feita = RESULTADOS_FEITOS.includes(t.resultado);
    return { conta: true, feita, motivo: feita ? 'Feito (estudo registrado)' : 'Sem registro' };
  }
  const feita = t.status === STATUS.FEITO;
  return { conta: true, feita, motivo: feita ? 'Feito' : 'Não feito' };
}

/**
 * @param {object} p
 * @param {Array}  p.tarefas  tarefas da criança na semana
 * @param {object} [p.config]
 */
export function calcularRecompensa({ tarefas, config }) {
  const { recompensa } = comPadroes(config);
  const itens = tarefas.map((tarefa) => ({ tarefa, ...classificarTarefa(tarefa) }));
  const contaveis = itens.filter((i) => i.conta).length;
  const feitas = itens.filter((i) => i.conta && i.feita).length;

  let valor = 0;
  if (recompensa.formula === 'por_tarefa') {
    valor = Math.min(recompensa.teto, feitas * recompensa.valorPorTarefa);
  } else {
    valor = contaveis ? (recompensa.teto * feitas) / contaveis : 0;
  }
  valor = Math.round(valor * 100) / 100;

  return { valor, teto: recompensa.teto, formula: recompensa.formula, feitas, contaveis, itens, suposicao: true };
}

export function formatarReais(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
