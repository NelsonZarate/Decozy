"use client";

import { useCart } from "@/components/cart/CartContext";

export function FloatingCart() {
  const { count, openCheckout } = useCart();

  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 lg:bottom-8 lg:left-auto lg:right-8 lg:w-auto lg:max-w-none lg:translate-x-0 lg:px-0">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCheckout}
          aria-label={`Checkout — cart with ${count} item${count === 1 ? "" : "s"}`}
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg hover:bg-primary active:scale-95 transition-all"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-error border-2 border-primary-container" />
        </button>
      </div>
    </div>
  );
}
