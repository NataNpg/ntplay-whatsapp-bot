import 'dotenv/config';
import pino from 'pino';
import { onCustomerMessage, onOwnerMessage, type AppDeps } from './app';
import { loadConfig } from './config';
import { Store } from './store';
import { startWhatsApp } from './whatsapp';

const config = loadConfig();
const logger = pino({ level: config.logLevel });
const store = new Store(config.dbPath);

let deps: AppDeps;

const client = await startWhatsApp({
  authDir: config.authDir,
  alertNumber: config.alertNumber,
  logger,
  onCustomerMessage: async (message) => {
    try {
      await onCustomerMessage(deps, message);
    } catch (error) {
      logger.error({ error }, 'Falha ao processar mensagem');
    }
  },
  onOwnerMessage: (message) => {
    try {
      onOwnerMessage(deps, message);
    } catch (error) {
      logger.error({ error }, 'Falha ao pausar conversa');
    }
  },
});

deps = {
  store,
  sender: client,
  pauseHours: config.pauseHours,
  stateTtlMinutes: config.stateTtlMinutes,
  now: Date.now,
};

logger.info('Bot NTPlay iniciado');

const shutdown = (): void => {
  store.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
