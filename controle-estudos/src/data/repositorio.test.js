// Teste do ciclo completo com os dados de exemplo:
// folha → impressão → registro → folha seguinte.
import { describe, it, expect, beforeEach } from 'vitest';
import { criarRepositorio } from './repositorio.js';
import { criarArmazenamentoMemoria } from './armazenamento.js';

const HOJE = '2026-11-10'; // terça (Revisão)
const AMANHA = '2026-11-11'; // quarta (Reforço)

let repo;
beforeEach(async () => {
  repo = criarRepositorio(criarArmazenamentoMemoria(), { agora: () => '2026-11-10T20:00:00Z' });
  await repo.restaurarExemplo(HOJE);
  await repo.definirDataSimulada(HOJE);
});

const estudo = (itens) => itens.filter((i) => i.topicoId);

describe('dados de exemplo', () => {
  it('carregam com as duas crianças e as folhas de hoje prontas', async () => {
    expect((await repo.listarCriancas()).map((c) => c.id)).toEqual(['rafael', 'mf']);
    const { folha, itens } = await repo.obterFolha('rafael', HOJE);
    expect(folha.tipoFolha).toBe('revisao');
    expect(estudo(itens).length).toBeGreaterThan(0);
    expect(folha.elogio).not.toBe('');
  });

  it('ontem: folha do Rafael registrada e a da MF aparece como pendência', async () => {
    const pend = await repo.listarPendencias();
    expect(pend).toHaveLength(1);
    expect(pend[0].folha.criancaId).toBe('mf');
    expect(pend[0].motivo).toBe('sem_registro');
  });

  it('dia sem registro → nada mudou de caixa nos tópicos da MF', async () => {
    const { itens } = await repo.obterFolha('mf', '2026-11-09');
    const topicos = await repo.listarTopicos({ criancaId: 'mf' });
    for (const item of estudo(itens)) {
      const t = topicos.find((x) => x.id === item.topicoId);
      expect(t.caixa).toBe(item.caixaNaFolha);
    }
  });
});

describe('ciclo completo', () => {
  it('folha → impressão → registro → folha seguinte já sai certa', async () => {
    // 1) o app monta a folha (já gerada) e 2) o adulto imprime
    const { folha, itens } = await repo.obterFolha('rafael', HOJE);
    await repo.atualizarFolha(folha.id, { impressaEm: '2026-11-10T08:00:00Z' });

    // folha de amanhã gerada ANTES do registro de hoje (vai ser refeita automaticamente)
    await repo.gerarFolha('rafael', AMANHA);

    // 3) o adulto registra: tudo ✅ no estudo e ✓ nas tarefas
    const registrados = itens.map((i) => (i.topicoId ? { ...i, resultado: 'acertou' } : { ...i, status: 'feito' }));
    const { mudancas, regeneradas } = await repo.salvarRegistro(folha.id, registrados);

    // 4) o motor atualizou as caixas
    expect(mudancas.length).toBe(estudo(itens).length);
    for (const m of mudancas) {
      if (m.antes.caixa < 7) expect(m.depois.caixa).toBe(m.antes.caixa + 1);
      else expect(m.depois.dominado).toBe(true);
      expect(m.depois.proximaRevisao === null || m.depois.proximaRevisao > HOJE).toBe(true);
    }
    expect(regeneradas).toContain(AMANHA);

    // 5) a folha de amanhã não repete o que foi acertado hoje
    await repo.definirDataSimulada(AMANHA);
    const amanha = await repo.obterFolha('rafael', AMANHA);
    const acertadosHoje = new Set(mudancas.filter((m) => m.depois.caixa > 2 || m.depois.dominado).map((m) => m.topicoId));
    for (const item of estudo(amanha.itens)) expect(acertadosHoje.has(item.topicoId)).toBe(false);

    // hoje registrado não é pendência amanhã; a MF de 09/11 continua
    const pend = await repo.listarPendencias();
    expect(pend.map((p) => `${p.folha.criancaId} ${p.folha.data}`)).toEqual(['mf 2026-11-09', 'mf 2026-11-10']);
  });

  it('❌ grava o erro literal no histórico e o tópico volta para a caixa 1', async () => {
    const { folha, itens } = await repo.obterFolha('rafael', HOJE);
    const alvo = estudo(itens)[0];
    await repo.salvarRegistro(folha.id, [{ ...alvo, resultado: 'errou', observacao: 'escreveu 7 × 8 = 54' }]);
    const [t] = (await repo.listarTopicos()).filter((x) => x.id === alvo.topicoId);
    expect(t.caixa).toBe(1);
    expect(t.proximaRevisao).toBe(AMANHA);
    expect(t.erros.at(-1)).toMatchObject({ data: HOJE, resultado: 'errou', texto: 'escreveu 7 × 8 = 54' });
  });

  it('registro refeito desfaz o anterior (corrigir ❌ para ✅)', async () => {
    const { folha, itens } = await repo.obterFolha('rafael', HOJE);
    const alvo = estudo(itens).find((i) => i.caixaNaFolha < 7);
    await repo.salvarRegistro(folha.id, [{ ...alvo, resultado: 'errou', observacao: 'x' }]);
    await repo.salvarRegistro(folha.id, [{ ...alvo, resultado: 'acertou', observacao: '' }]);
    const [t] = (await repo.listarTopicos()).filter((x) => x.id === alvo.topicoId);
    expect(t.caixa).toBe(alvo.caixaNaFolha + 1);
    expect(t.erros.filter((e) => e.data === HOJE)).toHaveLength(0);
  });

  it('adulto corrige a caixa manualmente no registro', async () => {
    const { folha, itens } = await repo.obterFolha('rafael', HOJE);
    const alvo = estudo(itens)[0];
    await repo.salvarRegistro(folha.id, [{ ...alvo, resultado: 'acertou', caixaManual: 4 }]);
    const [t] = (await repo.listarTopicos()).filter((x) => x.id === alvo.topicoId);
    expect(t.caixa).toBe(4);
    expect(t.proximaRevisao).toBe('2026-12-10');
  });

  it('tarefa sem marca vira "Não feito" ao concluir; "Não se aplica" fica fora da recompensa', async () => {
    const { folha, itens } = await repo.obterFolha('mf', HOJE);
    const tarefas = itens.filter((i) => !i.topicoId);
    const editados = tarefas.map((t, i) => ({ ...t, status: i === 0 ? 'nao_se_aplica' : i === 1 ? 'feito' : null }));
    await repo.salvarRegistro(folha.id, editados);
    const depois = (await repo.obterFolha('mf', HOJE)).itens.filter((i) => !i.topicoId);
    expect(depois.slice(2).every((t) => t.status === 'nao_feito')).toBe(true);

    const rec = await repo.recompensaDaSemana('mf', HOJE);
    const na = rec.itens.find((i) => i.tarefa.id === tarefas[0].id);
    expect(na.conta).toBe(false);
  });

  it('aula nova vira tópico na caixa 1 e entra na próxima folha de Reforço', async () => {
    const id = await repo.registrarAula({
      criancaId: 'mf',
      data: HOJE,
      materia: 'Ciências',
      titulo: 'Estados da água',
      pergunta: { enunciado: 'O gelo é água em qual estado?', resposta: 'SÓLIDO' },
    });
    const folha = await repo.gerarFolha('mf', AMANHA); // quarta = Reforço
    const { itens } = await repo.obterFolha('mf', folha.data);
    const item = itens.find((i) => i.topicoId === id);
    expect(item.tipo).toBe('Nova');
    expect(item.enunciado).toBe('O gelo é água em qual estado?');
  });
});
