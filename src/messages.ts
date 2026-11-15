import {
  APP_PLANS,
  DEVICES,
  LISTA_PLANS,
  PRODUCT_LABELS,
  formatBRL,
  type Device,
  type PlanOption,
  type Product,
} from './catalog';

const KEYCAPS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

function planLines(plans: PlanOption[]): string {
  return plans
    .map((plan, index) => `${KEYCAPS[index]} ${plan.label}${plan.note ? ` ⭐ ${plan.note}` : ''}`)
    .join('\n');
}

export const MAIN_MENU = `Oi! 👋 Aqui é a NTPlay.

1️⃣ Lista IPTV — a partir de R$ 25
2️⃣ App NTPlay — a partir de R$ 5
3️⃣ Combo lista + app (1 mês) — R$ 30
4️⃣ Teste grátis (5 horas)
5️⃣ Falar com atendente

Responda com o número da opção.`;

export const PLAN_MENU: Record<'lista' | 'app', string> = {
  lista: `Lista IPTV 🎬

${planLines(LISTA_PLANS)}
0️⃣ Voltar

Responda com o número do plano.`,
  app: `App NTPlay 📱

${planLines(APP_PLANS)}
0️⃣ Voltar

Responda com o número do plano.`,
};

export const DEVICE_PROMPT = `Onde você vai assistir?

${DEVICES.map((device, index) => `${KEYCAPS[index]} ${device.label}`).join('\n')}`;

export const COMBO_MESSAGE = `Combo lista + app — 1 mês — R$ 30

Inclui a Lista IPTV e o aplicativo NTPlay por 1 mês.

${DEVICE_PROMPT}`;

export const TEST_MESSAGE = `O teste é grátis e dura 5 horas.

${DEVICE_PROMPT}`;

export const INVALID_OPTION = 'Digite só o número da opção.';
export const INVALID_PLAN = 'Digite só o número do plano.';
export const INVALID_DEVICE = 'Digite só o número do aparelho.';
export const MEDIA_REPLY = 'Por aqui eu só entendo texto.';
export const ATTENDANT_REPLY = 'Já chamei o atendente, ele continua daqui. 👋';

function deviceOf(id: Device): { emoji: string; label: string } {
  const device = DEVICES.find((candidate) => candidate.id === id);
  if (!device) throw new Error(`Aparelho desconhecido: ${id}`);
  return device;
}

export function timeBR(now: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(now));
}

export function summaryMessage(input: {
  product: Product;
  plan: PlanOption;
  device: Device;
  priceCents: number;
}): string {
  const device = deviceOf(input.device);
  const icon = input.product === 'teste' ? '🧪' : '📦';
  const productLine = `${icon} ${PRODUCT_LABELS[input.product]} — ${input.plan.short}`;
  const priceLine = input.product === 'teste' ? '' : `\n💰 ${formatBRL(input.priceCents)}`;
  return `Pedido anotado ✅\n${productLine}${priceLine}\n${device.emoji} ${device.label}\nJá passei para o atendente, ele continua daqui. 👋`;
}

export function orderAlert(input: {
  name: string | null;
  phone: string;
  product: Product;
  plan: PlanOption;
  priceCents: number;
  device: Device;
  now: number;
}): string {
  const device = deviceOf(input.device);
  const who = input.name ? `${input.name} (+${input.phone})` : `+${input.phone}`;
  const icon = input.product === 'teste' ? '🧪' : '📦';
  const price = input.product === 'teste' ? '' : ` · ${formatBRL(input.priceCents)}`;
  return `🔔 NOVO PEDIDO\nCliente: ${who}\n${icon} ${PRODUCT_LABELS[input.product]} — ${input.plan.short}${price}\n${device.emoji} ${device.label}\n${timeBR(input.now)}`;
}

export function attendantAlert(input: {
  name: string | null;
  phone: string;
  now: number;
}): string {
  const who = input.name ? `${input.name} (+${input.phone})` : `+${input.phone}`;
  return `🔔 ATENDIMENTO\nCliente: ${who} quer falar com você.\n${timeBR(input.now)}`;
}
