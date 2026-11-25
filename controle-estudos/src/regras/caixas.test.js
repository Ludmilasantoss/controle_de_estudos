import { describe, it, expect } from 'vitest';
import { aplicarResultado, definirCaixaManual, INTERVALOS } from './caixas.js';

describe('motor de caixas — critérios de aceite', () => {
  it('caixa 2, revisado em 10/11 com ✅ → caixa 3, próxima revisão 17/11', () => {
    const r = aplicarResultado({ caixa: 2 }, 'acertou', '2026-11-10');
    expect(r.caixa).toBe(3);
    expect(r.proximaRevisao).toBe('2026-11-17');
    expect(r.dominado).toBe(false);
  });

  it('caixa 4 com 🟡 em 10/11 → continua na caixa 4, próxima revisão 10/12', () => {
    const r = aplicarResultado({ caixa: 4 }, 'parcial', '2026-11-10');
    expect(r.caixa).toBe(4);
    expect(r.proximaRevisao).toBe('2026-12-10');
  });

  it.each([1, 2, 3, 4, 5, 6, 7])('caixa %i com ❌ em 10/11 → caixa 1, próxima revisão 11/11', (caixa) => {
    const r = aplicarResultado({ caixa }, 'errou', '2026-11-10');
    expect(r.caixa).toBe(1);
    expect(r.proximaRevisao).toBe('2026-11-11');
  });

  it('caixa 7 com ✅ → "Dominado", sem próxima revisão', () => {
    const r = aplicarResultado({ caixa: 7 }, 'acertou', '2026-11-10');
    expect(r.dominado).toBe(true);
    expect(r.proximaRevisao).toBeNull();
  });
});

describe('motor de caixas — demais regras', () => {
  it('✅ usa o intervalo da NOVA caixa em todas as caixas', () => {
    for (let caixa = 1; caixa <= 6; caixa++) {
      const r = aplicarResultado({ caixa }, 'acertou', '2026-01-01');
      expect(r.caixa).toBe(caixa + 1);
      const esperado = new Date(Date.UTC(2026, 0, 1 + INTERVALOS[caixa + 1])).toISOString().slice(0, 10);
      expect(r.proximaRevisao).toBe(esperado);
    }
  });

  it('pendente não muda nada', () => {
    const topico = { caixa: 3, proximaRevisao: '2026-11-10', ultimaRevisao: '2026-11-03', ultimoResultado: 'acertou' };
    const r = aplicarResultado(topico, 'pendente', '2026-11-10');
    expect(r).toEqual({ ...topico, dominado: false });
  });

  it('não altera o objeto recebido', () => {
    const topico = Object.freeze({ caixa: 2 });
    expect(() => aplicarResultado(topico, 'acertou', '2026-11-10')).not.toThrow();
  });

  it('guarda a data e o último resultado', () => {
    const r = aplicarResultado({ caixa: 2 }, 'errou', '2026-11-10');
    expect(r.ultimaRevisao).toBe('2026-11-10');
    expect(r.ultimoResultado).toBe('errou');
  });

  it('correção manual da caixa recalcula a próxima revisão', () => {
    expect(definirCaixaManual(4, '2026-11-10')).toEqual({ caixa: 4, dominado: false, proximaRevisao: '2026-12-10' });
    expect(definirCaixaManual(99, '2026-11-10').caixa).toBe(7);
  });
});
