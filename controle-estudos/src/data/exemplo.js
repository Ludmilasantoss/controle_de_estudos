// Dados de exemplo FICTÍCIOS. As datas são relativas ao dia em que os dados são carregados,
// para a demonstração sempre ter itens vencendo "hoje", atrasados e futuros.
import { somarDias, diaDaSemana, SABADO } from '../regras/datas.js';
import { AGENDA_PADRAO, CONFIG_PADRAO } from '../regras/configuracao.js';

const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];
const SEG_A_SEX = [1, 2, 3, 4, 5];
const SEX_A_SEG = [5, 6, 0, 1];
const MENOS_SABADO = [0, 1, 2, 3, 4, 5];

function proximoSabado(hoje) {
  const faltam = (SABADO - diaDaSemana(hoje) + 7) % 7 || 7;
  return somarDias(hoje, faltam);
}

export function criarDadosExemplo(hoje) {
  const d = (n) => somarDias(hoje, n);

  const criancas = [
    {
      id: 'rafael',
      nome: 'Rafael',
      apelido: 'Rafael',
      idade: 10,
      layout: 'rafael',
      usaMarcas: true,
      blocoRevisoes: { titulo: 'Revisões do dia', horario: '13h às 14h', dias: MENOS_SABADO },
    },
    { id: 'mf', nome: 'Maria Fernanda', apelido: 'MF', idade: 7, layout: 'mf', usaMarcas: false, blocoRevisoes: null },
  ];

  const topicos = [];
  const perguntas = [];
  const errosTopico = [];
  const diarioAulas = [];

  function topico(id, criancaId, materia, titulo, estado, listaPerguntas = []) {
    topicos.push({
      id,
      criancaId,
      materia,
      titulo,
      caixa: 1,
      dominado: false,
      proximaRevisao: null,
      ultimaRevisao: null,
      ultimoResultado: null,
      criadoEm: d(-60),
      ...estado,
    });
    listaPerguntas.forEach((p, i) => perguntas.push({ id: `${id}-p${i + 1}`, topicoId: id, ordem: i + 1, tipo: 'curta', palavras: [], ...p }));
  }

  function erro(topicoId, dias, resultado, texto, marcas = []) {
    errosTopico.push({ id: `e-${topicoId}-${dias}`, topicoId, data: d(dias), resultado, texto, marcas, tarefaId: null });
  }

  // ---------------- Rafael ----------------
  topico('r-fracoes', 'rafael', 'Matemática', 'Frações equivalentes', { caixa: 2, ultimaRevisao: d(-3), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { enunciado: 'Complete: 1/2 = ?/8', resposta: '4/8' },
    { enunciado: 'Complete: 2/3 = 6/?', resposta: '6/9' },
  ]);
  topico('r-mult', 'rafael', 'Matemática', 'Multiplicação por 2 algarismos', { caixa: 1, ultimaRevisao: d(-2), ultimoResultado: 'errou', proximaRevisao: d(-1) }, [
    { enunciado: 'Calcule 34 × 12', resposta: '408' },
    { enunciado: 'Calcule 27 × 15', resposta: '405' },
  ]);
  erro('r-mult', -20, 'errou', '34 × 12 = 68 (não deslocou a segunda linha)');
  erro('r-mult', -12, 'errou', '27 × 15 = 135');
  erro('r-mult', -8, 'parcial', 'Acertou 56 × 23, mas com * (olhou o exemplo do livro)', ['*']);
  erro('r-mult', -2, 'errou', '56 × 23 = 1188');

  topico('r-divisao', 'rafael', 'Matemática', 'Divisão com resto', { caixa: 3, ultimaRevisao: d(-9), ultimoResultado: 'acertou', proximaRevisao: d(-2) }, [
    { enunciado: 'Quanto é 47 ÷ 5? Diga o quociente e o resto.', resposta: 'Quociente 9, resto 2' },
  ]);
  topico('r-decimais', 'rafael', 'Matemática', 'Números decimais', { caixa: 4, ultimaRevisao: d(-25), ultimoResultado: 'acertou', proximaRevisao: d(5) }, [
    { enunciado: 'Escreva por extenso: 3,25', resposta: 'Três inteiros e vinte e cinco centésimos' },
  ]);
  topico('r-perimetro', 'rafael', 'Matemática', 'Perímetro', { caixa: 7, ultimaRevisao: d(-360), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { enunciado: 'Qual o perímetro de um quadrado de lado 7 cm?', resposta: '28 cm' },
  ]);

  topico('r-oxitonas', 'rafael', 'Português', 'Acentuação das oxítonas', { caixa: 2, ultimaRevisao: d(-3), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    {
      tipo: 'aberta',
      enunciado: 'Explique com suas palavras quando uma oxítona leva acento e dê dois exemplos.',
      resposta: 'Oxítonas terminadas em A(s), E(s), O(s), EM, ENS levam acento. Ex.: sofá, café, também.',
    },
  ]);
  topico('r-ss', 'rafael', 'Português', 'Ditado: S, SS e Ç', { caixa: 1, ultimaRevisao: d(-3), ultimoResultado: 'parcial', proximaRevisao: d(-2) }, [
    { tipo: 'ditado', enunciado: 'Ditado', resposta: '', palavras: ['passarinho', 'cansado', 'açúcar', 'pássaro', 'sapato', 'pescoço'] },
  ]);
  erro('r-ss', -3, 'parcial', "Escreveu 'açucar' sem acento e 'pasaro'");
  topico('r-coletivos', 'rafael', 'Português', 'Substantivos coletivos', { caixa: 5, ultimaRevisao: d(-50), ultimoResultado: 'acertou', proximaRevisao: d(40) }, [
    { enunciado: 'Qual o coletivo de lobos?', resposta: 'Alcateia' },
  ]);

  topico('r-agua', 'rafael', 'Ciências', 'Ciclo da água', { caixa: 3, ultimaRevisao: d(-6), ultimoResultado: 'acertou', proximaRevisao: d(1) }, [
    { tipo: 'aberta', enunciado: 'Descreva as etapas do ciclo da água.', resposta: 'Evaporação, condensação, precipitação e infiltração/escoamento.' },
  ]);
  topico('r-cadeia', 'rafael', 'Ciências', 'Cadeia alimentar', { caixa: 1, proximaRevisao: d(0), criadoEm: d(-1) }, [
    { tipo: 'aberta', enunciado: 'Monte uma cadeia alimentar com três seres vivos e explique quem come quem.', resposta: 'Ex.: capim → gafanhoto → sapo.' },
  ]);
  diarioAulas.push({ id: 'a-r-cadeia', criancaId: 'rafael', data: d(-1), materia: 'Ciências', conteudo: 'Cadeia alimentar: produtores, consumidores e decompositores', topicoId: 'r-cadeia' });

  topico('r-capitanias', 'rafael', 'História', 'Capitanias hereditárias', { caixa: 2, ultimaRevisao: d(-1), ultimoResultado: 'acertou', proximaRevisao: d(2) }, [
    { enunciado: 'Por que as capitanias eram chamadas de "hereditárias"?', resposta: 'Porque passavam de pai para filho.' },
  ]);
  topico('r-regioes', 'rafael', 'Geografia', 'Regiões do Brasil', { caixa: 2, ultimaRevisao: d(-3), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { enunciado: 'Quais são as cinco regiões do Brasil?', resposta: 'Norte, Nordeste, Centro-Oeste, Sudeste e Sul.' },
  ]);
  topico('r-days', 'rafael', 'Inglês', 'Days of the week', { caixa: 3, ultimaRevisao: somarDias(proximoSabado(hoje), -7), ultimoResultado: 'acertou', proximaRevisao: proximoSabado(hoje) }, [
    { enunciado: 'Escreva em inglês: segunda, quarta e sexta.', resposta: 'Monday, Wednesday, Friday' },
  ]);

  // ---------------- MF ----------------
  topico('m-nh', 'mf', 'Português', 'Sílabas com NH', { caixa: 2, ultimaRevisao: d(-3), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { tipo: 'ditado', enunciado: 'Ditado', resposta: '', palavras: ['ninho', 'banho', 'sonho', 'galinha', 'unha', 'minhoca', 'rainha'] },
  ]);
  topico('m-rimas', 'mf', 'Português', 'Rimas', { caixa: 1, ultimaRevisao: d(-2), ultimoResultado: 'errou', proximaRevisao: d(-1) }, [
    { enunciado: 'Que palavra rima com GATO?', resposta: 'PATO, RATO, SAPATO' },
    { enunciado: 'Que palavra rima com BOLA?', resposta: 'COLA, MOLA, ESCOLA' },
  ]);
  erro('m-rimas', -2, 'errou', 'Respondeu CACHORRO');
  topico('m-vogais', 'mf', 'Português', 'Vogais e consoantes', { caixa: 4, ultimaRevisao: d(-20), ultimoResultado: 'acertou', proximaRevisao: d(10) }, [
    { enunciado: 'Circule as vogais: BANANA', resposta: 'A, A, A' },
  ]);
  topico('m-adicao', 'mf', 'Matemática', 'Adição até 20', { caixa: 2, ultimaRevisao: d(-3), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { enunciado: 'Quanto é 8 + 7?', resposta: '15' },
    { enunciado: 'Quanto é 9 + 6?', resposta: '15' },
  ]);
  topico('m-dezenas', 'mf', 'Matemática', 'Dezenas e unidades', { caixa: 3, ultimaRevisao: d(-8), ultimoResultado: 'acertou', proximaRevisao: d(-1) }, [
    { enunciado: 'Quantas dezenas tem o número 47?', resposta: '4 dezenas (e 7 unidades)' },
  ]);
  topico('m-formas', 'mf', 'Matemática', 'Formas geométricas', { caixa: 1, proximaRevisao: d(0), criadoEm: d(-1) }, [
    { enunciado: 'Desenhe um triângulo e um quadrado.', resposta: 'Triângulo com 3 lados; quadrado com 4 lados iguais.' },
  ]);
  diarioAulas.push({ id: 'a-m-formas', criancaId: 'mf', data: d(-1), materia: 'Matemática', conteudo: 'Formas geométricas: triângulo, quadrado, círculo', topicoId: 'm-formas' });
  topico('m-planta', 'mf', 'Ciências', 'Partes da planta', { caixa: 2, ultimaRevisao: d(0), ultimoResultado: 'acertou', proximaRevisao: d(3) }, [
    { enunciado: 'Quais são as partes da planta?', resposta: 'RAIZ, CAULE, FOLHA, FLOR, FRUTO' },
  ]);
  topico('m-colors', 'mf', 'Inglês', 'Colors', { caixa: 3, ultimaRevisao: d(-7), ultimoResultado: 'acertou', proximaRevisao: d(0) }, [
    { enunciado: 'Como se diz VERMELHO em inglês?', resposta: 'RED' },
  ]);

  // ---------------- Obrigações fixas ----------------
  let ordem = 0;
  const ob = (criancaId, titulo, tipo, periodo, dias, extra = {}) => ({
    id: `o-${criancaId}-${++ordem}`,
    criancaId,
    titulo,
    tipo,
    periodo: tipo === 'App' ? null : periodo,
    dias,
    ordem,
    contaRecompensa: true,
    ativa: true,
    ...extra,
  });
  const obrigacoes = [
    ob('rafael', 'Arrumar a cama', 'Casa', 'manha', TODOS_OS_DIAS),
    ob('rafael', 'Comida e água para o cachorro', 'Animais', 'manha', TODOS_OS_DIAS),
    ob('rafael', 'Lavar a louça do almoço', 'Casa', 'tarde', SEG_A_SEX),
    ob('rafael', 'Guardar as roupas lavadas', 'Casa', 'tarde', SEX_A_SEG),
    ob('rafael', 'Escovar o cachorro', 'Animais', 'noite', [3, 6]),
    ob('rafael', 'Leitura (20 min)', 'Leitura', 'tarde', MENOS_SABADO),
    ob('rafael', 'Violão (15 min)', 'Instrumento', 'tarde', [1, 3, 5]),
    ob('rafael', 'Duolingo', 'App', null, TODOS_OS_DIAS),
    ob('rafael', 'Khan Academy', 'App', null, SEG_A_SEX),

    ob('mf', 'Arrumar a cama', 'Casa', 'manha', TODOS_OS_DIAS, { emoji: '🛏️' }),
    ob('mf', 'Caderno de caligrafia', 'Escrita', 'manha', SEG_A_SEX, { emoji: '✏️' }),
    ob('mf', 'Guardar as roupas', 'Casa', 'tarde', SEX_A_SEG, { emoji: '👕' }),
    ob('mf', 'Comida para o gato', 'Animais', 'noite', TODOS_OS_DIAS, { emoji: '🐱' }),
    ob('mf', 'Guardar os brinquedos', 'Casa', 'noite', TODOS_OS_DIAS, { emoji: '🧸' }),
    ob('mf', 'Leitura com um adulto (10 min)', 'Leitura', 'noite', MENOS_SABADO, { emoji: '📖' }),
    ob('mf', 'Duolingo ABC', 'App', null, TODOS_OS_DIAS, { emoji: '📱' }),
  ];

  const agenda = criancas.flatMap((c) => AGENDA_PADRAO.map((tipoFolha, diaSemana) => ({ criancaId: c.id, diaSemana, tipoFolha })));

  return {
    versao: 1,
    criancas,
    topicos,
    perguntas,
    errosTopico,
    diarioAulas,
    obrigacoes,
    agenda,
    folhas: [],
    tarefas: [],
    config: structuredClone(CONFIG_PADRAO),
    dataSimulada: null,
  };
}

/**
 * Resultados usados para registrar automaticamente a folha de ONTEM do Rafael na carga inicial,
 * para a demonstração já ter um dia registrado (a de ontem da MF fica pendente de propósito).
 */
export const RESULTADOS_EXEMPLO_ONTEM = ['acertou', 'parcial', 'acertou', 'errou', 'acertou'];
export const ELOGIO_EXEMPLO = 'Você conferiu as contas de divisão sozinho antes de entregar. Isso é capricho!';
