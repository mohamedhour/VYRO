const PROMO_CUSTOMER_ID_KEY = 'vyro_promo_customer_id';

export function getPromoCustomerId(): string {
  try {
    const existing = localStorage.getItem(PROMO_CUSTOMER_ID_KEY);
    if (existing) return existing;
    const id = globalThis.crypto?.randomUUID?.()
      ?? `vyro-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PROMO_CUSTOMER_ID_KEY, id);
    return id;
  } catch {
    return `vyro-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }
}

export async function reserveHourPromo(): Promise<{ remaining: number }> {
  const response = await fetch('/api/promotions/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code: 'HOUR', customerId: getPromoCustomerId() }),
  });
  const body = await response.json().catch(() => ({})) as {
    valid?: boolean;
    remaining?: number;
    error?: string;
  };
  if (!response.ok || !body.valid) {
    throw new Error(body.error || 'Promo validation is temporarily unavailable.');
  }
  return { remaining: Number(body.remaining) || 0 };
}
