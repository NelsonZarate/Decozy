"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface FavoriteItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  /** Adds the item when missing, removes it when already favorited. */
  toggleFavorite: (item: FavoriteItem) => void;
}

/**
 * Items the Favorites tab starts with. Once the real API is wired up these
 * would be loaded from the backend instead of being seeded here.
 */
const SEED_FAVORITES: FavoriteItem[] = [
  {
    id: "seed-sofa",
    name: "Scandi Oak Frame Sofa",
    category: "Seating",
    price: "$1,249",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
  },
  {
    id: "seed-lamp",
    name: "Arc Minimalist Floor Lamp",
    category: "Lighting",
    price: "$320",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop",
  },
  {
    id: "seed-chair",
    name: "Walnut Dining Chair",
    category: "Seating",
    price: "$185",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop",
  },
  {
    id: "seed-table",
    name: "Carrara Marble Coffee Table",
    category: "Tables",
    price: "$650",
    image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop",
  },
];

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(SEED_FAVORITES);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) return prev.filter((f) => f.id !== item.id);
      return [item, ...prev];
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
