export type Product = 'lista' | 'app' | 'combo' | 'teste';
export type Plan = '1m' | '3m' | '6m' | 'combo_1m' | 'teste_5h';
export type Device = 'tvbox' | 'tv' | 'celular' | 'windows';

export interface PlanOption {
  id: Plan;
  short: string;
  label: string;
  priceCents: number;
  note?: string;
}

export const LISTA_PLANS: PlanOption[] = [
  { id: '1m', short: '1 mês', label: '1 mês — R$ 25', priceCents: 2500 },
  { id: '3m', short: '3 meses', label: '3 meses — R$ 45 (R$ 15/mês)', priceCents: 4500 },
  {
    id: '6m',
    short: '6 meses',
    label: '6 meses — R$ 80 (R$ 13,33/mês)',
    priceCents: 8000,
    note: 'o que mais sai',
  },
];

export const APP_PLANS: PlanOption[] = [
  { id: '1m', short: '1 mês', label: '1 mês — R$ 5', priceCents: 500 },
  { id: '3m', short: '3 meses', label: '3 meses — R$ 14 (R$ 4,67/mês)', priceCents: 1400 },
  {
    id: '6m',
    short: '6 meses',
    label: '6 meses — R$ 25 (R$ 4,17/mês)',
    priceCents: 2500,
    note: 'o que mais sai',
  },
];

export const COMBO: PlanOption = {
  id: 'combo_1m',
  short: '1 mês',
  label: 'Combo lista + app — 1 mês',
  priceCents: 3000,
};

export const TESTE: PlanOption = {
  id: 'teste_5h',
  short: '5 horas',
  label: 'Teste grátis — 5 horas',
  priceCents: 0,
};

export const DEVICES: Array<{ id: Device; label: string; emoji: string }> = [
  { id: 'tvbox', label: 'TV Box', emoji: '📺' },
  { id: 'tv', label: 'TV', emoji: '📺' },
  { id: 'celular', label: 'Celular', emoji: '📱' },
  { id: 'windows', label: 'Computador (Windows)', emoji: '💻' },
];

export const PRODUCT_LABELS: Record<Product, string> = {
  lista: 'Lista IPTV',
  app: 'App NTPlay',
  combo: 'Combo lista + app',
  teste: 'Teste grátis',
};

export function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export function plansFor(product: 'lista' | 'app'): PlanOption[] {
  return product === 'lista' ? LISTA_PLANS : APP_PLANS;
}
