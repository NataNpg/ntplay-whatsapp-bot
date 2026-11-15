import { handleMessage, type Contact } from './flow';
import { attendantAlert, orderAlert } from './messages';
import type { Store } from './store';

export interface MessageSender {
  sendText(phone: string, text: string): Promise<void>;
  sendAlert(text: string): Promise<void>;
}

export interface AppDeps {
  store: Store;
  sender: MessageSender;
  pauseHours: number;
  stateTtlMinutes: number;
  now: () => number;
}

export interface IncomingMessage {
  phone: string;
  name: string | null;
  text: string;
  isMedia?: boolean;
}

const HOUR_MS = 3_600_000;

export async function onCustomerMessage(deps: AppDeps, input: IncomingMessage): Promise<void> {
  const now = deps.now();
  const existing = deps.store.getContact(input.phone);
  const contact: Contact = { ...existing, name: input.name ?? existing.name };

  const result = handleMessage({
    contact,
    text: input.text,
    isMedia: input.isMedia,
    now,
    pauseHours: deps.pauseHours,
    stateTtlMinutes: deps.stateTtlMinutes,
  });

  deps.store.saveContact(result.contact);

  for (const reply of result.replies) {
    await deps.sender.sendText(input.phone, reply);
  }

  if (!result.handoff) return;

  const { order } = result.handoff;
  if (!order) {
    await deps.sender.sendAlert(
      attendantAlert({ name: result.contact.name, phone: input.phone, now }),
    );
    return;
  }

  deps.store.insertOrder({
    phone: input.phone,
    name: result.contact.name,
    product: order.product,
    plan: order.plan.id,
    priceCents: order.priceCents,
    device: order.device,
    createdAt: now,
  });

  await deps.sender.sendAlert(
    orderAlert({
      name: result.contact.name,
      phone: input.phone,
      product: order.product,
      plan: order.plan,
      priceCents: order.priceCents,
      device: order.device,
      now,
    }),
  );
}

export function onOwnerMessage(deps: AppDeps, input: { phone: string }): void {
  const now = deps.now();
  const contact = deps.store.getContact(input.phone);
  deps.store.saveContact({
    ...contact,
    pausedUntil: now + deps.pauseHours * HOUR_MS,
    updatedAt: now,
  });
}
