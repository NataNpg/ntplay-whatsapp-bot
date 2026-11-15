import { describe, expect, it } from 'vitest';
import { emptyContact } from '../src/flow';
import { Store } from '../src/store';

const PHONE = '5542999999999';

describe('store', () => {
  it('devolve contato vazio para número desconhecido', () => {
    const store = new Store(':memory:');
    expect(store.getContact(PHONE)).toEqual(emptyContact(PHONE));
    store.close();
  });

  it('salva e recupera contato', () => {
    const store = new Store(':memory:');
    const contact = {
      ...emptyContact(PHONE),
      name: 'Ana',
      state: 'awaiting_plan' as const,
      product: 'lista' as const,
      updatedAt: 123,
    };
    store.saveContact(contact);
    expect(store.getContact(PHONE)).toEqual(contact);
    store.close();
  });

  it('registra e lista pedidos', () => {
    const store = new Store(':memory:');
    store.insertOrder({
      phone: PHONE,
      name: 'Ana',
      product: 'lista',
      plan: '6m',
      priceCents: 8000,
      device: 'tvbox',
      createdAt: 456,
    });
    expect(store.listOrders()[0]).toMatchObject({
      phone: PHONE,
      name: 'Ana',
      product: 'lista',
      plan: '6m',
      priceCents: 8000,
      device: 'tvbox',
      createdAt: 456,
    });
    store.close();
  });
});
