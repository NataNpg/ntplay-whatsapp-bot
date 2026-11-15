import { describe, expect, it } from 'vitest';
import { extractText, isIndividualJid, phoneFromJid, type MinimalMessage } from '../src/whatsapp-utils';

describe('whatsapp-utils', () => {
  it('lê texto simples', () => {
    expect(extractText({ message: { conversation: 'oi' } })).toBe('oi');
  });

  it('lê texto estendido', () => {
    expect(extractText({ message: { extendedTextMessage: { text: 'menu' } } })).toBe('menu');
  });

  it('retorna null para mídia sem texto', () => {
    const media = { message: { imageMessage: {} } } as unknown as MinimalMessage;
    expect(extractText(media)).toBeNull();
  });

  it('retorna null sem mensagem', () => {
    expect(extractText(undefined)).toBeNull();
    expect(extractText({ message: null })).toBeNull();
  });

  it('aceita só conversa individual', () => {
    expect(isIndividualJid('5542999999999@s.whatsapp.net')).toBe(true);
    expect(isIndividualJid('123456@g.us')).toBe(false);
    expect(isIndividualJid('status@broadcast')).toBe(false);
    expect(isIndividualJid(null)).toBe(false);
  });

  it('extrai telefone do jid', () => {
    expect(phoneFromJid('5542999999999@s.whatsapp.net')).toBe('5542999999999');
  });
});
