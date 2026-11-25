import { describe, it, expect } from 'vitest';
import { montarFolha, tipoDaFolha, escolherPergunta } from './montarFolha.js';
import { aplicarResultado } from './caixas.js';

// Novembro de 2026: 10 = terça, 13 = sexta, 14 = sábado, 15 = domingo, 16 = segunda.
const C = 'rafael';

function topico(id, extra = {}) {
  return {
    id,
    criancaId: C,
    materia: 'Matemática',
    titulo: `Tópico ${id}`,
    caixa: 2,
    dominado: false,
    ultimaRevisao: '2026-11-01',
    ultimoResultado: 'acertou',
    proximaRevisao: '2026-11-10',
    ...extra,
  };
}

const idsDeEstudo = (folha) => folha.itens.filter((i) => i.secao === 'estudo' && i.topicoId).map((i) => i.topicoId);

describe('montarFolha — critérios de aceite', () => {
  it('revisão que vence num sábado → não aparece no sábado e aparece na folha de domingo', () => {
    const topicos = [topico('t1', { proximaRevisao: '2026-11-14' })];
    const sabado = montarFolha({ criancaId: C, data: '2026-11-14', topicos, perguntas: [] });
    expect(sabado.tipoFolha).toBe('sem_estudo');
    expect(idsDeEstudo(sabado)).toEqual([]);

    const domingo = montarFolha({ criancaId: C, data: '2026-11-15', topicos, perguntas: [] });
    expect(idsDeEstudo(domingo)).toEqual(['t1']);
    expect(domingo.itens[0].motivo).toBe('atrasado');
  });

  it('dia sem registro → nada muda de caixa e o item volta na folha seguinte', () => {
    const t = topico('t1', { proximaRevisao: '2026-11-10' });
    const dia1 = montarFolha({ criancaId: C, data: '2026-11-10', topicos: [t], perguntas: [] });
    expect(idsDeEstudo(dia1)).toEqual(['t1']);

    // Ninguém registrou: o tópico segue igual (aplicar "pendente" não muda nada).
    const depois = { ...t, ...aplicarResultado(t, 'pendente', '2026-11-10') };
    expect(depois.caixa).toBe(2);
    expect(depois.proximaRevisao).toBe('2026-11-10');

    const dia2 = montarFolha({ criancaId: C, data: '2026-11-11', topicos: [depois], perguntas: [] });
    expect(idsDeEstudo(dia2)).toEqual(['t1']);
    expect(dia2.itens[0].motivo).toBe('atrasado');
  });
});

describe('montarFolha — prioridade e limite', () => {
  it('ordem: ❌ primeiro, depois atrasados, depois os que vencem no dia', () => {
    const topicos = [
      topico('hoje', { proximaRevisao: '2026-11-10' }),
      topico('atrasado', { proximaRevisao: '2026-11-05' }),
      topico('erro', { caixa: 1, ultimoResultado: 'errou', proximaRevisao: '2026-11-09' }),
      topico('futuro', { proximaRevisao: '2026-11-11' }),
    ];
    const folha = montarFolha({ criancaId: C, data: '2026-11-10', topicos, perguntas: [] });
    expect(idsDeEstudo(folha)).toEqual(['erro', 'atrasado', 'hoje']);
  });

  it('respeita o limite por bloco (matéria) e devolve os excedentes', () => {
    const topicos = Array.from({ length: 8 }, (_, i) => topico(`t${i}`, { proximaRevisao: `2026-11-0${i + 1}` }));
    const folha = montarFolha({ criancaId: C, data: '2026-11-10', topicos, perguntas: [], config: { limitePorBloco: 4 } });
    expect(idsDeEstudo(folha)).toEqual(['t0', 't1', 't2', 't3']);
    expect(folha.excedentes.map((e) => e.topicoId)).toEqual(['t4', 't5', 't6', 't7']);
  });

  it('o limite vale por matéria', () => {
    const topicos = [
      ...Array.from({ length: 3 }, (_, i) => topico(`m${i}`)),
      ...Array.from({ length: 3 }, (_, i) => topico(`p${i}`, { materia: 'Português' })),
    ];
    const folha = montarFolha({ criancaId: C, data: '2026-11-10', topicos, perguntas: [], config: { limitePorBloco: 2 } });
    expect(idsDeEstudo(folha)).toHaveLength(4);
  });

  it('domingo e sexta usam limites próprios', () => {
    const topicos = Array.from({ length: 9 }, (_, i) => topico(`t${i}`, { proximaRevisao: '2026-11-01' }));
    const config = { limitePorBloco: 4, limitePorBlocoDomingo: 7, limitePorBlocoSexta: 9 };
    expect(idsDeEstudo(montarFolha({ criancaId: C, data: '2026-11-15', topicos, perguntas: [], config }))).toHaveLength(7);
    expect(idsDeEstudo(montarFolha({ criancaId: C, data: '2026-11-13', topicos, perguntas: [], config }))).toHaveLength(9);
  });

  it('ignora tópicos dominados e de outra criança', () => {
    const topicos = [topico('dom', { dominado: true, proximaRevisao: null }), topico('mf', { criancaId: 'mf' })];
    expect(idsDeEstudo(montarFolha({ criancaId: C, data: '2026-11-10', topicos, perguntas: [] }))).toEqual([]);
  });
});

