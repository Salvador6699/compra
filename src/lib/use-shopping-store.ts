import { useCallback, useEffect, useState } from "react";
import { SEED_ITEMS, type Category, type StoreName } from "./shopping-data";

const STORAGE_KEY = "shopping-app:v2";


export type Item = {
  id: string;
  name: string;
  category: Category;
  /** En la lista de la próxima compra */
  inList: boolean;
  /** Marcado como comprado en el viaje actual */
  bought: boolean;
  /** Supermercado preferido para este ítem */
  preferredStore?: StoreName;
  /** Precios conocidos en cada supermercado (ej: { Mercadona: 2.5, Lidl: 2.1 }) */
  prices?: Partial<Record<StoreName, number>>;
  /** Nota u oferta del producto */
  note?: string;
  /** Imagen en formato Base64 data URL */
  image?: string;
};

export type Store = {
  items: Item[];
};

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seedStore(): Store {
  return {
    items: SEED_ITEMS.map((s) => ({
      id: makeId(),
      name: s.name,
      category: s.category,
      inList: true,
      bought: false,
      preferredStore: s.preferredStore,
      prices: {},
    })),
  };
}

function loadStore(): Store {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.items) return seedStore();
    // Asegurar compatibilidad de estructura
    const items = parsed.items.map((it) => ({
      ...it,
      prices: it.prices ?? {},
    }));
    return { items };
  } catch {
    return seedStore();
  }
}

export function useShoppingStore() {
  const [store, setStore] = useState<Store>({ items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, hydrated]);

  const toggleInList = useCallback((id: string) => {
    setStore((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, inList: !it.inList, bought: it.inList ? false : it.bought } : it,
      ),
    }));
  }, []);

  const toggleBought = useCallback((id: string) => {
    setStore((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, bought: !it.bought } : it)),
    }));
  }, []);

  const addItem = useCallback(
    (
      name: string,
      category: Category,
      preferredStore?: StoreName,
      prices?: Partial<Record<StoreName, number>>,
      note?: string,
      image?: string,
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setStore((s) => {
        // evita duplicados case-insensitive
        if (s.items.some((it) => it.name.toLowerCase() === trimmed.toLowerCase())) {
          return {
            items: s.items.map((it) =>
              it.name.toLowerCase() === trimmed.toLowerCase()
                ? {
                    ...it,
                    inList: true,
                    preferredStore: preferredStore ?? it.preferredStore,
                    prices: prices ? { ...it.prices, ...prices } : it.prices,
                    note: note !== undefined ? note : it.note,
                    image: image !== undefined ? image : it.image,
                  }
                : it,
            ),
          };
        }
        return {
          items: [
            ...s.items,
            {
              id: makeId(),
              name: trimmed,
              category,
              inList: true,
              bought: false,
              preferredStore,
              prices: prices ?? {},
              note,
              image,
            },
          ],
        };
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setStore((s) => ({ items: s.items.filter((it) => it.id !== id) }));
  }, []);

  const updateItem = useCallback(
    (
      id: string,
      patch: {
        name?: string;
        category?: Category;
        preferredStore?: StoreName | null;
        prices?: Partial<Record<StoreName, number>>;
        note?: string;
        image?: string | null;
      },
    ) => {
      setStore((s) => ({
        items: s.items.map((it) => {
          if (it.id !== id) return it;
          const nextName = patch.name !== undefined ? patch.name.trim() : it.name;
          if (!nextName) return it;
          return {
            ...it,
            name: nextName,
            category: patch.category ?? it.category,
            preferredStore:
              patch.preferredStore === null
                ? undefined
                : patch.preferredStore ?? it.preferredStore,
            prices: patch.prices ?? it.prices,
            note: patch.note !== undefined ? patch.note : it.note,
            image:
              patch.image === null
                ? undefined
                : patch.image !== undefined
                  ? patch.image
                  : it.image,
          };
        }),
      }));
    },
    [],
  );


  /** Termina la compra: lo comprado sale de la lista, lo no comprado se queda para la próxima. */
  const finishTrip = useCallback(() => {
    setStore((s) => ({
      items: s.items.map((it) =>
        it.bought ? { ...it, inList: false, bought: false } : it,
      ),
    }));
  }, []);

  /** Pone TODO el catálogo en la lista (útil para revisar todo antes de comprar). */
  const selectAll = useCallback(() => {
    setStore((s) => ({ items: s.items.map((it) => ({ ...it, inList: true })) }));
  }, []);

  /** Vacía la lista de la compra (mantiene el catálogo). */
  const clearList = useCallback(() => {
    setStore((s) => ({
      items: s.items.map((it) => ({ ...it, inList: false, bought: false })),
    }));
  }, []);

  /** Replace the entire store (used for restoring backups). */
  const restoreStore = useCallback((newStore: Store) => {
    setStore(newStore);
  }, []);

  /** Restablece el catálogo completo a los nuevos SEED_ITEMS guardados */
  const resetToSeedCatalog = useCallback(() => {
    const newSeed = seedStore();
    setStore(newSeed);
  }, []);

  return {
    store,
    hydrated,
    toggleInList,
    toggleBought,
    addItem,
    removeItem,
    updateItem,
    finishTrip,
    selectAll,
    clearList,
    restoreStore,
    resetToSeedCatalog,
  };
}

