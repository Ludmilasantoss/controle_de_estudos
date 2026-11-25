import { describe, it, expect } from 'vitest';
import { atualizarItem, textoSugestao } from './registroItem.js';

const novo = () => ({ resultado: null, marcas: [], sugerido: false, status: null, observacao: '' });

describe('registro rápido — marcas * e ?', () => {
  it('item com * e resposta certa → o app sugere 🟡 e o adulto consegue trocar para ✅', () => {
    let item = atualizarItem(novo(), { tipo: 'marca', valor: '*' });
    item = atualizarItem(item, { tipo: 'resultado', valor: 'acertou' });
    expect(item.resultado).toBe('parcial');
    expect(item.sugerido).toBe(true);
    expect(textoSugestao(item)).toContain('*');

    item = atualizarItem(item, { tipo: 'resultado', valor: 'acertou' });
    expect(item.resultado).toBe('acertou');
    expect(item.sugerido).toBe(false);
  });

  it('marcar ? depois de ✅ também sugere 🟡', () => {
    let item = atualizarItem(novo(), { tipo: 'resultado', valor: 'acertou' });
    item = atualizarItem(item, { tipo: 'marca', valor: '?' });
    expect(item.resultado).toBe('parcial');
    expect(item.sugerido).toBe(true);
  });

  it('tirar a marca desfaz a sugestão', () => {
    let item = atualizarItem(novo(), { tipo: 'resultado', valor: 'acertou' });
    item = atualizarItem(item, { tipo: 'marca', valor: '*' });
    item = atualizarItem(item, { tipo: 'marca', valor: '*' });
    expect(item.marcas).toEqual([]);
    expect(item.resultado).toBe('acertou');
  });

  it('🟡 escolhido pelo adulto não é desfeito ao tirar a marca', () => {
    let item = atualizarItem(novo(), { tipo: 'marca', valor: '*' });
    item = atualizarItem(item, { tipo: 'resultado', valor: 'parcial' });
    item = atualizarItem(item, { tipo: 'marca', valor: '*' });
    expect(item.resultado).toBe('parcial');
  });

  it('❌ com marca continua ❌', () => {
    let item = atualizarItem(novo(), { tipo: 'marca', valor: '?' });
    item = atualizarItem(item, { tipo: 'resultado', valor: 'errou' });
    expect(item.resultado).toBe('errou');
  });

  it('sem marca, ✅ é ✅ no primeiro toque', () => {
    expect(atualizarItem(novo(), { tipo: 'resultado', valor: 'acertou' }).resultado).toBe('acertou');
  });
});

describe('registro rápido — tarefas', () => {
  it('status alterna com um toque e desmarca com outro', () => {
    let item = atualizarItem(novo(), { tipo: 'status', valor: 'feito' });
    expect(item.status).toBe('feito');
    item = atualizarItem(item, { tipo: 'status', valor: 'feito' });
    expect(item.status).toBeNull();
  });
});
