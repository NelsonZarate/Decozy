"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";

const categories = ["All Items", "Seating", "Lighting", "Tables", "Decor"];

const items = [
  {
    id: 1,
    name: "Scandi Oak Frame Sofa",
    category: "Seating",
    price: "$1,249",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
    saved: true,
  },
  {
    id: 2,
    name: "Arc Minimalist Floor Lamp",
    category: "Lighting",
    price: "$320",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop",
    saved: true,
  },
  {
    id: 3,
    name: "Walnut Dining Chair",
    category: "Seating",
    price: "$185",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop",
    saved: true,
  },
  {
    id: 4,
    name: "Carrara Marble Coffee Table",
    category: "Tables",
    price: "$650",
    image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop",
    saved: true,
  },
];

export function MyItemsPage() {
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [savedItems, setSavedItems] = useState<Record<number, boolean>>(
    Object.fromEntries(items.map((i) => [i.id, i.saved]))
  );

  const filtered = items.filter(
    (item) => activeCategory === "All Items" || item.category === activeCategory
  );

  const toggleSave = (id: number) => {
    setSavedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="flex-1 px-4 pb-24 lg:max-w-6xl lg:mx-auto lg:w-full lg:px-8 lg:pt-4 lg:pb-12">
      <section className="mb-4 mt-2 text-center lg:mb-8 lg:mt-4">
        <h2 className="font-serif text-2xl font-medium text-on-surface lg:text-3xl">Favorites</h2>
        <p className="text-xs text-on-surface-variant mt-1 lg:text-sm lg:mt-1.5">
          Your curated collection of furniture and decor from generated designs.
        </p>
      </section>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? "bg-on-surface text-surface border-on-surface"
                : "bg-transparent text-on-surface-variant border-outline-variant"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {filtered.map((item) => (
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
                onClick={() => toggleSave(item.id)}
                aria-label={savedItems[item.id] ? "Remove from saved" : "Save item"}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={savedItems[item.id] ? "#e23b3b" : "none"}
                  stroke={savedItems[item.id] ? "#e23b3b" : "currentColor"}
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
                  onClick={() =>
                    addItem({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      price: item.price,
                      image: item.image,
                    })
                  }
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
    </main>
  );
}
