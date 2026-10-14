"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  size: string;
  mark: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeLine: (slug: string, size: string) => void;
  setQuantity: (slug: string, size: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "atelier-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage after mount: the server has no
    // window, so state must start empty and sync in afterward rather than
    // during the initial (SSR-matching) render.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setLines(JSON.parse(stored) as CartLine[]);
    } catch {
      // ignore malformed/unavailable storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore unavailable storage
    }
  }, [lines, hydrated]);

  const addItem = useCallback(
    (product: Product, size: string, quantity = 1) => {
      setLines((current) => {
        const existing = current.find(
          (line) => line.slug === product.slug && line.size === size
        );
        if (existing) {
          return current.map((line) =>
            line === existing
              ? { ...line, quantity: line.quantity + quantity }
              : line
          );
        }
        return [
          ...current,
          {
            slug: product.slug,
            name: product.name,
            price: product.price,
            size,
            mark: product.mark,
            quantity,
          },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const removeLine = useCallback((slug: string, size: string) => {
    setLines((current) =>
      current.filter((line) => !(line.slug === slug && line.size === size))
    );
  }, []);

  const setQuantity = useCallback(
    (slug: string, size: string, quantity: number) => {
      setLines((current) =>
        quantity <= 0
          ? current.filter((line) => !(line.slug === slug && line.size === size))
          : current.map((line) =>
              line.slug === slug && line.size === size
                ? { ...line, quantity }
                : line
            )
      );
    },
    []
  );

  const clearCart = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.price * line.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((total, line) => total + line.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeLine,
      setQuantity,
      clearCart,
      subtotal,
      itemCount,
    }),
    [
      lines,
      isOpen,
      addItem,
      removeLine,
      setQuantity,
      clearCart,
      subtotal,
      itemCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
