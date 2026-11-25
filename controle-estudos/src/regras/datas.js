// Datas são sempre strings 'AAAA-MM-DD' (dia local, sem hora e sem fuso).
// Internamente usamos UTC só para fazer contas, o que evita erros de horário de verão.

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const NOMES_DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DOMINGO = 0;
export const SEXTA = 5;
export const SABADO = 6;

function paraUTC(data) {
  const [a, m, d] = data.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
}

function deUTC(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Soma (ou subtrai, com n negativo) dias inteiros a uma data. */
export function somarDias(data, n) {
  return deUTC(paraUTC(data) + n * UM_DIA_MS);
}

/** 0 = domingo ... 6 = sábado */
export function diaDaSemana(data) {
  return new Date(paraUTC(data)).getUTCDay();
}

/** Quantos dias de `a` até `b` (positivo se b é depois de a). */
export function diferencaEmDias(a, b) {
  return Math.round((paraUTC(b) - paraUTC(a)) / UM_DIA_MS);
}

/** Segunda-feira da semana da data (semana de segunda a domingo). */
export function inicioDaSemana(data) {
  const dia = diaDaSemana(data);
  const voltar = dia === DOMINGO ? 6 : dia - 1;
  return somarDias(data, -voltar);
}

export function fimDaSemana(data) {
  return somarDias(inicioDaSemana(data), 6);
}

/** Data de hoje no fuso do aparelho. Única função não pura deste arquivo. */
export function hojeLocal() {
  const agora = new Date();
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** '2026-11-10' → '10/11' */
export function formatarCurta(data) {
  if (!data) return '—';
  const [, m, d] = data.split('-');
  return `${d}/${m}`;
}

/** '2026-11-10' → 'Terça, 10/11/2026' */
export function formatarLonga(data) {
  const [a, m, d] = data.split('-');
  return `${NOMES_DIAS[diaDaSemana(data)]}, ${d}/${m}/${a}`;
}
