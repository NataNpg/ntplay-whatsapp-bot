import {
  COMBO,
  DEVICES,
  TESTE,
  plansFor,
  type Device,
  type Plan,
  type PlanOption,
  type Product,
} from './catalog';
import {
  ATTENDANT_REPLY,
  COMBO_MESSAGE,
  DEVICE_PROMPT,
  INVALID_DEVICE,
  INVALID_OPTION,
  INVALID_PLAN,
  MAIN_MENU,
  MEDIA_REPLY,
  PLAN_MENU,
  TEST_MESSAGE,
  summaryMessage,
} from './messages';

export type ContactState = 'idle' | 'menu' | 'awaiting_plan' | 'awaiting_device' | 'handoff';

export interface Contact {
  phone: string;
  name: string | null;
  state: ContactState;
  product: Product | null;
  plan: Plan | null;
  device: Device | null;
  pausedUntil: number | null;
  updatedAt: number;
}

export interface OrderDraft {
  product: Product;
  plan: PlanOption;
  priceCents: number;
  device: Device;
}

export interface FlowInput {
  contact: Contact;
  text: string;
  now: number;
  pauseHours: number;
  stateTtlMinutes: number;
  isMedia?: boolean;
}

export interface FlowResult {
  contact: Contact;
  replies: string[];
  handoff: { order: OrderDraft | null } | null;
}

const GREETINGS = new Set([
  'oi',
  'ola',
  'olá',
  'bom dia',
  'boa tarde',
  'boa noite',
  'start',
  'menu',
  '#menu',
]);
const HOUR_MS = 3_600_000;

export function emptyContact(phone: string): Contact {
  return {
    phone,
    name: null,
    state: 'idle',
    product: null,
    plan: null,
    device: null,
    pausedUntil: null,
    updatedAt: 0,
  };
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[\uFE0F\u20E3]/g, '');
}

function digitOf(text: string): string | null {
  const normalized = normalize(text);
  return /^[0-9]$/.test(normalized) ? normalized : null;
}

function reset(contact: Contact, now: number): Contact {
  return {
    ...contact,
    state: 'menu',
    product: null,
    plan: null,
    device: null,
    pausedUntil: null,
    updatedAt: now,
  };
}

function currentMenu(state: ContactState, product: Product | null): string {
  if (state === 'awaiting_plan') return product === 'app' ? PLAN_MENU.app : PLAN_MENU.lista;
  if (state === 'awaiting_device') return DEVICE_PROMPT;
  return MAIN_MENU;
}

function buildOrder(contact: Contact, device: Device): OrderDraft {
  if (contact.product === 'combo') {
    return { product: 'combo', plan: COMBO, priceCents: COMBO.priceCents, device };
  }
  if (contact.product === 'teste') {
    return { product: 'teste', plan: TESTE, priceCents: TESTE.priceCents, device };
  }
  const product: 'lista' | 'app' = contact.product === 'app' ? 'app' : 'lista';
  const plan = plansFor(product).find((option) => option.id === contact.plan);
  if (!plan) throw new Error(`Plano inválido para ${product}: ${contact.plan}`);
  return { product, plan, priceCents: plan.priceCents, device };
}

export function handleMessage(input: FlowInput): FlowResult {
  const { now, pauseHours, stateTtlMinutes } = input;
  const contact = input.contact;
  const text = normalize(input.text);
  const isMenuCommand = text === 'menu' || text === '#menu';
  const paused = contact.pausedUntil !== null && contact.pausedUntil > now;

  if (paused && !isMenuCommand) {
    return { contact, replies: [], handoff: null };
  }

  if (isMenuCommand || GREETINGS.has(text)) {
    return { contact: reset(contact, now), replies: [MAIN_MENU], handoff: null };
  }

  const expired = now - contact.updatedAt > stateTtlMinutes * 60_000;
  const state: ContactState = expired ? 'idle' : contact.state;

  if (input.isMedia) {
    return {
      contact: { ...contact, updatedAt: now },
      replies: [MEDIA_REPLY, currentMenu(state, contact.product)],
      handoff: null,
    };
  }

  if (state === 'idle' || state === 'handoff') {
    return { contact: reset(contact, now), replies: [MAIN_MENU], handoff: null };
  }

  if (state === 'menu') {
    switch (digitOf(input.text)) {
      case '1':
        return {
          contact: {
            ...contact,
            state: 'awaiting_plan',
            product: 'lista',
            plan: null,
            device: null,
            updatedAt: now,
          },
          replies: [PLAN_MENU.lista],
          handoff: null,
        };
      case '2':
        return {
          contact: {
            ...contact,
            state: 'awaiting_plan',
            product: 'app',
            plan: null,
            device: null,
            updatedAt: now,
          },
          replies: [PLAN_MENU.app],
          handoff: null,
        };
      case '3':
        return {
          contact: {
            ...contact,
            state: 'awaiting_device',
            product: 'combo',
            plan: 'combo_1m',
            device: null,
            updatedAt: now,
          },
          replies: [COMBO_MESSAGE],
          handoff: null,
        };
      case '4':
        return {
          contact: {
            ...contact,
            state: 'awaiting_device',
            product: 'teste',
            plan: 'teste_5h',
            device: null,
            updatedAt: now,
          },
          replies: [TEST_MESSAGE],
          handoff: null,
        };
      case '5':
        return {
          contact: {
            ...contact,
            state: 'handoff',
            pausedUntil: now + pauseHours * HOUR_MS,
            updatedAt: now,
          },
          replies: [ATTENDANT_REPLY],
          handoff: { order: null },
        };
      default:
        return {
          contact: { ...contact, updatedAt: now },
          replies: [INVALID_OPTION, MAIN_MENU],
          handoff: null,
        };
    }
  }

  if (state === 'awaiting_plan') {
    const product: 'lista' | 'app' = contact.product === 'app' ? 'app' : 'lista';
    const option = digitOf(input.text);
    if (option === '0') {
      return { contact: reset(contact, now), replies: [MAIN_MENU], handoff: null };
    }
    const plan = option === null ? undefined : plansFor(product)[Number(option) - 1];
    if (!plan) {
      return {
        contact: { ...contact, updatedAt: now },
        replies: [INVALID_PLAN, PLAN_MENU[product]],
        handoff: null,
      };
    }
    return {
      contact: { ...contact, state: 'awaiting_device', plan: plan.id, updatedAt: now },
      replies: [DEVICE_PROMPT],
      handoff: null,
    };
  }

  if (state === 'awaiting_device') {
    const option = digitOf(input.text);
    const device = option === null ? undefined : DEVICES[Number(option) - 1];
    if (!device) {
      return {
        contact: { ...contact, updatedAt: now },
        replies: [INVALID_DEVICE, DEVICE_PROMPT],
        handoff: null,
      };
    }
    const order = buildOrder(contact, device.id);
    return {
      contact: {
        ...contact,
        state: 'handoff',
        device: device.id,
        pausedUntil: now + pauseHours * HOUR_MS,
        updatedAt: now,
      },
      replies: [
        summaryMessage({
          product: order.product,
          plan: order.plan,
          device: order.device,
          priceCents: order.priceCents,
        }),
      ],
      handoff: { order },
    };
  }

  return { contact: reset(contact, now), replies: [MAIN_MENU], handoff: null };
}
