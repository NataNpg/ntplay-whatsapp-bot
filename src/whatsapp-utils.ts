export interface MinimalMessage {
  message?: {
    conversation?: string | null;
    extendedTextMessage?: { text?: string | null } | null;
  } | null;
}

export function extractText(message: MinimalMessage | null | undefined): string | null {
  const content = message?.message;
  if (!content) return null;

  if (typeof content.conversation === 'string' && content.conversation.length > 0) {
    return content.conversation;
  }

  const extended = content.extendedTextMessage?.text;
  return typeof extended === 'string' && extended.length > 0 ? extended : null;
}

export function isIndividualJid(jid: string | null | undefined): jid is string {
  return typeof jid === 'string' && jid.endsWith('@s.whatsapp.net');
}

export function phoneFromJid(jid: string): string {
  return jid.split('@')[0];
}
