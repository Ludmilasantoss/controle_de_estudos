// Camada de dados. TODA leitura e escrita das telas passa por aqui.
// Todas as funções são assíncronas (devolvem Promise) para que a troca por Supabase
// não mude nada nas telas: basta reimplementar estas mesmas funções.
import { criarArmazenamentoLocal } from './armazenamento.js';
import { criarDadosExemplo, RESULTADOS_EXEMPLO_ONTEM, ELOGIO_EXEMPLO } from './exemplo.js';
import { aplicarResultado, definirCaixaManual, RESULTADO } from '../regras/caixas.js';
import { montarFolha } from '../regras/montarFolha.js';
import { listarPendencias } from '../regras/pendencias.js';
import { calcularRecompensa } from '../regras/recompensa.js';
import { STATUS } from '../regras/registroItem.js';
import { comPadroes, AGENDA_PADRAO } from '../regras/configuracao.js';
import { somarDias, hojeLocal, inicioDaSemana, fimDaSemana } from '../regras/datas.js';

const RESULTADOS_QUE_MOVEM = [RESULTADO.ACERTOU, RESULTADO.PARCIAL, RESULTADO.ERROU];
const CAMPOS_ESTADO = ['caixa', 'dominado', 'proximaRevisao', 'ultimaRevisao', 'ultimoResultado'];

