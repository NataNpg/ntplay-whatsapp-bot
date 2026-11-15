export interface AppConfig {
  dbPath: string;
  authDir: string;
  alertNumber: string | null;
  pauseHours: number;
  stateTtlMinutes: number;
  logLevel: string;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const alertDigits = (process.env.ALERT_NUMBER ?? '').replace(/\D/g, '');
  return {
    dbPath: process.env.DB_PATH ?? 'data/bot.db',
    authDir: process.env.AUTH_DIR ?? 'auth',
    alertNumber: alertDigits.length > 0 ? alertDigits : null,
    pauseHours: intFromEnv('PAUSE_HOURS', 12),
    stateTtlMinutes: intFromEnv('STATE_TTL_MINUTES', 30),
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
}
