/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  KidSize,
  PRODUCTS,
  Product,
  ProductCategory,
} from './data/catalog';
import { productFromApi } from './lib/dbProducts';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CatalogSection } from './components/CatalogSection';
import { BrandStorySection } from './components/BrandStorySection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import VyroFitFlow from './components/VyroFitFlow';
import { CartDrawer, CartItem } from './components/CartDrawer';
import StylistChat from './components/StylistChat';
import { LocaleProvider } from './context/LocaleContext';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { readTrackedOrders, TrackedOrder, writeTrackedOrder } from './lib/orderTracking';
import { AccountModal } from './components/AccountModal';
import { CustomerSession, logoutCustomer, readCustomerSession, refreshCustomerSession, saveCustomerSession } from './lib/customerAuth';

export function App() {
  return (
    <LocaleProvider>
      <StorefrontApp />
    </LocaleProvider>
  );
}

function StorefrontApp() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [apiNotice, setApiNotice] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFitStudioOpen, setIsFitStudioOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>(() => readTrackedOrders());
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => readCustomerSession());
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  useEffect(() => {
    if (!customerSession) return;
    let cancelled = false;
    refreshCustomerSession(customerSession)
      .then((nextSession) => {
        if (cancelled) return;
        setCustomerSession(nextSession);
        saveCustomerSession(nextSession);
      })
      .catch(() => {
        if (cancelled) return;
        setCustomerSession(null);
        saveCustomerSession(null);
      });
    return () => { cancelled = true; };
  }, []);

  const handleOrderCreated = (order: TrackedOrder) => {
    setTrackedOrders(writeTrackedOrder(order));
  };

  useEffect(() => {
    let cancelled = false;
    const apiBase = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '');

    fetch(`${apiBase}/api/products/list.php`, {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load products from the server.');
        return response.json();
      })
      .then((body) => {
        const rows = Array.isArray(body.products) ? body.products : body.data?.products;
        if (!Array.isArray(rows)) throw new Error('The products response is not valid.');
        if (!cancelled) {
          setProducts(rows.map(productFromApi));
          setApiNotice('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiNotice('Database products are unavailable right now. Showing the sample catalog until the server is reachable.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (showWishlistOnly) {
      list = list.filter((p) => wishlistIds.includes(p.id));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    products,
    selectedCategory,
    showWishlistOnly,
    wishlistIds,
    searchQuery,
  ]);

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (
    product: Product,
    size: KidSize,
    colorName?: string
  ) => {
    const resolvedColor = colorName ?? product.colors[0]?.name ?? 'Default';
    const itemId = `${product.id}-${size}-${resolvedColor}`;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          size,
          colorName: resolvedColor,
          quantity: 1,
        },
      ];
    });
  };

  const handleAddLookToCart = (
    lookItems: { product: Product; size: KidSize }[]
  ) => {
    lookItems.forEach(({ product, size }) => {
      const resolvedSize = product.sizes.includes(size) ? size : product.sizes[0];
      handleAddToCart(product, resolvedSize, product.colors[0]?.name);
    });
    setIsFitStudioOpen(false);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleShopCollection = () => {
    const shopEl = document.getElementById('shop');
    shopEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalCartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#06070B] text-zinc-100">
      <Navbar
        activeSection="home"
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() !== '') {
            document
              .getElementById('shop')
              ?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        wishlistCount={wishlistIds.length}
        cartCount={totalCartCount}
        showWishlistOnly={showWishlistOnly}
        onToggleWishlistFilter={() => {
          setShowWishlistOnly((prev) => !prev);
          document
            .getElementById('shop')
            ?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFitStudio={() => setIsFitStudioOpen(true)}
        onTrackOrder={() => setIsOrderTrackingOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        accountName={customerSession?.profile.fullName.split(' ')[0]}
      />

      <main className="flex-1">
        <HeroSection
          onShopCollection={handleShopCollection}
          onOpenFitStudio={() => setIsFitStudioOpen(true)}
        />

        <CatalogSection
          products={filteredProducts}
          categoryOptions={categoryOptions}
          apiNotice={apiNotice}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          showWishlistOnly={showWishlistOnly}
          onClearWishlistFilter={() => setShowWishlistOnly(false)}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onSelectProduct={(product) => setSelectedProduct(product)}
          onQuickAdd={(product, size, colorName) => {
            handleAddToCart(product, size, colorName);
            setIsCartOpen(true);
          }}
        />

        <BrandStorySection onOpenFitStudio={() => setIsFitStudioOpen(true)} />
      </main>

      <Footer
        onSelectCategory={setSelectedCategory}
        onOpenFitStudio={() => setIsFitStudioOpen(true)}
        categories={categoryOptions}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isCartOpen={isCartOpen}
        isSaved={
          selectedProduct ? wishlistIds.includes(selectedProduct.id) : false
        }
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* Interactive VYRO Fit Studio Modal */}
      {isFitStudioOpen && (
        <VyroFitFlow
          products={products}
          onClose={() => setIsFitStudioOpen(false)}
          onAddLookToCart={handleAddLookToCart}
        />
      )}

      {!isFitStudioOpen && !isCartOpen && !selectedProduct && <StylistChat />}

      {/* Slide-Over Cart & Morocco Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderCreated={handleOrderCreated}
        onOpenAccount={() => setIsAccountOpen(true)}
        customerSession={customerSession}
        onCustomerSessionChange={(nextSession) => {
          setCustomerSession(nextSession);
          saveCustomerSession(nextSession);
        }}
      />
      {isAccountOpen && (
        <AccountModal
          session={customerSession}
          onClose={() => setIsAccountOpen(false)}
          onAuthenticated={(nextSession) => {
            setCustomerSession(nextSession);
            saveCustomerSession(nextSession);
            setIsAccountOpen(false);
          }}
          onLogout={() => {
            if (customerSession) void logoutCustomer(customerSession).catch(() => undefined);
            setCustomerSession(null);
            saveCustomerSession(null);
          }}
        />
      )}
      {isOrderTrackingOpen && (
        <OrderTrackingModal orders={trackedOrders} onClose={() => setIsOrderTrackingOpen(false)} />
      )}
    </div>
  );
}

export default App;
