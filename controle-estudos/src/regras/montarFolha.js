// Monta a lista de itens da folha de um dia para uma criança.
// Função pura: recebe tudo o que precisa e devolve os itens na ordem da folha
// (a mesma ordem do Registro rápido).
import { RESULTADO } from './caixas.js';
import { diaDaSemana, somarDias, DOMINGO, SEXTA } from './datas.js';
import {
  AGENDA_PADRAO,
  TIPO_FOLHA,
  TIPOS_ROTINA_CASA,
  PERIODOS,
  comPadroes,
} from './configuracao.js';

/** Prioridade quando acumula: ❌ → atrasados → vencem no dia → (sexta) 🟡/❌ da semana. */
export const PRIORIDADE = Object.freeze({ erro: 0, atrasado: 1, vence_hoje: 2, quiz: 3 });

export const NOME_MOTIVO = {
  nova: 'Nova',
  erro: '❌ errou na última',
  atrasado: 'Atrasado',
  vence_hoje: 'Vence hoje',
  quiz: 'Quiz da semana',
};

/** Tipo de folha do dia, pela agenda da criança (ou pela agenda padrão). */
export function tipoDaFolha(agenda, criancaId, data) {
  const dia = diaDaSemana(data);
  const linha = (agenda ?? []).find((a) => a.criancaId === criancaId && a.diaSemana === dia);
  return linha?.tipoFolha ?? AGENDA_PADRAO[dia];
}

export function limiteDoDia(data, tipoFolha, config) {
  const c = comPadroes(config);
  const dia = diaDaSemana(data);
  if (dia === SEXTA || tipoFolha === TIPO_FOLHA.QUIZ) return c.limitePorBlocoSexta;
  if (dia === DOMINGO) return c.limitePorBlocoDomingo;
  return c.limitePorBloco;
}

/** Classifica um tópico já revisado antes. Devolve o motivo ou null se não entra hoje. */
export function motivoDaRevisao(topico, data) {
  if (topico.dominado || !topico.proximaRevisao) return null;
  if (topico.proximaRevisao > data) return null; // a data é um mínimo
  if (topico.ultimoResultado === RESULTADO.ERROU) return 'erro';
  if (topico.proximaRevisao < data) return 'atrasado';
  return 'vence_hoje';
}

/** Escolhe a pergunta do tópico usada há mais tempo (ou nunca usada). */
export function escolherPergunta(perguntasDoTopico, usoPerguntas = {}) {
  if (!perguntasDoTopico.length) return null;
  return [...perguntasDoTopico].sort((a, b) => {
    const ua = usoPerguntas[a.id] ?? '';
    const ub = usoPerguntas[b.id] ?? '';
    if (ua !== ub) return ua < ub ? -1 : 1;
    return (a.ordem ?? 0) - (b.ordem ?? 0);
  })[0];
}

function compararCandidatos(a, b) {
  if (PRIORIDADE[a.motivo] !== PRIORIDADE[b.motivo]) return PRIORIDADE[a.motivo] - PRIORIDADE[b.motivo];
  const pa = a.topico.proximaRevisao ?? '';
  const pb = b.topico.proximaRevisao ?? '';
  if (pa !== pb) return pa < pb ? -1 : 1;
  if (a.topico.caixa !== b.topico.caixa) return a.topico.caixa - b.topico.caixa;
  return a.topico.titulo.localeCompare(b.topico.titulo, 'pt-BR');
}

function itemBase(extra) {
  return {
    resultado: null,
    status: null,
    marcas: [],
    sugerido: false,
    observacao: '',
    caixaManual: null,
    ...extra,
  };
}

/**
 * @param {object} p
 * @param {string} p.criancaId
 * @param {string} p.data                 'AAAA-MM-DD'
 * @param {string} [p.tipoFolha]          se omitido, vem da agenda
 * @param {Array}  [p.agenda]
 * @param {Array}  p.topicos              tópicos (de todas as crianças; filtramos aqui)
 * @param {Array}  p.perguntas
 * @param {Array}  [p.historico]          [{topicoId, data, resultado}] resultados já registrados
 * @param {object} [p.usoPerguntas]       {perguntaId: 'AAAA-MM-DD' do último uso}
 * @param {Array}  [p.obrigacoes]
 * @param {object} [p.config]
 * @returns {{tipoFolha:string, itens:Array, excedentes:Array}}
 */
