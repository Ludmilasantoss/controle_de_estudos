// Pequenos componentes compartilhados entre as telas.
import { EMOJI_TIPO, NOME_PERIODO } from '../regras/configuracao.js';

export const EMOJI_MATERIA = {
  'Matemática': '🔢',
  'Português': '📝',
  'Ciências': '🔬',
  'História': '🏛️',
  'Geografia': '🌎',
  'Inglês': '💬',
};

export function emojiDoItem(item) {
  if (item.emoji) return item.emoji;
  if (item.topicoId) return EMOJI_MATERIA[item.materia] ?? '📚';
  return EMOJI_TIPO[item.tipo] ?? '•';
}

export function Carregando() {
  return <p className="suave">Carregando…</p>;
}

export function Erro({ erro }) {
  return <p className="aviso aviso-erro">Erro: {String(erro?.message ?? erro)}</p>;
}

export function Caixa({ caixa, dominado }) {
  if (dominado) return <span className="selo selo-dominado">Dominado</span>;
  return <span className={`selo selo-caixa c${caixa}`}>Caixa {caixa}</span>;
}

/** Agrupa itens consecutivos por uma chave, mantendo a ordem. */
export function agruparEmSequencia(itens, chave) {
  const grupos = [];
  for (const item of itens) {
    const k = chave(item);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.chave === k) ultimo.itens.push(item);
    else grupos.push({ chave: k, itens: [item] });
  }
  return grupos;
}

export function nomePeriodo(periodo) {
  return NOME_PERIODO[periodo ?? 'sem_horario'];
}
