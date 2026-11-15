import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Device, Plan, Product } from './catalog';
import { emptyContact, type Contact } from './flow';

export interface OrderRow {
  phone: string;
  name: string | null;
  product: Product;
  plan: Plan;
  priceCents: number;
  device: Device | null;
  createdAt: number;
}

interface ContactRecord {
  phone: string;
  name: string | null;
  state: Contact['state'];
  product: Product | null;
  plan: Plan | null;
  device: Device | null;
  paused_until: number | null;
  updated_at: number;
}

export class Store {
  private db: Database.Database;

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        phone TEXT PRIMARY KEY,
        name TEXT,
        state TEXT NOT NULL,
        product TEXT,
        plan TEXT,
        device TEXT,
        paused_until INTEGER,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        name TEXT,
        product TEXT NOT NULL,
        plan TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        device TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  }

  getContact(phone: string): Contact {
    const row = this.db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone) as
      | ContactRecord
      | undefined;
    if (!row) return emptyContact(phone);
    return {
      phone: row.phone,
      name: row.name,
      state: row.state,
      product: row.product,
      plan: row.plan,
      device: row.device,
      pausedUntil: row.paused_until,
      updatedAt: row.updated_at,
    };
  }

  saveContact(contact: Contact): void {
    this.db
      .prepare(
        `INSERT INTO contacts (phone, name, state, product, plan, device, paused_until, updated_at)
         VALUES (@phone, @name, @state, @product, @plan, @device, @pausedUntil, @updatedAt)
         ON CONFLICT(phone) DO UPDATE SET
           name = excluded.name,
           state = excluded.state,
           product = excluded.product,
           plan = excluded.plan,
           device = excluded.device,
           paused_until = excluded.paused_until,
           updated_at = excluded.updated_at`,
      )
      .run(contact);
  }

  insertOrder(order: OrderRow): void {
    this.db
      .prepare(
        `INSERT INTO orders (phone, name, product, plan, price_cents, device, created_at)
         VALUES (@phone, @name, @product, @plan, @priceCents, @device, @createdAt)`,
      )
      .run(order);
  }

  listOrders(): OrderRow[] {
    return this.db
      .prepare(
        `SELECT phone, name, product, plan, price_cents AS priceCents,
                device, created_at AS createdAt
         FROM orders ORDER BY id DESC`,
      )
      .all() as OrderRow[];
  }

  close(): void {
    this.db.close();
  }
}