export function montarFolha(p) {
  const config = comPadroes(p.config);
  const tipoFolha = p.tipoFolha ?? tipoDaFolha(p.agenda, p.criancaId, p.data);
  const topicos = p.topicos.filter((t) => t.criancaId === p.criancaId);
  const perguntasPorTopico = agruparPor(p.perguntas ?? [], 'topicoId');

  const itensEstudo = [];
  const excedentes = [];

  if (tipoFolha !== TIPO_FOLHA.SEM_ESTUDO) {
    // 1) Candidatos
    const candidatos = [];
    const novos = [];
    for (const topico of topicos) {
      if (topico.dominado) continue;
      const nuncaRevisado = !topico.ultimaRevisao;
      if (nuncaRevisado) {
        // Conteúdo novo entra na primeira folha de Reforço em que já pode aparecer.
        if (tipoFolha === TIPO_FOLHA.REFORCO && (!topico.proximaRevisao || topico.proximaRevisao <= p.data)) {
          novos.push({ topico, motivo: 'nova' });
        }
        continue;
      }
      const motivo = motivoDaRevisao(topico, p.data);
      if (motivo) candidatos.push({ topico, motivo });
    }

    // 2) Sexta: tudo que ficou 🟡/❌ na semana (janela configurável), mesmo sem vencer.
    if (tipoFolha === TIPO_FOLHA.QUIZ) {
      const inicio = somarDias(p.data, -config.janelaQuizDias);
      const jaIncluidos = new Set(candidatos.map((c) => c.topico.id));
      const daSemana = new Set(
        (p.historico ?? [])
          .filter((h) => h.data >= inicio && h.data < p.data)
          .filter((h) => h.resultado === RESULTADO.PARCIAL || h.resultado === RESULTADO.ERROU)
          .map((h) => h.topicoId),
      );
      for (const topico of topicos) {
        if (!topico.dominado && daSemana.has(topico.id) && !jaIncluidos.has(topico.id)) {
          candidatos.push({ topico, motivo: 'quiz' });
        }
      }
    }

    // 3) Agrupa por matéria (= bloco), ordena por prioridade e aplica o limite de revisões.
    const limite = limiteDoDia(p.data, tipoFolha, config);
    const materias = [...new Set([...novos, ...candidatos].map((c) => c.topico.materia))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
    for (const materia of materias) {
      const novosDaMateria = novos
        .filter((c) => c.topico.materia === materia)
        .sort((a, b) => a.topico.titulo.localeCompare(b.topico.titulo, 'pt-BR'));
      const revisoes = candidatos.filter((c) => c.topico.materia === materia).sort(compararCandidatos);
      const entram = revisoes.slice(0, limite);
      excedentes.push(...revisoes.slice(limite).map((c) => ({ topicoId: c.topico.id, motivo: c.motivo })));

      for (const c of [...novosDaMateria, ...entram]) {
        const pergunta = escolherPergunta(perguntasPorTopico[c.topico.id] ?? [], p.usoPerguntas);
        itensEstudo.push(
          itemBase({
            secao: 'estudo',
            tipo: c.motivo === 'nova' ? 'Nova' : 'Revisão',
            motivo: c.motivo,
            materia,
            titulo: c.topico.titulo,
            topicoId: c.topico.id,
            caixaNaFolha: c.topico.caixa,
            perguntaId: pergunta?.id ?? null,
            tipoPergunta: pergunta?.tipo ?? 'curta',
            enunciado: pergunta?.enunciado ?? c.topico.titulo,
            palavras: pergunta?.palavras ?? [],
            periodo: null,
            contaRecompensa: config.estudoContaRecompensa,
          }),
        );
      }
    }
  }

  // 4) Obrigações fixas do dia, agrupadas por período (apps sem horário).
  const dia = diaDaSemana(p.data);
  const doDia = (p.obrigacoes ?? [])
    .filter((o) => o.criancaId === p.criancaId && o.ativa !== false && (o.dias ?? []).includes(dia))
    .map((o) => ({ ...o, periodo: o.tipo === 'App' ? null : o.periodo ?? null }));

  const ordemPeriodo = (per) => (per ? PERIODOS.indexOf(per) : PERIODOS.length);
  const ordenar = (a, b) =>
    ordemPeriodo(a.periodo) - ordemPeriodo(b.periodo) || (a.ordem ?? 0) - (b.ordem ?? 0) || a.titulo.localeCompare(b.titulo, 'pt-BR');

  const paraItem = (o, secao) =>
    itemBase({
      secao,
      tipo: o.tipo,
      motivo: null,
      materia: null,
      titulo: o.titulo,
      emoji: o.emoji ?? null,
      obrigacaoId: o.id,
      topicoId: null,
      periodo: o.periodo,
      contaRecompensa: o.contaRecompensa !== false,
    });

  // Leitura, Escrita e Instrumento ficam junto do estudo; Casa, Animais e App vão para a página separada.
  const rotinaEstudo = doDia.filter((o) => !TIPOS_ROTINA_CASA.includes(o.tipo)).sort(ordenar);
  const rotinaCasa = doDia.filter((o) => TIPOS_ROTINA_CASA.includes(o.tipo)).sort(ordenar);

  const itens = [
    ...itensEstudo,
    ...rotinaEstudo.map((o) => paraItem(o, 'estudo')),
    ...rotinaCasa.map((o) => paraItem(o, 'casa')),
  ].map((item, i) => ({ ...item, ordem: i + 1 }));

  return { tipoFolha, itens, excedentes };
}

function agruparPor(lista, campo) {
  const r = {};
  for (const x of lista) (r[x[campo]] ??= []).push(x);
  return r;
}
