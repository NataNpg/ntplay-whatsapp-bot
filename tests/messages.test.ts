import { describe, expect, it } from 'vitest';
import { APP_PLANS, COMBO, LISTA_PLANS, TESTE } from '../src/catalog';
import {
  DEVICE_PROMPT,
  MAIN_MENU,
  PLAN_MENU,
  attendantAlert,
  orderAlert,
  summaryMessage,
} from '../src/messages';

const NOW = Date.parse('2026-11-14T18:00:00-03:00');

describe('textos', () => {
  it('menu principal tem as 5 opções e preços de entrada', () => {
    for (const line of [
      '1️⃣ Lista IPTV — a partir de R$ 25',
      '2️⃣ App NTPlay — a partir de R$ 5',
      '3️⃣ Combo lista + app (1 mês) — R$ 30',
      '4️⃣ Teste grátis (5 horas)',
      '5️⃣ Falar com atendente',
    ]) {
      expect(MAIN_MENU).toContain(line);
    }
  });

  it('menus de plano mostram todos os preços e o destaque', () => {
    for (const plan of LISTA_PLANS) expect(PLAN_MENU.lista).toContain(plan.label);
    for (const plan of APP_PLANS) expect(PLAN_MENU.app).toContain(plan.label);
    expect(PLAN_MENU.lista).toContain('6 meses — R$ 80 (R$ 13,33/mês) ⭐ o que mais sai');
    expect(PLAN_MENU.app).toContain('6 meses — R$ 25 (R$ 4,17/mês) ⭐ o que mais sai');
    expect(PLAN_MENU.lista).toContain('0️⃣ Voltar');
  });

  it('pergunta de aparelho tem TV Box primeiro', () => {
    expect(DEVICE_PROMPT).toContain('1️⃣ TV Box');
    expect(DEVICE_PROMPT).toContain('2️⃣ TV');
    expect(DEVICE_PROMPT).toContain('3️⃣ Celular');
    expect(DEVICE_PROMPT).toContain('4️⃣ Computador (Windows)');
  });

  it('resumo de lista traz produto, preço e aparelho', () => {
    const text = summaryMessage({
      product: 'lista',
      plan: LISTA_PLANS[2],
      device: 'tvbox',
      priceCents: 8000,
    });
    expect(text).toContain('📦 Lista IPTV — 6 meses');
    expect(text).toContain('💰 R$ 80,00');
    expect(text).toContain('📺 TV Box');
    expect(text).toContain('Já passei para o atendente');
  });

  it('resumo de teste não mostra preço', () => {
    const text = summaryMessage({
      product: 'teste',
      plan: TESTE,
      device: 'celular',
      priceCents: 0,
    });
    expect(text).toContain('🧪 Teste grátis — 5 horas');
    expect(text).not.toContain('💰');
    expect(text).toContain('📱 Celular');
  });

  it('alerta de pedido identifica cliente e item', () => {
    const text = orderAlert({
      name: 'Natanael',
      phone: '5542999999999',
      product: 'combo',
      plan: COMBO,
      priceCents: 3000,
      device: 'windows',
      now: NOW,
    });
    expect(text).toContain('🔔 NOVO PEDIDO');
    expect(text).toContain('Natanael (+5542999999999)');
    expect(text).toContain('Combo lista + app — 1 mês · R$ 30,00');
    expect(text).toContain('💻 Computador (Windows)');
    expect(text).toContain('18:00');
  });

  it('alerta de atendimento não tem pedido', () => {
    const text = attendantAlert({ name: null, phone: '5542999999999', now: NOW });
    expect(text).toContain('🔔 ATENDIMENTO');
    expect(text).toContain('+5542999999999 quer falar com você');
  });
});
