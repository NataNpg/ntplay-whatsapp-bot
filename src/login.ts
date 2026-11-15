import 'dotenv/config';
import pino from 'pino';
import { loadConfig } from './config';
import { startWhatsApp } from './whatsapp';

const config = loadConfig();
const logger = pino({ level: config.logLevel });

await startWhatsApp({
  authDir: config.authDir,
  alertNumber: config.alertNumber,
  logger,
  onCustomerMessage: async () => {},
  onOwnerMessage: () => {},
  onOpen: () => {
    logger.info('Login concluído. A sessão está salva em auth/.');
    setTimeout(() => process.exit(0), 2000);
  },
});
