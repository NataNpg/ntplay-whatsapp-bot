import { describe, expect, it } from 'vitest';
import { COMBO, LISTA_PLANS } from '../src/catalog';
import { emptyContact, handleMessage, type Contact, type FlowResult } from '../src/flow';
import {
  ATTENDANT_REPLY,
  COMBO_MESSAGE,
  DEVICE_PROMPT,
  INVALID_DEVICE,
  INVALID_OPTION,
  MAIN_MENU,
  MEDIA_REPLY,
  PLAN_MENU,
  TEST_MESSAGE,
} from '../src/messages';

const PHONE = '5542999999999';
const NOW = Date.parse('2026-11-14T18:00:00-03:00');

function run(
  script: string[],
  options?: { contact?: Contact; now?: number; isMediaIndex?: number },
): { contact: Contact; replies: string[]; handoff: FlowResult['handoff'] } {
  let contact = options?.contact ?? emptyContact(PHONE);
  let now = options?.now ?? NOW;
  const replies: string[] = [];
  let handoff: FlowResult['handoff'] = null;
  script.forEach((text, index) => {
    const result = handleMessage({
      contact,
      text,
      isMedia: options?.isMediaIndex === index,
      now,
      pauseHours: 12,
      stateTtlMinutes: 30,
    });
    contact = result.contact;
    replies.push(...result.replies);
    if (result.handoff) handoff = result.handoff;
    now += 1000;
  });
  return { contact, replies, handoff };
}

describe('fluxo', () => {
  it('saudação abre o menu e fica no estado menu', () => {
    const { contact, replies } = run(['oi']);
    expect(replies).toEqual([MAIN_MENU]);
    expect(contact.state).toBe('menu');
  });

  it('lista 6 meses + TV Box gera pedido e pausa', () => {
    const { contact, replies, handoff } = run(['oi', '1', '3', '1']);
    expect(replies[1]).toBe(PLAN_MENU.lista);
    expect(replies[2]).toBe(DEVICE_PROMPT);
    expect(replies.at(-1)).toContain('📦 Lista IPTV — 6 meses');
    expect(replies.at(-1)).toContain('💰 R$ 80,00');
    expect(replies.at(-1)).toContain('📺 TV Box');
    expect(handoff?.order).toMatchObject({ product: 'lista', priceCents: 8000, device: 'tvbox' });
    expect(handoff?.order?.plan).toBe(LISTA_PLANS[2]);
    expect(contact.state).toBe('handoff');
    expect(contact.pausedUntil).toBe(NOW + 3 * 1000 + 12 * 3_600_000);
  });

  it('app 3 meses + celular', () => {
    const { replies, handoff } = run(['oi', '2', '2', '3']);
    expect(replies[1]).toBe(PLAN_MENU.app);
    expect(replies.at(-1)).toContain('App NTPlay — 3 meses');
    expect(replies.at(-1)).toContain('💰 R$ 14,00');
    expect(replies.at(-1)).toContain('📱 Celular');
    expect(handoff?.order).toMatchObject({ product: 'app', priceCents: 1400, device: 'celular' });
  });

  it('combo mostra a mensagem própria e TV', () => {
    const { replies, handoff } = run(['oi', '3', '2']);
    expect(replies[1]).toBe(COMBO_MESSAGE);
    expect(replies.at(-1)).toContain('Combo lista + app — 1 mês');
    expect(replies.at(-1)).toContain('💰 R$ 30,00');
    expect(replies.at(-1)).toContain('📺 TV');
    expect(handoff?.order).toMatchObject({
      product: 'combo',
      priceCents: COMBO.priceCents,
      device: 'tv',
    });
  });

  it('teste de 5 horas sem preço', () => {
    const { replies, handoff } = run(['oi', '4', '3']);
    expect(replies[1]).toBe(TEST_MESSAGE);
    expect(replies.at(-1)).toContain('🧪 Teste grátis — 5 horas');
    expect(replies.at(-1)).not.toContain('💰');
    expect(handoff?.order).toMatchObject({ product: 'teste', priceCents: 0, device: 'celular' });
  });

  it('atendente faz handoff sem pedido', () => {
    const { replies, handoff, contact } = run(['oi', '5']);
    expect(replies).toEqual([MAIN_MENU, ATTENDANT_REPLY]);
    expect(handoff).toEqual({ order: null });
    expect(contact.state).toBe('handoff');
  });

  it('opção inválida repete o menu', () => {
    const { replies } = run(['oi', '9']);
    expect(replies).toEqual([MAIN_MENU, INVALID_OPTION, MAIN_MENU]);
  });

  it('0 volta ao menu principal', () => {
    const { replies, contact } = run(['oi', '1', '0']);
    expect(replies.at(-1)).toBe(MAIN_MENU);
    expect(contact.state).toBe('menu');
  });

  it('aparelho inválido repete a pergunta', () => {
    const { replies } = run(['oi', '1', '1', '9']);
    expect(replies.at(-2)).toBe(INVALID_DEVICE);
    expect(replies.at(-1)).toBe(DEVICE_PROMPT);
  });

  it('mídia recebe aviso e o menu atual', () => {
    const { replies, contact } = run(['oi', '1', ''], { isMediaIndex: 2 });
    expect(replies.slice(-2)).toEqual([MEDIA_REPLY, PLAN_MENU.lista]);
    expect(contact.state).toBe('awaiting_plan');
  });

  it('pausa ignora o cliente, mas menu volta', () => {
    const paused: Contact = {
      ...emptyContact(PHONE),
      state: 'handoff',
      pausedUntil: NOW + 60_000,
      updatedAt: NOW,
    };
    const silent = handleMessage({
      contact: paused,
      text: 'oi',
      now: NOW + 1000,
      pauseHours: 12,
      stateTtlMinutes: 30,
    });
    expect(silent.replies).toEqual([]);
    const resumed = handleMessage({
      contact: silent.contact,
      text: 'menu',
      now: NOW + 2000,
      pauseHours: 12,
      stateTtlMinutes: 30,
    });
    expect(resumed.replies).toEqual([MAIN_MENU]);
    expect(resumed.contact.pausedUntil).toBeNull();
  });

  it('fluxo abandonado por 30min recomeça no menu', () => {
    const contact: Contact = { ...emptyContact(PHONE), state: 'menu', updatedAt: NOW };
    const result = handleMessage({
      contact,
      text: '1',
      now: NOW + 31 * 60_000,
      pauseHours: 12,
      stateTtlMinutes: 30,
    });
    expect(result.replies).toEqual([MAIN_MENU]);
    expect(result.contact.state).toBe('menu');
  });

  it('saudação no meio do fluxo reinicia', () => {
    const { replies, contact } = run(['oi', '1', 'oi']);
    expect(replies.at(-1)).toBe(MAIN_MENU);
    expect(contact.state).toBe('menu');
  });

  it('aceita keycap como dígito', () => {
    const { replies } = run(['oi', '1️⃣', '3️⃣', '1️⃣']);
    expect(replies.at(-1)).toContain('📦 Lista IPTV — 6 meses');
  });
});