function novoId(prefixo) {
  const aleatorio = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefixo}-${aleatorio}`;
}

function estadoDoTopico(t) {
  return Object.fromEntries(CAMPOS_ESTADO.map((c) => [c, t[c] ?? null]));
}

export function criarRepositorio(armazenamento = criarArmazenamentoLocal(), opcoes = {}) {
  const agora = opcoes.agora ?? (() => new Date().toISOString());

  // ---------- acesso bruto ----------
  function carregar() {
    const banco = armazenamento.ler();
    if (!banco) throw new Error('Banco vazio: chame inicializar() antes.');
    return banco;
  }
  function salvar(banco) {
    armazenamento.gravar(banco);
  }
  function hojeDo(banco) {
    return banco.dataSimulada ?? hojeLocal();
  }

  // ---------- folhas (funções internas, recebem o banco) ----------
  function usoDasPerguntas(banco) {
    const datasFolha = Object.fromEntries(banco.folhas.map((f) => [f.id, f.data]));
    const uso = {};
    for (const t of banco.tarefas) {
      if (!t.perguntaId) continue;
      const data = datasFolha[t.folhaId];
      if (!uso[t.perguntaId] || uso[t.perguntaId] < data) uso[t.perguntaId] = data;
    }
    return uso;
  }

  function gerarFolhaNoBanco(banco, criancaId, data, { regenerar = false } = {}) {
    const existente = banco.folhas.find((f) => f.criancaId === criancaId && f.data === data);
    if (existente && (!regenerar || existente.registradaEm)) return existente;

    // Na regeneração, o uso das perguntas desta própria folha não conta.
    if (existente) banco.tarefas = banco.tarefas.filter((t) => t.folhaId !== existente.id);

    const resultado = montarFolha({
      criancaId,
      data,
      agenda: banco.agenda,
      topicos: banco.topicos,
      perguntas: banco.perguntas,
      historico: banco.errosTopico,
      usoPerguntas: usoDasPerguntas(banco),
      obrigacoes: banco.obrigacoes,
      config: banco.config,
    });

    const folha = existente ?? {
      id: novoId('f'),
      criancaId,
      data,
      elogio: '',
      blocoAutonomo: false,
      impressaEm: null,
      registradaEm: null,
      dispensada: false,
    };
    Object.assign(folha, {
      tipoFolha: resultado.tipoFolha,
      excedentes: resultado.excedentes,
      geradaEm: agora(),
      desatualizada: false,
    });
    if (!existente) banco.folhas.push(folha);

    banco.tarefas.push(
      ...resultado.itens.map((item) => ({ ...item, id: novoId('t'), folhaId: folha.id, criancaId, data, estadoAntes: null })),
    );
    return folha;
  }

  /** Aplica o registro de uma folha ao banco e devolve as mudanças de caixa. */
  function registrarNoBanco(banco, folhaId, itensEditados, { concluir = true } = {}) {
    const folha = banco.folhas.find((f) => f.id === folhaId);
    if (!folha) throw new Error('Folha não encontrada');
    const editados = Object.fromEntries(itensEditados.map((i) => [i.id, i]));
    const mudancas = [];

    for (const tarefa of banco.tarefas.filter((t) => t.folhaId === folhaId)) {
      const edit = editados[tarefa.id];
      if (!edit) continue;
      Object.assign(tarefa, {
        resultado: edit.resultado ?? null,
        status: edit.status ?? null,
        marcas: edit.marcas ?? [],
        sugerido: Boolean(edit.sugerido),
        observacao: edit.observacao ?? '',
        caixaManual: edit.caixaManual ?? null,
      });

      if (!tarefa.topicoId) {
        // Sem marca = Não feito (salvo decisão do adulto), ao concluir.
        if (concluir && !tarefa.status) tarefa.status = STATUS.NAO_FEITO;
        continue;
      }

      const topico = banco.topicos.find((t) => t.id === tarefa.topicoId);
      if (!topico) continue;

      // Registro refeito: desfaz o efeito anterior antes de aplicar de novo.
      if (tarefa.estadoAntes) Object.assign(topico, tarefa.estadoAntes);
      banco.errosTopico = banco.errosTopico.filter((e) => e.tarefaId !== tarefa.id);
      tarefa.estadoAntes = null;

      if (!RESULTADOS_QUE_MOVEM.includes(tarefa.resultado)) continue; // pendente: nada muda

      const antes = estadoDoTopico(topico);
      let depois = aplicarResultado(topico, tarefa.resultado, folha.data);
      if (tarefa.caixaManual) depois = { ...depois, ...definirCaixaManual(tarefa.caixaManual, folha.data) };
      Object.assign(topico, depois);
      tarefa.estadoAntes = antes;

      if (tarefa.resultado !== RESULTADO.ACERTOU) {
        banco.errosTopico.push({
          id: novoId('e'),
          topicoId: topico.id,
          data: folha.data,
          resultado: tarefa.resultado,
          texto: tarefa.observacao || '',
          marcas: tarefa.marcas,
          tarefaId: tarefa.id,
        });
      }
      mudancas.push({ topicoId: topico.id, titulo: topico.titulo, resultado: tarefa.resultado, antes, depois: estadoDoTopico(topico) });
    }

    if (concluir) {
      folha.registradaEm = agora();
      folha.dispensada = false;
    }

    // A folha seguinte já sai certa: folhas futuras ainda não impressas são refeitas;
    // as já impressas ficam marcadas como desatualizadas.
    const regeneradas = [];
    for (const f of banco.folhas) {
      if (f.criancaId !== folha.criancaId || f.data <= folha.data || f.registradaEm) continue;
      if (f.impressaEm) f.desatualizada = true;
      else {
        gerarFolhaNoBanco(banco, f.criancaId, f.data, { regenerar: true });
        regeneradas.push(f.data);
      }
    }
    return { mudancas, regeneradas };
  }

  function semear(dataBase) {
    const banco = criarDadosExemplo(dataBase);
    banco.dataSimulada = null;
    // Ontem: Rafael registrado (exemplo de ciclo completo), MF pendente (exemplo de pendência).
    const ontem = somarDias(dataBase, -1);
    const folhaRafael = gerarFolhaNoBanco(banco, 'rafael', ontem);
    gerarFolhaNoBanco(banco, 'mf', ontem);
    let i = 0;
    const itens = banco.tarefas
      .filter((t) => t.folhaId === folhaRafael.id)
      .map((t) =>
        t.topicoId
          ? { ...t, resultado: RESULTADOS_EXEMPLO_ONTEM[i++ % RESULTADOS_EXEMPLO_ONTEM.length], observacao: '' }
          : { ...t, status: t.tipo === 'Instrumento' ? STATUS.NAO_SE_APLICA : STATUS.FEITO },
      );
    itens.forEach((t) => {
      if (t.resultado === RESULTADO.ERROU) t.observacao = 'Exemplo: resposta errada anotada pelo adulto';
    });
    folhaRafael.impressaEm = agora();
    registrarNoBanco(banco, folhaRafael.id, itens);
    // Folhas de hoje já geradas; a do Rafael com um elogio concreto sobre ontem.
    gerarFolhaNoBanco(banco, 'rafael', dataBase).elogio = ELOGIO_EXEMPLO;
    gerarFolhaNoBanco(banco, 'mf', dataBase);
    return banco;
  }

  // ---------- API pública ----------
  return {
    /** Carrega os dados de exemplo na primeira execução. */
    async inicializar(dataBase = hojeLocal()) {
      if (!armazenamento.ler()) salvar(semear(dataBase));
    },

    async restaurarExemplo(dataBase = hojeLocal()) {
      armazenamento.limpar();
      salvar(semear(dataBase));
    },

    // ----- data do app (permite simular dias para testar o ciclo) -----
    async hoje() {
      return hojeDo(carregar());
    },
    async definirDataSimulada(data) {
      const banco = carregar();
      banco.dataSimulada = data || null;
      salvar(banco);
    },

    // ----- crianças -----
    async listarCriancas() {
      return carregar().criancas;
    },
    async obterCrianca(id) {
      return carregar().criancas.find((c) => c.id === id) ?? null;
    },

    // ----- tópicos e perguntas -----
    async listarTopicos(filtro = {}) {
      const banco = carregar();
      return banco.topicos
        .filter((t) => !filtro.criancaId || t.criancaId === filtro.criancaId)
        .filter((t) => !filtro.materia || t.materia === filtro.materia)
        .filter((t) => {
          if (!filtro.caixa) return true;
          if (filtro.caixa === 'dominado') return t.dominado;
          return !t.dominado && t.caixa === Number(filtro.caixa);
        })
        .map((t) => ({
          ...t,
          erros: banco.errosTopico.filter((e) => e.topicoId === t.id).sort((a, b) => (a.data < b.data ? -1 : 1)),
          perguntas: banco.perguntas.filter((p) => p.topicoId === t.id).sort((a, b) => a.ordem - b.ordem),
        }))
        .sort((a, b) => a.materia.localeCompare(b.materia, 'pt-BR') || a.titulo.localeCompare(b.titulo, 'pt-BR'));
    },

    async listarMaterias() {
      return [...new Set(carregar().topicos.map((t) => t.materia))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    },

    /** Correção manual da caixa pelo adulto (a partir de hoje). */
    async corrigirCaixa(topicoId, novaCaixa) {
      const banco = carregar();
      const t = banco.topicos.find((x) => x.id === topicoId);
      if (novaCaixa === 'dominado') Object.assign(t, { dominado: true, caixa: 7, proximaRevisao: null });
      else Object.assign(t, definirCaixaManual(novaCaixa, hojeDo(banco)));
      salvar(banco);
    },

    /** Diário de aulas: uma aula nova cria um tópico na caixa 1 (entra na próxima folha de Reforço). */
    async registrarAula({ criancaId, data, materia, titulo, conteudo, pergunta }) {
      const banco = carregar();
      const topicoId = novoId('top');
      banco.topicos.push({
        id: topicoId,
        criancaId,
        materia,
        titulo,
        caixa: 1,
        dominado: false,
        proximaRevisao: somarDias(data, 1),
        ultimaRevisao: null,
        ultimoResultado: null,
        criadoEm: data,
      });
      if (pergunta?.enunciado) {
        banco.perguntas.push({ id: novoId('p'), topicoId, ordem: 1, tipo: 'curta', palavras: [], resposta: '', ...pergunta });
      }
      banco.diarioAulas.push({ id: novoId('a'), criancaId, data, materia, conteudo: conteudo || titulo, topicoId });
      salvar(banco);
      return topicoId;
    },

    async adicionarPergunta(topicoId, pergunta) {
      const banco = carregar();
      const ordem = banco.perguntas.filter((p) => p.topicoId === topicoId).length + 1;
      banco.perguntas.push({ id: novoId('p'), topicoId, ordem, tipo: 'curta', palavras: [], resposta: '', ...pergunta });
      salvar(banco);
    },

    async listarDiarioAulas() {
      return [...carregar().diarioAulas].sort((a, b) => (a.data > b.data ? -1 : 1));
    },

    // ----- folhas -----
    async gerarFolha(criancaId, data, opcoes) {
      const banco = carregar();
      const folha = gerarFolhaNoBanco(banco, criancaId, data, opcoes);
      salvar(banco);
      return folha;
    },

    /** Folha + itens (ordenados) + dados de apoio para impressão/gabarito. */
    async obterFolha(criancaId, data) {
      const banco = carregar();
      const folha = banco.folhas.find((f) => f.criancaId === criancaId && f.data === data);
      if (!folha) return null;
      const itens = banco.tarefas.filter((t) => t.folhaId === folha.id).sort((a, b) => a.ordem - b.ordem);
      const topicosPorId = Object.fromEntries(banco.topicos.map((t) => [t.id, t]));
      const perguntasPorId = Object.fromEntries(banco.perguntas.map((p) => [p.id, p]));
      const errosPorTopico = {};
      for (const e of banco.errosTopico) (errosPorTopico[e.topicoId] ??= []).push(e);
      Object.values(errosPorTopico).forEach((l) => l.sort((a, b) => (a.data < b.data ? -1 : 1)));
      return {
        folha,
        itens,
        crianca: banco.criancas.find((c) => c.id === criancaId),
        topicosPorId,
        perguntasPorId,
        errosPorTopico,
      };
    },

    async atualizarFolha(folhaId, campos) {
      const banco = carregar();
      const folha = banco.folhas.find((f) => f.id === folhaId);
      const permitidos = ['elogio', 'blocoAutonomo', 'impressaEm', 'dispensada'];
      for (const c of permitidos) if (c in campos) folha[c] = campos[c];
      salvar(banco);
      return folha;
    },

    async salvarRegistro(folhaId, itens, opcoes) {
      const banco = carregar();
      const r = registrarNoBanco(banco, folhaId, itens, opcoes);
      salvar(banco);
      return r;
    },

    async listarFolhas(filtro = {}) {
      return carregar()
        .folhas.filter((f) => !filtro.criancaId || f.criancaId === filtro.criancaId)
        .sort((a, b) => (a.data < b.data ? 1 : -1));
    },

    async listarPendencias() {
      const banco = carregar();
      return listarPendencias({ folhas: banco.folhas, tarefas: banco.tarefas, hoje: hojeDo(banco) });
    },

    // ----- obrigações, agenda e configuração -----
    async listarObrigacoes(criancaId) {
      return carregar()
        .obrigacoes.filter((o) => !criancaId || o.criancaId === criancaId)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    },
    async salvarObrigacao(obrigacao) {
      const banco = carregar();
      const o = { ...obrigacao, periodo: obrigacao.tipo === 'App' ? null : obrigacao.periodo };
      if (o.id) banco.obrigacoes = banco.obrigacoes.map((x) => (x.id === o.id ? { ...x, ...o } : x));
      else banco.obrigacoes.push({ ativa: true, contaRecompensa: true, dias: [], ...o, id: novoId('o'), ordem: banco.obrigacoes.length + 1 });
      salvar(banco);
    },
    async excluirObrigacao(id) {
      const banco = carregar();
      banco.obrigacoes = banco.obrigacoes.filter((o) => o.id !== id);
      salvar(banco);
    },

    async obterAgenda() {
      return carregar().agenda;
    },
    async definirAgenda(criancaId, diaSemana, tipoFolha) {
      const banco = carregar();
      const linha = banco.agenda.find((a) => a.criancaId === criancaId && a.diaSemana === diaSemana);
      if (linha) linha.tipoFolha = tipoFolha;
      else banco.agenda.push({ criancaId, diaSemana, tipoFolha: tipoFolha ?? AGENDA_PADRAO[diaSemana] });
      salvar(banco);
    },

    async obterConfig() {
      return comPadroes(carregar().config);
    },
    async salvarConfig(config) {
      const banco = carregar();
      banco.config = comPadroes(config);
      salvar(banco);
    },

    // ----- recompensa -----
    async recompensaDaSemana(criancaId, dataNaSemana) {
      const banco = carregar();
      const hoje = hojeDo(banco);
      const inicio = inicioDaSemana(dataNaSemana);
      const fim = fimDaSemana(dataNaSemana);
      const folhas = banco.folhas.filter((f) => f.criancaId === criancaId && f.data >= inicio && f.data <= fim && f.data <= hoje);
      const ids = new Set(folhas.map((f) => f.id));
      const tarefas = banco.tarefas.filter((t) => ids.has(t.folhaId)).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.ordem - b.ordem));
      return { inicio, fim, ...calcularRecompensa({ tarefas, config: banco.config }) };
    },
  };
}

/** Instância usada pelo app (localStorage). */
export const repositorio = criarRepositorio();
