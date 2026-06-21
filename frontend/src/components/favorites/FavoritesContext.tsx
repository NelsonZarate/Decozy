"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deleteSavedItem, listSavedItems, saveItem } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

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
 * Static fallback details for the mock furniture seeded into the `items` table
 * with these fixed ids. Used when the local cache has no entry (e.g. first time
 * on a new device).
 */
const CATALOG: FavoriteItem[] = [
  { id: "9001", name: "Scandi Oak Frame Sofa", category: "Seating", price: "$1,249", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop" },
  { id: "9002", name: "Arc Minimalist Floor Lamp", category: "Lighting", price: "$320", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop" },
  { id: "9003", name: "Walnut Office Chair", category: "Seating", price: "$185", image: "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop" },
  { id: "9004", name: "Low Platform Oak Bed", category: "Bedroom", price: "$890", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=600&fit=crop" },
  { id: "9005", name: "Paper Lantern Nightstand", category: "Tables", price: "$140", image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop" },
  { id: "9006", name: "Rattan Accent Chair", category: "Seating", price: "$410", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop" },
  { id: "9007", name: "Whitewash Coffee Table", category: "Tables", price: "$520", image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop" },
];

// ---------------------------------------------------------------------------
// Local details cache (keyed by item id). The DB is the source of truth for
// WHICH items are favorited; this only remembers their display details so the
// Favorites tab can be rebuilt after a refresh without loading projects.
// ---------------------------------------------------------------------------

const CACHE_KEY = "decozy.fav.cache";

function readCache(): Record<string, FavoriteItem> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function cacheItem(item: FavoriteItem): void {
  if (typeof window === "undefined") return;
  try {
    const cache = readCache();
    cache[item.id] = item;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const staticMap = useMemo(() => {
    const map = new Map<string, FavoriteItem>();
    for (const item of CATALOG) map.set(item.id, item);
    return map;
  }, []);

  // Rebuild the favorites list from the backend (source of truth for which
  // items are saved) + the local cache / static catalog (for their details).
  const loadFavorites = useCallback(async () => {
    const saved = await listSavedItems();
    const cache = readCache();
    setFavorites(
      saved
        .map((s) => {
          const id = String(s.item_id);
          return cache[id] ?? staticMap.get(id);
        })
        .filter((item): item is FavoriteItem => Boolean(item)),
    );
  }, [staticMap]);

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated) {
      loadFavorites().catch((err) => {
        console.error("[favorites] loadFavorites failed:", err);
      });
    } else {
      setFavorites([]);
    }
  }, [isReady, isAuthenticated, loadFavorites]);

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      const exists = favorites.some((f) => f.id === item.id);

      // Remember the item's details so it can be rebuilt after a refresh.
      if (!exists) cacheItem(item);

      // Optimistic UI update first so the item always leaves/enters favorites.
      setFavorites((prev) =>
        prev.some((f) => f.id === item.id)
          ? prev.filter((f) => f.id !== item.id)
          : [item, ...prev],
      );

      // Persist to the backend for real items (numeric id). Mock items with a
      // non-numeric id stay local-only.
      if (/^\d+$/.test(item.id)) {
        const itemId = Number(item.id);
        const action = exists ? "delete" : "save";
        (exists ? deleteSavedItem(itemId) : saveItem(itemId))
          .then(() => {
            console.info(`[favorites] ${action} ok for item ${itemId}`);
          })
          .catch((err) => {
            console.error(`[favorites] ${action} FAILED for item ${itemId}:`, err);
          });
      } else {
        console.warn(
          `[favorites] item "${item.id}" is not a numeric backend id — not persisted to DB.`,
        );
      }
    },
    [favorites],
  );

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
