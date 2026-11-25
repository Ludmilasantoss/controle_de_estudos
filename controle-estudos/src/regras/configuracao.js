// Constantes do método e valores configuráveis (com os padrões do protótipo).

export const TIPO_FOLHA = Object.freeze({
  REFORCO: 'reforco',
  REVISAO: 'revisao',
  QUIZ: 'quiz',
  SEM_ESTUDO: 'sem_estudo',
});

export const NOME_TIPO_FOLHA = {
  reforco: 'Reforço',
  revisao: 'Revisão',
  quiz: 'Quiz da semana',
  sem_estudo: 'Sem folha de estudo',
};

/** Agenda padrão (índice = dia da semana, 0 = domingo). Editável na tela de Agenda. */
export const AGENDA_PADRAO = [
  TIPO_FOLHA.REVISAO, // Dom
  TIPO_FOLHA.REFORCO, // Seg
  TIPO_FOLHA.REVISAO, // Ter
  TIPO_FOLHA.REFORCO, // Qua
  TIPO_FOLHA.REVISAO, // Qui
  TIPO_FOLHA.QUIZ, // Sex
  TIPO_FOLHA.SEM_ESTUDO, // Sáb
];

export const TIPOS_TAREFA = ['Nova', 'Revisão', 'Leitura', 'Escrita', 'Instrumento', 'Casa', 'Animais', 'App'];

/** Tipos que vão para a página separada (casa, animais e apps). */
export const TIPOS_ROTINA_CASA = ['Casa', 'Animais', 'App'];

export const PERIODOS = ['manha', 'tarde', 'noite'];
export const NOME_PERIODO = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', sem_horario: 'Sem horário' };

export const EMOJI_TIPO = {
  Nova: '🌱',
  'Revisão': '🔁',
  Leitura: '📖',
  Escrita: '✏️',
  Instrumento: '🎵',
  Casa: '🏠',
  Animais: '🐾',
  App: '📱',
};

export const CONFIG_PADRAO = Object.freeze({
  // Limite de itens de REVISÃO por bloco. Suposição: bloco = uma matéria da folha.
  limitePorBloco: 6,
  limitePorBlocoSexta: 10,
  limitePorBlocoDomingo: 10,
  // Quiz de sexta: tópicos com 🟡/❌ nos últimos N dias.
  janelaQuizDias: 7,
  // Itens de estudo contam para a recompensa (suposição: contam como "feito" quando têm resultado).
  estudoContaRecompensa: true,
  recompensa: {
    teto: 20,
    // SUPOSIÇÃO — a fórmula real ainda não foi definida.
    // 'proporcional': teto × feitas ÷ tarefas que contam
    // 'por_tarefa':   valorPorTarefa × feitas, limitado ao teto
    formula: 'proporcional',
    valorPorTarefa: 1,
  },
});

export function comPadroes(config = {}) {
  return {
    ...CONFIG_PADRAO,
    ...config,
    recompensa: { ...CONFIG_PADRAO.recompensa, ...(config.recompensa ?? {}) },
  };
}
