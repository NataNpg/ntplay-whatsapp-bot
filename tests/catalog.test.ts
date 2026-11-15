import { describe, expect, it } from 'vitest';
import {
  APP_PLANS,
  COMBO,
  DEVICES,
  LISTA_PLANS,
  TESTE,
  formatBRL,
  plansFor,
} from '../src/catalog';

describe('catálogo', () => {
  it('formata reais no padrão brasileiro', () => {
    expect(formatBRL(2500)).toBe('R$ 25,00');
    expect(formatBRL(1333)).toBe('R$ 13,33');
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('mantém a tabela de preços aprovada', () => {
    expect(LISTA_PLANS.map((p) => [p.short, p.priceCents])).toEqual([
      ['1 mês', 2500],
      ['3 meses', 4500],
      ['6 meses', 8000],
    ]);
    expect(APP_PLANS.map((p) => [p.short, p.priceCents])).toEqual([
      ['1 mês', 500],
      ['3 meses', 1400],
      ['6 meses', 2500],
    ]);
    expect(COMBO.priceCents).toBe(3000);
    expect(TESTE.priceCents).toBe(0);
  });

  it('lista aparelhos com TV Box primeiro', () => {
    expect(DEVICES.map((d) => d.label)).toEqual([
      'TV Box',
      'TV',
      'Celular',
      'Computador (Windows)',
    ]);
  });

  it('resolve planos por produto', () => {
    expect(plansFor('lista')).toBe(LISTA_PLANS);
    expect(plansFor('app')).toBe(APP_PLANS);
  });
});
