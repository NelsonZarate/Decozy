"use client";

import { useState } from "react";
import { useCart, parsePrice } from "@/components/cart/CartContext";
import { useFavorites } from "@/components/favorites/FavoritesContext";

type FavoritesSort = "az" | "za" | "price-asc" | "price-desc";

export function MyItemsPage() {
  const { addItem, count, openCheckout } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FavoritesSort>("az");

  const visibleFavorites = [...favorites]
    .filter(
      (item) => !search || item.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sort) {
        case "za":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return parsePrice(a.price) - parsePrice(b.price);
        case "price-desc":
          return parsePrice(b.price) - parsePrice(a.price);
        case "az":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  function handleAddToCart(item: (typeof favorites)[number]) {
    // If the cart already holds an item, adding another opens the checkout menu.
    const alreadyHasItems = count > 0;
    addItem(item);
    if (alreadyHasItems) openCheckout();
  }

  return (
    <main className="flex-1 px-4 pb-24 lg:max-w-6xl lg:mx-auto lg:w-full lg:px-8 lg:pt-4 lg:pb-12">
      <section className="mb-4 mt-2 text-center lg:mb-8 lg:mt-4">
        <h2 className="font-serif text-2xl font-medium text-on-surface lg:text-3xl">Favorites</h2>
        <p className="text-xs text-on-surface-variant mt-1 lg:text-sm lg:mt-1.5">
          Your curated collection of furniture and decor from generated designs.
        </p>
      </section>

      <div className="lg:max-w-2xl">
        <div className="relative mb-4 lg:mb-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search favorites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-surface-container-lowest placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
      </div>

      <div className="mt-3 mb-4 lg:mt-4 lg:max-w-2xl">
        <div className="relative inline-block">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as FavoritesSort)}
            aria-label="Sort favorites"
            className="appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-3 pr-9 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
          >
            <option value="az">Name: A–Z</option>
            <option value="za">Name: Z–A</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 lg:py-28">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-outline mb-3">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p className="text-sm font-medium text-on-surface lg:text-base">No favorites yet</p>
          <p className="text-xs text-on-surface-variant mt-1 lg:text-sm">
            Tap the heart on furniture in the Gallery to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {visibleFavorites.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-3"
            >
              <div className="relative aspect-square rounded-xl bg-[#f0efed] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-contain p-3"
                />
                <button
                  onClick={() => toggleFavorite(item)}
                  aria-label={`Remove ${item.name} from favorites`}
                  aria-pressed
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#e23b3b"
                    stroke="#e23b3b"
                    strokeWidth="1.5"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className="pt-3 lg:pt-4">
                <span className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase lg:text-[11px]">
                  {item.category}
                </span>
                <h3 className="font-serif text-sm font-medium text-on-surface mt-0.5 truncate lg:text-base">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between mt-2 lg:mt-3">
                  <span className="text-sm font-semibold text-on-surface lg:text-base">{item.price}</span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    aria-label={`Add ${item.name} to cart`}
                    className="flex items-center gap-1 text-secondary hover:opacity-70 active:scale-95 transition-all"
                  >
                    <svg
                      width="20"
                      height="20"
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
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
