export interface TrackedOrder {
  id: string;
  createdAt: number;
  city: string;
  itemCount: number;
  totalMad: number;
}

export const TRACKED_ORDERS_KEY = 'vyro_recent_orders';

export function readTrackedOrders(): TrackedOrder[] {
  try {
    const stored = sessionStorage.getItem(TRACKED_ORDERS_KEY);
    const orders = stored ? JSON.parse(stored) : [];
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

export function writeTrackedOrder(order: TrackedOrder): TrackedOrder[] {
  const orders = [order, ...readTrackedOrders().filter((entry) => entry.id !== order.id)].slice(0, 8);
  try {
    sessionStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Tracking remains available for the current mounted session if storage is disabled.
  }
  return orders;
}

export const ORDER_STAGES = [
  'Order Confirmed',
  'Quality Check & Packing',
  'Out for Express Delivery',
  'Delivered',
] as const;

export function orderStageIndex(order: TrackedOrder, now = Date.now()): number {
  const elapsedHours = Math.max(0, (now - order.createdAt) / 3_600_000);
  if (now >= estimatedDelivery(order).getTime()) return 3;
  if (elapsedHours >= 12) return 2;
  if (elapsedHours >= 1) return 1;
  return 0;
}

export function estimatedDelivery(order: TrackedOrder): Date {
  const deliveryDays: Record<string, number> = {
    Casablanca: 2,
    Rabat: 2,
    Marrakech: 2,
    Tanger: 2,
    Agadir: 3,
    'Fès': 3,
    'Meknès': 3,
    Oujda: 4,
  };
  const days = deliveryDays[order.city] ?? 3;
  return new Date(order.createdAt + days * 24 * 60 * 60 * 1000);
}
