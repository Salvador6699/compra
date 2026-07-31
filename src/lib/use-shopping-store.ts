import { useCallback, useEffect, useState } from "react";
import { SEED_ITEMS, type Category, type StoreName } from "./shopping-data";

const STORAGE_KEY = "shopping-app:v4";


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

export type TripItem = {
  name: string;
  category: Category;
  preferredStore?: StoreName;
  price?: number;
};

export type CompletedTrip = {
  id: string;
  date: string;
  storeName?: StoreName | string;
  storeTotals: Partial<Record<StoreName | "Otro", number>>;
  grandTotal: number;
  items: TripItem[];
  receiptImage?: string;
  note?: string;
};

export type Store = {
  items: Item[];
  trips?: CompletedTrip[];
  customCategories?: string[];
  customStores?: string[];
  categoryIcons?: Record<string, string>;
  storeIcons?: Record<string, string>;
  deletedCategories?: string[];
  deletedStores?: string[];
  syncUrl?: string;
  lastSyncDate?: string;
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
      inList: false,
      bought: false,
      preferredStore: s.preferredStore,
      prices: s.prices ?? {},
    })),
    trips: [],
    customCategories: [],
    customStores: [],
    categoryIcons: {},
    storeIcons: {},
    deletedCategories: [],
    deletedStores: [],
    syncUrl: "http://plantr753:zGTk9J8N@www.listacompra.es.mialias.net/get_prices.php",
  };
}

function loadStore(): Store {
  if (typeof window === "undefined") return seedStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.items || !Array.isArray(parsed.items)) return seedStore();

    // Map seed prices & stores by item name
    const seedMap = new Map(
      SEED_ITEMS.map((i) => [i.name.toLowerCase(), { prices: i.prices ?? {}, preferredStore: i.preferredStore }]),
    );

    const items = parsed.items
      .filter((it) => it && typeof it === "object" && it.id && it.name)
      .map((it) => {
        const seedData = seedMap.get(it.name.toLowerCase());
        return {
          ...it,
          preferredStore: it.preferredStore ?? seedData?.preferredStore,
          prices: { ...(seedData?.prices ?? {}), ...(it.prices ?? {}) },
        };
      });

    if (items.length === 0) return seedStore();
    return {
      items,
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
      customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
      customStores: Array.isArray(parsed.customStores) ? parsed.customStores : [],
      categoryIcons: parsed.categoryIcons && typeof parsed.categoryIcons === "object" ? parsed.categoryIcons : {},
      storeIcons: parsed.storeIcons && typeof parsed.storeIcons === "object" ? parsed.storeIcons : {},
      deletedCategories: Array.isArray(parsed.deletedCategories) ? parsed.deletedCategories : [],
      deletedStores: Array.isArray(parsed.deletedStores) ? parsed.deletedStores : [],
    };
  } catch {
    return seedStore();
  }
}


