import { describe, it, expect } from 'vitest';
import { listarPendencias } from './pendencias.js';
import { calcularRecompensa } from './recompensa.js';
import { precisaNovaAula } from './historico.js';
import { inicioDaSemana, somarDias, diaDaSemana } from './datas.js';

describe('pendências', () => {
  const folhas = [
    { id: 'f1', criancaId: 'mf', data: '2026-11-09', registradaEm: null },
    { id: 'f2', criancaId: 'mf', data: '2026-11-10', registradaEm: '2026-11-10T20:00' },
    { id: 'f3', criancaId: 'mf', data: '2026-11-11', registradaEm: null }, // hoje: ainda não é pendência
  ];
  const tarefas = [
    { folhaId: 'f1', ordem: 1, topicoId: 't1', resultado: null },
    { folhaId: 'f1', ordem: 2, titulo: 'Cama', status: null },
    { folhaId: 'f2', ordem: 1, topicoId: 't2', resultado: 'acertou' },
    { folhaId: 'f2', ordem: 2, topicoId: 't3', resultado: null },
    { folhaId: 'f2', ordem: 3, titulo: 'Cama', status: null },
    { folhaId: 'f3', ordem: 1, topicoId: 't4', resultado: null },
  ];

  it('dia sem registro aparece como pendência com todos os itens', () => {
    const p = listarPendencias({ folhas, tarefas, hoje: '2026-11-11' });
    expect(p[0]).toMatchObject({ motivo: 'sem_registro' });
    expect(p[0].folha.id).toBe('f1');
    expect(p[0].itens).toHaveLength(2);
  });

  it('folha registrada com estudo em branco lista só o estudo; folha de hoje não entra', () => {
    const p = listarPendencias({ folhas, tarefas, hoje: '2026-11-11' });
    expect(p).toHaveLength(2);
    expect(p[1]).toMatchObject({ motivo: 'itens_em_branco' });
    expect(p[1].itens.map((i) => i.topicoId)).toEqual(['t3']);
  });

  it('folha dispensada pelo adulto sai da lista', () => {
    const comDispensa = folhas.map((f) => (f.id === 'f1' ? { ...f, dispensada: true } : f));
    const p = listarPendencias({ folhas: comDispensa, tarefas, hoje: '2026-11-11' });
    expect(p.map((x) => x.folha.id)).toEqual(['f2']);
  });
});

describe('recompensa', () => {
  const tarefas = [
    { id: 1, contaRecompensa: true, status: 'feito' },
    { id: 2, contaRecompensa: true, status: 'nao_feito' },
    { id: 3, contaRecompensa: true, status: 'nao_se_aplica' },
    { id: 4, contaRecompensa: false, status: 'feito' },
    { id: 5, contaRecompensa: true, topicoId: 't', resultado: 'errou' },
    { id: 6, contaRecompensa: true, status: null },
  ];

  it('tarefa "Não se aplica" não entra na recompensa', () => {
    const r = calcularRecompensa({ tarefas });
    const na = r.itens.find((i) => i.tarefa.id === 3);
    expect(na.conta).toBe(false);
    expect(na.motivo).toBe('Não se aplica');
    expect(r.contaveis).toBe(4); // 1, 2, 5, 6
    expect(r.feitas).toBe(2); // 1 e 5 (estudo conta por esforço, mesmo com ❌)
  });

  it('fórmula proporcional (padrão) respeita o teto', () => {
    expect(calcularRecompensa({ tarefas }).valor).toBe(10);
    expect(calcularRecompensa({ tarefas: [{ contaRecompensa: true, status: 'feito' }] }).valor).toBe(20);
  });

  it('fórmula por tarefa é configurável e limitada ao teto', () => {
    const config = { recompensa: { formula: 'por_tarefa', valorPorTarefa: 3 } };
    expect(calcularRecompensa({ tarefas, config }).valor).toBe(6);
    const muitas = Array.from({ length: 30 }, () => ({ contaRecompensa: true, status: 'feito' }));
    expect(calcularRecompensa({ tarefas: muitas, config }).valor).toBe(20);
  });
});

describe('histórico e datas', () => {
  it('aviso de nova aula com 3 ou mais voltas para a caixa 1', () => {
    const e = (resultado) => ({ resultado, data: '2026-11-01' });
    expect(precisaNovaAula([e('errou'), e('errou'), e('parcial')])).toBe(false);
    expect(precisaNovaAula([e('errou'), e('errou'), e('errou')])).toBe(true);
  });

  it('semana vai de segunda a domingo', () => {
    expect(inicioDaSemana('2026-11-15')).toBe('2026-11-09'); // domingo → segunda anterior
    expect(inicioDaSemana('2026-11-16')).toBe('2026-11-16');
    expect(diaDaSemana('2026-11-14')).toBe(6);
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});
