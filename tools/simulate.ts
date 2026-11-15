import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { emptyContact, handleMessage, type Contact } from '../src/flow';
import { attendantAlert, orderAlert } from '../src/messages';

const PHONE = '5542999999999';
const NAME = 'Cliente Simulado';

async function main(): Promise<void> {
  let contact: Contact = emptyContact(PHONE);
  let now = Date.now();
  const rl = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });

  console.log('Simulador NTPlay. Digite como cliente (Ctrl+C para sair).\n');
  rl.setPrompt('cliente> ');
  rl.prompt();

  for await (const line of rl) {
    now += 1000;
    const result = handleMessage({
      contact,
      text: line,
      now,
      pauseHours: 12,
      stateTtlMinutes: 30,
    });
    contact = result.contact;

    for (const reply of result.replies) {
      console.log(`\nbot> ${reply}\n`);
    }

    const order = result.handoff?.order;

    if (order) {
      console.log(
        `\n[alerta para o dono]\n${orderAlert({
          name: NAME,
          phone: PHONE,
          product: order.product,
          plan: order.plan,
          priceCents: order.priceCents,
          device: order.device,
          now,
        })}\n`,
      );
    } else if (result.handoff) {
      console.log(`\n[alerta para o dono]\n${attendantAlert({ name: NAME, phone: PHONE, now })}\n`);
    }

    rl.prompt();
  }

  rl.close();
}

void main();