export function capitalize(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function useShoppingStore() {
  const [store, setStore] = useState<Store>({
    items: [],
    trips: [],
    customCategories: [],
    customStores: [],
    categoryIcons: {},
    storeIcons: {},
    deletedCategories: [],
    deletedStores: [],
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  }, [store, hydrated]);

  const addCustomCategory = useCallback((catName: string, icon?: string) => {
    const trimmed = capitalize(catName);
    if (!trimmed) return;
    setStore((s) => {
      const current = s.customCategories ?? [];
      const deleted = s.deletedCategories ?? [];
      const nextDeleted = deleted.filter((c) => c !== trimmed);
      const nextCustom = current.includes(trimmed) ? current : [...current, trimmed];
      const nextIcons = { ...s.categoryIcons };
      if (icon?.trim()) {
        nextIcons[trimmed] = icon.trim();
      }
      return {
        ...s,
        customCategories: nextCustom,
        deletedCategories: nextDeleted,
        categoryIcons: nextIcons,
      };
    });
  }, []);

  const updateCategoryIcon = useCallback((catName: string, icon: string) => {
    const trimmedCat = capitalize(catName);
    const trimmedIcon = icon.trim();
    if (!trimmedCat || !trimmedIcon) return;
    setStore((s) => ({
      ...s,
      categoryIcons: { ...(s.categoryIcons ?? {}), [trimmedCat]: trimmedIcon },
    }));
  }, []);

  const renameCategory = useCallback((oldName: string, newName: string, icon?: string) => {
    const trimmedNew = capitalize(newName);
    if (!trimmedNew) return;

    setStore((s) => {
      const nextIcons = { ...(s.categoryIcons ?? {}) };
      if (icon !== undefined) {
        if (icon.trim()) nextIcons[trimmedNew] = icon.trim();
        else delete nextIcons[trimmedNew];
      }

      if (oldName === trimmedNew) {
        return { ...s, categoryIcons: nextIcons };
      }

      if (icon === undefined && nextIcons[oldName]) {
        nextIcons[trimmedNew] = nextIcons[oldName];
        delete nextIcons[oldName];
      } else if (nextIcons[oldName]) {
        delete nextIcons[oldName];
      }

      const nextItems = s.items.map((it) =>
        it.category === oldName ? { ...it, category: trimmedNew as Category } : it,
      );

      const nextCustom = (s.customCategories ?? [])
        .filter((c) => c !== oldName && c !== trimmedNew)
        .concat(trimmedNew);
      const nextDeleted = (s.deletedCategories ?? []).filter((c) => c !== oldName && c !== trimmedNew);

      return {
        ...s,
        items: nextItems,
        customCategories: nextCustom,
        deletedCategories: nextDeleted,
        categoryIcons: nextIcons,
      };
    });
  }, []);

  const removeCategory = useCallback((catName: string) => {
    setStore((s) => {
      const isUsed = s.items.some((it) => it.category === catName);
      if (isUsed) return s;

      const nextCustom = (s.customCategories ?? []).filter((c) => c !== catName);
      const nextDeleted = Array.from(new Set([...(s.deletedCategories ?? []), catName]));
      const nextIcons = { ...s.categoryIcons };
      delete nextIcons[catName];

      return {
        ...s,
        customCategories: nextCustom,
        deletedCategories: nextDeleted,
        categoryIcons: nextIcons,
      };
    });
  }, []);

  const addCustomStore = useCallback((storeName: string, icon?: string) => {
    const trimmed = capitalize(storeName);
    if (!trimmed) return;
    setStore((s) => {
      const current = s.customStores ?? [];
      const deleted = s.deletedStores ?? [];
      const nextDeleted = deleted.filter((st) => st !== trimmed);
      const nextCustom = current.includes(trimmed) ? current : [...current, trimmed];
      const nextIcons = { ...s.storeIcons };
      if (icon?.trim()) {
        nextIcons[trimmed] = icon.trim();
      }
      return {
        ...s,
        customStores: nextCustom,
        deletedStores: nextDeleted,
        storeIcons: nextIcons,
      };
    });
  }, []);

  const updateStoreIcon = useCallback((storeName: string, icon: string) => {
    const trimmedStore = capitalize(storeName);
    const trimmedIcon = icon.trim();
    if (!trimmedStore || !trimmedIcon) return;
    setStore((s) => ({
      ...s,
      storeIcons: { ...(s.storeIcons ?? {}), [trimmedStore]: trimmedIcon },
    }));
  }, []);

  const renameStore = useCallback((oldName: string, newName: string, icon?: string) => {
    const trimmedNew = capitalize(newName);
    if (!trimmedNew) return;

    setStore((s) => {
      const nextIcons = { ...(s.storeIcons ?? {}) };
      if (icon !== undefined) {
        if (icon.trim()) nextIcons[trimmedNew] = icon.trim();
        else delete nextIcons[trimmedNew];
      }

      if (oldName === trimmedNew) {
        return { ...s, storeIcons: nextIcons };
      }

      if (icon === undefined && nextIcons[oldName]) {
        nextIcons[trimmedNew] = nextIcons[oldName];
        delete nextIcons[oldName];
      } else if (nextIcons[oldName]) {
        delete nextIcons[oldName];
      }

      const nextItems = s.items.map((it) => {
        let updatedStore = it.preferredStore;
        if (it.preferredStore === oldName) {
          updatedStore = trimmedNew as StoreName;
        }

        let updatedPrices = it.prices;
        if (it.prices && it.prices[oldName as StoreName] !== undefined) {
          updatedPrices = { ...it.prices };
          updatedPrices[trimmedNew as StoreName] = updatedPrices[oldName as StoreName];
          delete updatedPrices[oldName as StoreName];
        }

        return {
          ...it,
          preferredStore: updatedStore,
          prices: updatedPrices,
        };
      });

      const nextCustom = (s.customStores ?? [])
        .filter((st) => st !== oldName && st !== trimmedNew)
        .concat(trimmedNew);
      const nextDeleted = (s.deletedStores ?? []).filter((st) => st !== oldName && st !== trimmedNew);

      return {
        ...s,
        items: nextItems,
        customStores: nextCustom,
        deletedStores: nextDeleted,
        storeIcons: nextIcons,
      };
    });
  }, []);

  const removeStore = useCallback((storeName: string) => {
    setStore((s) => {
      const isUsed = s.items.some(
        (it) =>
          it.preferredStore === storeName ||
          (it.prices && it.prices[storeName as StoreName] !== undefined && it.prices[storeName as StoreName]! > 0),
      );
      if (isUsed) return s;

      const nextCustom = (s.customStores ?? []).filter((st) => st !== storeName);
      const nextDeleted = Array.from(new Set([...(s.deletedStores ?? []), storeName]));
      const nextIcons = { ...s.storeIcons };
      delete nextIcons[storeName];

      return {
        ...s,
        customStores: nextCustom,
        deletedStores: nextDeleted,
        storeIcons: nextIcons,
      };
    });
  }, []);






  const toggleInList = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.id === id ? { ...it, inList: !it.inList, bought: it.inList ? false : it.bought } : it,
      ),
    }));
  }, []);

  const toggleBought = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
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
      const trimmed = capitalize(name);
      if (!trimmed) return;
      setStore((s) => {
        // evita duplicados case-insensitive
        if (s.items.some((it) => it.name.toLowerCase() === trimmed.toLowerCase())) {
          return {
            ...s,
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
          ...s,
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
    setStore((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));
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
        ...s,
        items: s.items.map((it) => {
          if (it.id !== id) return it;
          const nextName = patch.name !== undefined ? capitalize(patch.name) : it.name;
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
      ...s,
      items: s.items.map((it) =>
        it.bought ? { ...it, inList: false, bought: false } : it,
      ),
    }));
  }, []);

  /** Guarda un viaje de compra finalizado en el historial y saca lo comprado de la lista */
  const saveCompletedTrip = useCallback(
    (tripData: Omit<CompletedTrip, "id" | "date">) => {
      const newTrip: CompletedTrip = {
        ...tripData,
        id: makeId(),
        date: new Date().toISOString(),
      };

      setStore((s) => ({
        ...s,
        trips: [newTrip, ...(s.trips ?? [])],
        items: s.items.map((it) =>
          it.bought ? { ...it, inList: false, bought: false } : it,
        ),
      }));
    },
    [],
  );

  /** Elimina un viaje del historial */
  const deleteTrip = useCallback((tripId: string) => {
    setStore((s) => ({
      ...s,
      trips: (s.trips ?? []).filter((t) => t.id !== tripId),
    }));
  }, []);

  /** Pone TODO el catálogo en la lista (útil para revisar todo antes de comprar). */
  const selectAll = useCallback(() => {
    setStore((s) => ({ ...s, items: s.items.map((it) => ({ ...it, inList: true })) }));
  }, []);

  /** Vacía la lista de la compra (mantiene el catálogo). */
  const clearList = useCallback(() => {
    setStore((s) => ({
      ...s,
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

  const setSyncUrl = useCallback((url: string) => {
    setStore((s) => ({ ...s, syncUrl: url }));
  }, []);

  const syncCatalogPrices = useCallback(async () => {
    if (!store.syncUrl) {
      setSyncError("No hay URL configurada.");
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      let fetchUrl = store.syncUrl;
      const headers: Record<string, string> = {};
      
      try {
        const urlObj = new URL(store.syncUrl);
        if (urlObj.username || urlObj.password) {
          headers['Authorization'] = 'Basic ' + btoa(`${urlObj.username}:${urlObj.password}`);
          urlObj.username = '';
          urlObj.password = '';
          fetchUrl = urlObj.toString();
        }
      } catch (e) {
        // Ignorar si la URL es inválida aquí, fallará en el fetch
      }

      const res = await fetch(fetchUrl, { 
        cache: "no-store",
        headers
      });
      
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      
      // Expected data format: Array<{ name: string, prices: { StoreName: number } }>
      // Or Record<string, { StoreName: number }>
      if (!data || typeof data !== "object") throw new Error("Formato inválido");
      
      setStore((s) => {
        const newItems = s.items.map(item => {
          // Normalize names to match or just use direct match
          let match = Array.isArray(data) 
            ? data.find((d: any) => d.name?.toLowerCase() === item.name.toLowerCase())
            : data[item.name] || data[item.name.toLowerCase()];
            
          if (match && match.prices) {
            return {
              ...item,
              prices: { ...item.prices, ...match.prices }
            };
          }
          return item;
        });
        
        return {
          ...s,
          items: newItems,
          lastSyncDate: new Date().toISOString()
        };
      });
    } catch (e: any) {
      console.error("Sync error:", e);
      setSyncError(e.message || "Error desconocido al sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  }, [store.syncUrl]);

  return {
    store,
    hydrated,
    toggleInList,
    toggleBought,
    addItem,
    removeItem,
    updateItem,
    finishTrip,
    saveCompletedTrip,
    deleteTrip,
    selectAll,
    clearList,
    restoreStore,
    resetToSeedCatalog,
    setSyncUrl,
    syncCatalogPrices,
    isSyncing,
    syncError,
    addCustomCategory,
    updateCategoryIcon,
    renameCategory,
    removeCategory,
    removeCustomCategory: removeCategory,
    addCustomStore,
    updateStoreIcon,
    renameStore,
    removeStore,
    removeCustomStore: removeStore,
  };
}






