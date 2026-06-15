"use client";

import { useState } from "react";

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
    <main className="flex-1 px-4 pb-24">
      <section className="mb-4 mt-2 text-center">
        <h2 className="font-serif text-2xl font-medium text-on-surface">My Items</h2>
        <p className="text-xs text-on-surface-variant mt-1">
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

      {/* Items list */}
      <div className="flex flex-col gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20">
            <div className="relative bg-[#f5f5f5] aspect-square flex items-center justify-center">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain p-4"
              />
              <button
                onClick={() => toggleSave(item.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={savedItems[item.id] ? "none" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <span className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">
                {item.category}
              </span>
              <h3 className="font-serif text-base font-medium text-on-surface mt-1">
                {item.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-on-surface">{item.price}</span>
                <button className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                  View Details
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
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
