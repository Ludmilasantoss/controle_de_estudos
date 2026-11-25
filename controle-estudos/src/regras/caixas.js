// Motor de caixas (revisão espaçada). Regras do método — não alterar.
import { somarDias } from './datas.js';

/** Caixa → dias até a próxima revisão. */
export const INTERVALOS = Object.freeze({ 1: 1, 2: 3, 3: 7, 4: 30, 5: 90, 6: 180, 7: 360 });

export const CAIXA_MIN = 1;
export const CAIXA_MAX = 7;

export const RESULTADO = Object.freeze({
  ACERTOU: 'acertou', // ✅
  PARCIAL: 'parcial', // 🟡
  ERROU: 'errou', // ❌
  PENDENTE: 'pendente', // sem registro
});

export const ICONE_RESULTADO = {
  acertou: '✅',
  parcial: '🟡',
  errou: '❌',
  pendente: '⏳',
};

/**
 * Aplica o resultado de uma revisão a um tópico.
 * Não altera o objeto recebido: devolve só os campos novos.
 *
 * @param {{caixa:number, dominado?:boolean, proximaRevisao?:string}} topico
 * @param {'acertou'|'parcial'|'errou'|'pendente'} resultado
 * @param {string} dataRevisao  data da folha em que o item foi feito ('AAAA-MM-DD')
 * @returns {{caixa:number, dominado:boolean, proximaRevisao:string|null, ultimaRevisao:string|null, ultimoResultado:string|null}}
 */
export function aplicarResultado(topico, resultado, dataRevisao) {
  const atual = {
    caixa: topico.caixa,
    dominado: Boolean(topico.dominado),
    proximaRevisao: topico.proximaRevisao ?? null,
    ultimaRevisao: topico.ultimaRevisao ?? null,
    ultimoResultado: topico.ultimoResultado ?? null,
  };

  switch (resultado) {
    case RESULTADO.ACERTOU: {
      if (topico.caixa >= CAIXA_MAX) {
        return { caixa: CAIXA_MAX, dominado: true, proximaRevisao: null, ultimaRevisao: dataRevisao, ultimoResultado: resultado };
      }
      const nova = topico.caixa + 1;
      return { caixa: nova, dominado: false, proximaRevisao: somarDias(dataRevisao, INTERVALOS[nova]), ultimaRevisao: dataRevisao, ultimoResultado: resultado };
    }
    case RESULTADO.PARCIAL:
      return { caixa: topico.caixa, dominado: false, proximaRevisao: somarDias(dataRevisao, INTERVALOS[topico.caixa]), ultimaRevisao: dataRevisao, ultimoResultado: resultado };
    case RESULTADO.ERROU:
      return { caixa: 1, dominado: false, proximaRevisao: somarDias(dataRevisao, INTERVALOS[1]), ultimaRevisao: dataRevisao, ultimoResultado: resultado };
    case RESULTADO.PENDENTE:
    default:
      // Sem registro: nada muda.
      return atual;
  }
}

/**
 * Correção manual da caixa pelo adulto.
 * Suposição: a próxima revisão passa a ser a data base + intervalo da caixa escolhida.
 */
export function definirCaixaManual(novaCaixa, dataBase) {
  const caixa = Math.min(CAIXA_MAX, Math.max(CAIXA_MIN, Number(novaCaixa)));
  return { caixa, dominado: false, proximaRevisao: somarDias(dataBase, INTERVALOS[caixa]) };
}
