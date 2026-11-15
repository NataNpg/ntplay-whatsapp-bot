import { describe, expect, it } from 'vitest';
import { onCustomerMessage, onOwnerMessage, type AppDeps } from '../src/app';
import { Store } from '../src/store';

const PHONE = '5542999999999';
const NOW = Date.parse('2026-11-14T18:00:00-03:00');

function makeDeps() {
  const store = new Store(':memory:');
  const sent: string[] = [];
  const alerts: string[] = [];
  const deps: AppDeps = {
    store,
    pauseHours: 12,
    stateTtlMinutes: 30,
    now: () => NOW,
    sender: {
      sendText: async (_phone, text) => {
        sent.push(text);
      },
      sendAlert: async (text) => {
        alerts.push(text);
      },
    },
  };
  return { deps, store, sent, alerts };
}

describe('orquestração', () => {
  it('pedido completo envia resumo, salva pedido e alerta', async () => {
    const { deps, store, sent, alerts } = makeDeps();
    for (const text of ['oi', '1', '3', '1']) {
      await onCustomerMessage(deps, { phone: PHONE, name: 'Ana', text });
    }
    expect(sent.at(-1)).toContain('📦 Lista IPTV — 6 meses');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('🔔 NOVO PEDIDO');
    expect(alerts[0]).toContain('Ana (+5542999999999)');
    expect(store.listOrders()[0]).toMatchObject({ plan: '6m', priceCents: 8000, device: 'tvbox' });
    expect(store.getContact(PHONE).state).toBe('handoff');
  });

  it('atendente alerta sem criar pedido', async () => {
    const { deps, store, alerts } = makeDeps();
    await onCustomerMessage(deps, { phone: PHONE, name: null, text: 'oi' });
    await onCustomerMessage(deps, { phone: PHONE, name: null, text: '5' });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('🔔 ATENDIMENTO');
    expect(store.listOrders()).toHaveLength(0);
  });

  it('mensagem do dono pausa o bot por 12h', async () => {
    const { deps, store, sent } = makeDeps();
    await onCustomerMessage(deps, { phone: PHONE, name: 'Ana', text: 'oi' });
    sent.length = 0;
    onOwnerMessage(deps, { phone: PHONE });
    await onCustomerMessage(deps, { phone: PHONE, name: 'Ana', text: '1' });
    expect(sent).toEqual([]);
    expect(store.getContact(PHONE).pausedUntil).toBe(NOW + 12 * 3_600_000);
  });

  it('mídia recebe aviso', async () => {
    const { deps, sent } = makeDeps();
    await onCustomerMessage(deps, { phone: PHONE, name: 'Ana', text: '', isMedia: true });
    expect(sent[0]).toBe('Por aqui eu só entendo texto.');
  });
});
