"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
}

/** Parse a display price like "$1,249" or "320" into a number (0 when invalid). */
export function parsePrice(price: string): number {
  if (!price) return 0;
  // Keep digits, dot and comma, then normalise to a JS-parseable number.
  let cleaned = price.replace(/[^0-9.,]/g, "");
  if (cleaned.includes(",")) {
    // Treat comma as a thousands separator (e.g. "1,249" -> "1249").
    cleaned = cleaned.replace(/,/g, "");
  }
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Format a numeric amount back into the app's "$X,XXX" display style. */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

interface CartContextValue {
  items: CartItem[];
  /** Total number of items in the cart. */
  count: number;
  /** Sum of all item prices in the cart. */
  total: number;
  /** Total formatted for display, e.g. "$1,754". */
  totalLabel: string;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  /** Whether the checkout mini-menu is open. */
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCheckout = useCallback(() => setIsCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.price), 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      total,
      totalLabel: formatPrice(total),
      addItem,
      removeItem,
      clear,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
    }),
    [items, total, addItem, removeItem, clear, isCheckoutOpen, openCheckout, closeCheckout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
