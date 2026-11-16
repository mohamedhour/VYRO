import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, MapPin, PackageCheck, Truck, X } from 'lucide-react';
import { estimatedDelivery, ORDER_STAGES, orderStageIndex, TrackedOrder } from '../lib/orderTracking';

interface OrderTrackingModalProps {
  orders: TrackedOrder[];
  onClose: () => void;
}

const STAGE_ICONS = [Check, PackageCheck, Truck, Check];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ orders, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const order = useMemo(
    () => orders.find((entry) => entry.id.toLowerCase() === lookupId.trim().toLowerCase()),
    [orders, lookupId]
  );
  const stage = order ? orderStageIndex(order, now) : -1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="track-order-title">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E16] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">VYRO FASHION</p>
            <h2 id="track-order-title" className="mt-1 font-display text-lg font-bold text-white">Track your order</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close tracking" className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-5 p-5">
          <form onSubmit={(event) => { event.preventDefault(); setLookupId(orderId); }} className="flex gap-2">
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Enter order ID (e.g. VY-1234)" aria-label="Order ID" className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none" />
            <button className="rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500">Track</button>
          </form>

          {orders.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Recent orders in this session</p>
              <div className="flex flex-wrap gap-2">
                {orders.map((recent) => (
                  <button key={recent.id} type="button" onClick={() => { setOrderId(recent.id); setLookupId(recent.id); }} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 hover:border-rose-500/50">
                    {recent.id} · {recent.city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!order && lookupId && <p role="status" className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-3 text-sm text-amber-200">Order not found in this browser session. Check the ID or choose a recent order.</p>}

          {order && (
            <div className="rounded-xl border border-white/[0.08] bg-[#080A10] p-4">
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div><p className="font-mono text-sm font-bold text-white">{order.id}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400"><MapPin className="h-3.5 w-3.5 text-rose-500" />{order.city} · {order.itemCount} item(s)</p></div>
                <div className="text-right"><p className="text-[10px] uppercase tracking-wider text-zinc-500">Estimated arrival</p><p className="mt-1 text-xs font-semibold text-white">{estimatedDelivery(order).toLocaleDateString('en-MA', { day: 'numeric', month: 'short' })}</p></div>
              </div>
              <ol className="mt-4 space-y-4">
                {ORDER_STAGES.map((label, index) => {
                  const Icon = STAGE_ICONS[index] ?? Check;
                  const complete = index <= stage;
                  return <li key={label} className="relative flex gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${complete ? 'border-rose-500/40 bg-rose-600/15 text-rose-400' : 'border-white/10 bg-white/[0.03] text-zinc-600'}`}><Icon className="h-3.5 w-3.5" /></span>
                    <div className="flex-1 pt-1"><p className={`text-sm ${complete ? 'font-medium text-white' : 'text-zinc-500'}`}>{label}</p>{index === stage && <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-400"><Clock3 className="h-3 w-3" />Current status</p>}</div>
                    {index < ORDER_STAGES.length - 1 && <span className={`absolute left-[13px] top-7 h-3 w-px ${index < stage ? 'bg-rose-500/60' : 'bg-white/10'}`} aria-hidden="true" />}
                  </li>;
                })}
              </ol>
              <p className="mt-4 border-t border-white/[0.08] pt-3 text-[11px] leading-relaxed text-zinc-500">Tracking updates are based on the order time saved in this browser session.</p>
            </div>
          )}
          {!lookupId && !orders.length && <p className="text-sm leading-relaxed text-zinc-400">Enter an order ID created during this session. Orders from previous sessions need a connected order tracking service.</p>}
        </div>
      </div>
    </div>
  );
};
