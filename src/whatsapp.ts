import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from '@whiskeysockets/baileys';
import { mkdirSync } from 'node:fs';
import type { Logger } from 'pino';
import QRCode from 'qrcode';
import qrcode from 'qrcode-terminal';
import { extractText, isIndividualJid, phoneFromJid } from './whatsapp-utils';

export interface IncomingCustomerMessage {
  phone: string;
  name: string | null;
  text: string;
  isMedia: boolean;
}

export interface WhatsAppOptions {
  authDir: string;
  alertNumber: string | null;
  logger: Logger;
  onCustomerMessage: (message: IncomingCustomerMessage) => Promise<void>;
  onOwnerMessage: (message: { phone: string }) => void;
  onOpen?: () => void;
}

export interface WhatsAppClient {
  sendText(phone: string, text: string): Promise<void>;
  sendAlert(text: string): Promise<void>;
}

export async function startWhatsApp(options: WhatsAppOptions): Promise<WhatsAppClient> {
  mkdirSync(options.authDir, { recursive: true });

  const sentIds = new Set<string>();
  const seenIds = new Set<string>();
  let sock: WASocket | null = null;
  let reconnecting = false;

  const remember = (set: Set<string>, id: string): void => {
    set.add(id);
    if (set.size > 2000) set.clear();
  };

  const handleMessage = (message: WAMessage): void => {
    const jid = message.key.remoteJid;
    const id = message.key.id;
    if (!id || !isIndividualJid(jid)) return;
    if (seenIds.has(id)) return;
    remember(seenIds, id);

    const phone = phoneFromJid(jid);

    if (message.key.fromMe) {
      if (sentIds.has(id)) return;
      options.onOwnerMessage({ phone });
      return;
    }

    const text = extractText(message);
    void options
      .onCustomerMessage({
        phone,
        name: message.pushName ?? null,
        text: text ?? '',
        isMedia: text === null,
      })
      .catch((error: unknown) => options.logger.error({ error, phone }, 'Falha ao tratar mensagem'));
  };

  async function connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(options.authDir);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: state,
      logger: options.logger,
      browser: Browsers.ubuntu('NTPlay Atendimento'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    sock = socket;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
      if (update.qr) {
        qrcode.generate(update.qr, { small: true });
        void QRCode.toFile(`${options.authDir}/qr.png`, update.qr);
        options.logger.info('QR gerado: escaneie com o WhatsApp (também salvo em auth/qr.png)');
      }

      if (update.connection === 'open') {
        options.logger.info('WhatsApp conectado');
        options.onOpen?.();
      }

      if (update.connection === 'close') {
        sock = null;
        const statusCode = (
          update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
        )?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          options.logger.error(
            'Sessão encerrada pelo WhatsApp. Rode "npm run login" e escaneie o QR novamente.',
          );
          process.exit(0);
        }

        if (!reconnecting) {
          reconnecting = true;
          options.logger.warn({ statusCode }, 'Conexão caiu; reconectando em 3s');
          setTimeout(() => {
            reconnecting = false;
            void connect();
          }, 3000);
        }
      }
    });

    socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages) handleMessage(message);
    });
  }

  await connect();

  const send = async (jid: string, text: string): Promise<void> => {
    if (!sock) throw new Error('WhatsApp não conectado');
    const sent = await sock.sendMessage(jid, { text });
    const id = sent?.key.id;
    if (id) remember(sentIds, id);
  };

  return {
    sendText: (phone, text) => send(`${phone}@s.whatsapp.net`, text),
    sendAlert: async (text) => {
      const target = options.alertNumber
        ? `${options.alertNumber}@s.whatsapp.net`
        : jidNormalizedUser(sock?.user?.id ?? '');
      if (!target) throw new Error('Número de alerta indisponível');
      await send(target, text);
    },
  };
}
