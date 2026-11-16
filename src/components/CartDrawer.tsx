import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Truck,
  MessageCircle,
  Tag,
} from 'lucide-react';
import { KidSize, MOROCCO_CITIES, Product } from '../data/catalog';
import { SafeImage } from './SafeImage';
import { useLocale } from '../context/LocaleContext';
import { TrackedOrder } from '../lib/orderTracking';
import { openWhatsAppOrder, whatsAppOrderUrl } from '../lib/whatsapp';
import { getPromoCustomerId, reserveHourPromo } from '../lib/promo';
import { confirmAccountOrder, CustomerSession } from '../lib/customerAuth';

export interface CartItem {
  id: string;
  product: Product;
  size: KidSize;
  colorName: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderCreated: (order: TrackedOrder) => void;
  onOpenAccount: () => void;
  customerSession: CustomerSession | null;
  onCustomerSessionChange: (session: CustomerSession) => void;
}


export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  onOpenAccount,
  customerSession,
  onCustomerSessionChange,
}) => {
  const { t } = useLocale();
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(MOROCCO_CITIES[0]);
  const [address, setAddress] = useState('');
  const [orderNumber, setOrderNumber] = useState('VY-1042');
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderDiscountMad, setOrderDiscountMad] = useState(0);
  const [orderTotalMad, setOrderTotalMad] = useState<number | null>(null);
  const [confirmedWhatsAppMessage, setConfirmedWhatsAppMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceMad * item.quantity,
    0
  );
  const freeDelivery = true;
  const deliveryFee = 0;
  const welcomeDiscount = customerSession?.profile.discountedOrdersRemaining
    ? Math.round(subtotal * 0.2)
    : 0;
  const codeDiscount = promoCode === 'VYRO10'
    ? Math.round(subtotal * 0.1)
    : promoCode === 'HOUR'
      ? Math.round(subtotal * 0.1)
    : promoCode === 'VYRO15' && subtotal > 1500
      ? Math.round(subtotal * 0.15)
      : 0;
  const promoDiscount = welcomeDiscount > 0 ? 0 : codeDiscount;
  const visibleDiscount = orderDiscountMad || welcomeDiscount;
  const total = orderTotalMad ?? (Math.max(0, subtotal - visibleDiscount - promoDiscount) + deliveryFee);

  const buildOrderWhatsAppMessage = (confirmedNumber: string, confirmedTotal: number) => [
    'Salam VYRO FASHION, commande confirmée sur le site:',
    `• Order: ${confirmedNumber}`,
    `• Name: ${fullName}`,
    `• Phone: ${phone}`,
    ...items.map((item) => `• ${item.product.name} | ${item.colorName} | Size ${item.size} | Qty ${item.quantity} | ${item.product.priceMad * item.quantity} MAD`),
    `• City: ${city}`,
    `• Address: ${address}`,
    `• Subtotal: ${subtotal} MAD`,
    ...(visibleDiscount ? [`• Member discount: -${visibleDiscount} MAD`] : []),
    ...(promoDiscount ? [`• Promo ${promoCode}: -${promoDiscount} MAD`] : []),
    '• Delivery: Free',
    `• Total: ${confirmedTotal} MAD`,
    'Paiement à la livraison / Cash on Delivery.',
  ].join('\n');

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmingOrder) return;
    // Open the tab during the click gesture so the browser does not block it after the async order save.
    const whatsappTab = window.open('about:blank', '_blank');
    setConfirmingOrder(true);
    setOrderError('');
    try {
      const confirmed = await confirmAccountOrder({
        subtotalMad: subtotal,
        deliveryFeeMad: deliveryFee,
        fullName,
        email: customerSession?.profile.email,
        phone,
        city,
        address,
        promoCode,
        promoCustomerId: promoCode === 'HOUR' ? getPromoCustomerId() : undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          size: String(item.size),
          colorName: item.colorName,
          quantity: item.quantity,
        })),
      }, customerSession?.token);
      const newOrderNumber = confirmed.orderNumber;
      const finalDiscount = confirmed.discountMad + confirmed.promoDiscountMad;
      const finalTotal = confirmed.totalMad;
      if (customerSession && confirmed.profile) onCustomerSessionChange({ ...customerSession, profile: confirmed.profile });
      setOrderDiscountMad(finalDiscount);
      setOrderTotalMad(finalTotal);
      setOrderNumber(newOrderNumber);
      const whatsappMessage = buildOrderWhatsAppMessage(newOrderNumber, finalTotal);
      setConfirmedWhatsAppMessage(whatsappMessage);
      if (whatsappTab && !whatsappTab.closed) {
        whatsappTab.opener = null;
        whatsappTab.location.replace(whatsAppOrderUrl(whatsappMessage));
      }
      onOrderCreated({
        id: newOrderNumber,
        createdAt: Date.now(),
        city,
        itemCount: items.reduce((count, item) => count + item.quantity, 0),
        totalMad: finalTotal,
      });
      onClearCart();
      setStep('confirmed');
    } catch (error) {
      whatsappTab?.close();
      setOrderError(error instanceof Error ? error.message : 'Could not confirm your order. Please try again.');
    } finally {
      setConfirmingOrder(false);
    }
  };

  const applyPromoCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (promoApplying) return;
    if (welcomeDiscount > 0 && code) {
      setPromoCode('');
      setPromoMessage('Your 20% member discount cannot be combined with promo codes.');
      return;
    }
    if (code === 'HOUR') {
      setPromoApplying(true);
      setPromoMessage('');
      try {
        const reservation = await reserveHourPromo();
        setPromoCode('HOUR');
        setPromoMessage(reservation.remaining > 0
          ? `Promo applied · 10% off · ${reservation.remaining} first-use spots remain`
          : 'Promo applied · 10% off · All 20 spots are claimed');
        setPromoInput('');
      } catch (error) {
        setPromoCode('');
        setPromoMessage(error instanceof Error ? error.message : 'Promo validation is temporarily unavailable.');
      } finally {
        setPromoApplying(false);
      }
      return;
    }
    if (code === 'VYRO10') {
      setPromoCode(code);
      setPromoMessage('Promo applied · 10% off');
      setPromoInput('');
    } else if (code === 'VYRO15' && subtotal > 1500) {
      setPromoCode(code);
      setPromoMessage('Promo applied · 15% off');
      setPromoInput('');
    } else if (code === 'VYRO15') {
      setPromoCode('');
      setPromoMessage('VYRO15 applies to orders over 1,500 MAD.');
    } else {
      setPromoCode('');
      setPromoMessage('This promo code is not valid.');
    }
  };

  const handleWhatsAppOrder = () => {
    const checkoutForm = document.getElementById('vyro-checkout-form') as HTMLFormElement | null;
    if (checkoutForm && !checkoutForm.reportValidity()) return;
    const lines = [
      'Salam VYRO FASHION, bghit nconfirmi had commande:',
      `• Name: ${fullName}`,
      `• Phone: ${phone}`,
      ...items.map((item) => `• ${item.product.name} | ${item.colorName} | Size ${item.size} | Qty ${item.quantity} | ${item.product.priceMad * item.quantity} MAD`),
      `• City: ${city}`,
      `• Address: ${address}`,
      `• Subtotal: ${subtotal} MAD`,
      ...(visibleDiscount ? [`• Member discount: -${visibleDiscount} MAD`] : []),
      ...(promoDiscount ? [`• Promo discount: -${promoDiscount} MAD`] : []),
      `• Delivery: ${freeDelivery ? 'Free' : `${deliveryFee} MAD`}`,
      `• Total: ${total} MAD`,
      'Paiement à la livraison, merci.',
    ];
    openWhatsAppOrder(lines.join('\n'));
  };

  const handleCloseDrawer = () => {
    if (step === 'confirmed') {
      setStep('bag');
      setOrderDiscountMad(0);
      setOrderTotalMad(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.bag')}
    >
      <div className="w-full max-w-md bg-[#0B0E16] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-rose-500" aria-hidden="true" />
            <h2 className="font-product text-lg font-extrabold uppercase tracking-tight text-white">
              {step === 'bag' && t('cart.title')}
              {step === 'checkout' && t('cart.checkout')}
              {step === 'confirmed' && t('cart.confirmed')}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label={t('cart.close')}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'confirmed' ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
              </div>
              <p className="font-cyber text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                {t('cart.orderReady')} · #{orderNumber}
              </p>
              <h3 className="font-display text-2xl font-bold text-white">
                {t('cart.thankYou')}, {fullName || t('cart.member')}!
              </h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {t('cart.package')}{' '}
                <span className="text-zinc-200 font-medium">{city}</span> via{' '}
                {t('cart.cod')}
                .
              </p>
              {orderDiscountMad > 0 && <p className="text-sm font-semibold text-emerald-400">Welcome discount: −{orderDiscountMad} MAD · Total: {orderTotalMad} MAD</p>}
              <button
                type="button"
                onClick={() => openWhatsAppOrder(confirmedWhatsAppMessage)}
                className="mx-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.15]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Open order in WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="mt-4 px-6 py-3 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-white">
                {t('cart.empty')}
              </p>
              <p className="text-sm text-zinc-400">
                {t('cart.emptyHint')}
              </p>
            </div>
          ) : step === 'bag' ? (
            <div className="space-y-5">
              {customerSession?.profile.discountedOrdersRemaining ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3.5 text-xs text-zinc-200">
                  <span className="font-semibold text-rose-300">Member offer: 20% off</span> your first {customerSession.profile.discountedOrdersRemaining} order{customerSession.profile.discountedOrdersRemaining === 1 ? '' : 's'}.
                </div>
              ) : !customerSession ? (
                <button type="button" onClick={onOpenAccount} className="w-full rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3.5 text-left text-xs text-zinc-200 transition hover:border-rose-500/40">
                  <span className="font-semibold text-rose-300">Create an account</span> to get 20% off each of your first five orders.
                </button>
              ) : null}
              {/* Free delivery on all orders */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Truck className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
                  <span>{t('cart.freeUnlocked')}</span>
                </div>
              </div>

              {/* Itemized List */}
              <div className="divide-y divide-white/[0.07]">
                {items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    {(() => {
                      const colorway = item.product.colors.find((color) => color.name === item.colorName);
                      return (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#07090F] border border-white/10 shrink-0">
                      <SafeImage
                        src={colorway?.imageUrl ?? item.product.imageUrl}
                        alt={`${item.product.name} — ${item.colorName}`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: item.product.imagePosition }}
                        fallbackLabel={item.product.category}
                      />
                    </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                <h3 className="font-product text-sm font-bold uppercase tracking-tight text-white truncate">
                          {item.product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label={`${t('cart.remove')} ${item.product.name}`}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {t('cart.size')} {item.size} · {item.colorName}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-white/15 rounded-lg bg-white/[0.03]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            aria-label={t('cart.decrease')}
                            className="p-1.5 text-zinc-300 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="font-cyber px-2.5 text-[9px] font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            aria-label={t('cart.increase')}
                            className="p-1.5 text-zinc-300 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-cyber text-[10px] font-bold tracking-tight text-white">{item.product.priceMad * item.quantity}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">MAD</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form
              id="vyro-checkout-form"
              onSubmit={handleConfirmOrder}
              className="space-y-4"
            >
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  {t('cart.payment')}
                </span>
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-3 text-xs font-semibold text-white">
                  {t('cart.cod')}
                </div>
              </div>

              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  {t('cart.fullName')}
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Youssef El Amrani"
                  className="w-full h-10 px-3.5 text-sm bg-white/[0.05] border border-white/15 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  {t('cart.phone')}
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                  className="w-full h-10 px-3.5 text-sm bg-white/[0.05] border border-white/15 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-city"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  {t('cart.city')}
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  list="checkout-morocco-city-list"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Choose or type any Moroccan city"
                  className="w-full h-10 px-3.5 text-sm bg-[#0B0E16] border border-white/15 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <datalist id="checkout-morocco-city-list">
                  {MOROCCO_CITIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  {t('cart.address')}
                </label>
                <textarea
                  id="checkout-address"
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rue, Quartier, Résidence..."
                  className="w-full p-3.5 text-sm bg-white/[0.05] border border-white/15 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && step !== 'confirmed' && (
          <div className="p-6 border-t border-white/[0.08] bg-[#080A10] space-y-4">
            <form onSubmit={applyPromoCode} className="space-y-2">
              <label htmlFor="vyro-promo-code" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400"><Tag className="h-3.5 w-3.5 text-rose-500" /> Promo Code</label>
              <div className="flex gap-2">
                <input id="vyro-promo-code" value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Enter promo code" className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm uppercase text-white placeholder:text-zinc-600 focus:border-rose-500 focus:outline-none" />
                <button type="submit" disabled={promoApplying} className="rounded-lg border border-white/10 bg-white/[0.07] px-3 text-xs font-semibold text-zinc-100 hover:bg-white/[0.12] disabled:cursor-wait disabled:opacity-50">{promoApplying ? 'Checking…' : 'Apply'}</button>
              </div>
              {promoMessage && <p role="status" className={`text-[11px] ${promoDiscount || welcomeDiscount ? 'text-emerald-400' : 'text-zinc-400'}`}>{promoMessage}</p>}
            </form>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.subtotal')}</span>
                <span className="inline-flex items-center gap-1.5 text-zinc-200">
                  <span className="font-cyber text-[10px] font-bold">{subtotal}</span><span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">MAD</span>
                </span>
              </div>
              {visibleDiscount > 0 && <div className="flex justify-between text-emerald-400"><span>{welcomeDiscount > 0 ? 'Member discount · 20%' : 'Member discount'}</span><span className="font-cyber text-[10px] font-bold">−{visibleDiscount} MAD</span></div>}
              {promoDiscount > 0 && <div className="flex justify-between text-emerald-400"><span>Promo discount</span><span className="font-cyber text-[10px] font-bold">−{promoDiscount} MAD</span></div>}
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.delivery')}</span>
                <span className="font-cyber text-[10px] font-bold text-zinc-200">
                  {freeDelivery ? t('cart.free') : `${deliveryFee} MAD`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/[0.08]">
                <span>{t('cart.total')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="font-cyber text-[11px] font-bold">{total}</span><span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">MAD</span></span>
              </div>
            </div>

            {step === 'bag' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
              >
                <span>{t('cart.proceed')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="space-y-2">
                <button type="button" onClick={handleWhatsAppOrder} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.15]">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Quick Order via WhatsApp
                </button>
                <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('bag')}
                  className="px-4 py-3.5 text-xs font-semibold text-zinc-300 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors"
                >
                  {t('cart.back')}
                </button>
                <button
                  type="submit"
                  form="vyro-checkout-form"
                  disabled={confirmingOrder}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors disabled:cursor-wait disabled:opacity-60"
                >
                  <span>{confirmingOrder ? 'Confirming…' : `${t('cart.confirmOrder')} — ${total} MAD`}</span>
                </button>
                </div>
                {orderError && <p role="alert" className="text-[11px] leading-relaxed text-red-400">{orderError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