describe('montarFolha — tipos de folha', () => {
  it('conteúdo novo entra só na folha de Reforço', () => {
    const novo = topico('novo', { caixa: 1, ultimaRevisao: null, ultimoResultado: null, proximaRevisao: '2026-11-10' });
    // 10/11 é terça (Revisão) → não entra; 11/11 é quarta (Reforço) → entra como "Nova".
    expect(idsDeEstudo(montarFolha({ criancaId: C, data: '2026-11-10', topicos: [novo], perguntas: [] }))).toEqual([]);
    const quarta = montarFolha({ criancaId: C, data: '2026-11-11', topicos: [novo], perguntas: [] });
    expect(quarta.itens[0].tipo).toBe('Nova');
  });

  it('sexta (quiz) traz tudo que ficou 🟡/❌ na semana, mesmo sem vencer', () => {
    const topicos = [topico('parcial', { caixa: 4, proximaRevisao: '2026-12-10' }), topico('ok', { caixa: 4, proximaRevisao: '2026-12-10' })];
    const historico = [
      { topicoId: 'parcial', data: '2026-11-10', resultado: 'parcial' },
      { topicoId: 'ok', data: '2026-11-10', resultado: 'acertou' },
    ];
    const folha = montarFolha({ criancaId: C, data: '2026-11-13', topicos, perguntas: [], historico });
    expect(folha.tipoFolha).toBe('quiz');
    expect(idsDeEstudo(folha)).toEqual(['parcial']);
    expect(folha.itens[0].motivo).toBe('quiz');
  });

  it('agenda editável sobrepõe a agenda padrão', () => {
    const agenda = [{ criancaId: C, diaSemana: 2, tipoFolha: 'reforco' }];
    expect(tipoDaFolha(agenda, C, '2026-11-10')).toBe('reforco');
    expect(tipoDaFolha(agenda, 'mf', '2026-11-10')).toBe('revisao');
  });
});

describe('montarFolha — obrigações', () => {
  const obrigacoes = [
    { id: 'o1', criancaId: C, titulo: 'Dar comida ao gato', tipo: 'Animais', periodo: 'noite', dias: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'o2', criancaId: C, titulo: 'Arrumar a cama', tipo: 'Casa', periodo: 'manha', dias: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'o3', criancaId: C, titulo: 'Duolingo', tipo: 'App', periodo: 'tarde', dias: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'o4', criancaId: C, titulo: 'Guardar roupas', tipo: 'Casa', periodo: 'tarde', dias: [5, 6, 0, 1] },
    { id: 'o5', criancaId: C, titulo: 'Leitura 20 min', tipo: 'Leitura', periodo: 'tarde', dias: [1, 2, 3, 4, 5, 0] },
  ];

  it('agrupa por período; apps ficam sem horário e por último', () => {
    const folha = montarFolha({ criancaId: C, data: '2026-11-16', topicos: [], perguntas: [], obrigacoes });
    const casa = folha.itens.filter((i) => i.secao === 'casa');
    expect(casa.map((i) => i.titulo)).toEqual(['Arrumar a cama', 'Guardar roupas', 'Dar comida ao gato', 'Duolingo']);
    expect(casa.at(-1).periodo).toBeNull();
  });

  it('frequência sexta a segunda: roupas não aparecem na terça', () => {
    const folha = montarFolha({ criancaId: C, data: '2026-11-10', topicos: [], perguntas: [], obrigacoes });
    expect(folha.itens.map((i) => i.titulo)).not.toContain('Guardar roupas');
  });

  it('sábado: só casa, animais e apps', () => {
    const folha = montarFolha({ criancaId: C, data: '2026-11-14', topicos: [topico('t', { proximaRevisao: '2026-11-01' })], perguntas: [], obrigacoes });
    expect(folha.itens.every((i) => i.secao === 'casa')).toBe(true);
  });

  it('leitura fica junto do estudo, depois das revisões; ordem é sequencial', () => {
    const folha = montarFolha({ criancaId: C, data: '2026-11-10', topicos: [topico('t')], perguntas: [], obrigacoes });
    expect(folha.itens[0].topicoId).toBe('t');
    expect(folha.itens[1]).toMatchObject({ titulo: 'Leitura 20 min', secao: 'estudo' });
    expect(folha.itens.map((i) => i.ordem)).toEqual(folha.itens.map((_, i) => i + 1));
  });
});

describe('escolherPergunta', () => {
  it('escolhe a usada há mais tempo (nunca usada primeiro)', () => {
    const perguntas = [{ id: 'a', ordem: 1 }, { id: 'b', ordem: 2 }, { id: 'c', ordem: 3 }];
    expect(escolherPergunta(perguntas, { a: '2026-11-01', b: '2026-10-01' }).id).toBe('c');
    expect(escolherPergunta(perguntas, { a: '2026-11-01', b: '2026-10-01', c: '2026-11-05' }).id).toBe('b');
  });
});
