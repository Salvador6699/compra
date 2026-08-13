import { useCallback, useEffect, useState } from "react";
import { SEED_ITEMS, type Category, type StoreName } from "./shopping-data";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  };
}

export function capitalize(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const useShoppingStoreBase = create<{
  store: Store;
  setStore: (updater: (s: Store) => Store) => void;
}>()(
  persist(
    (set) => ({
      store: seedStore(),
      setStore: (updater) => set((state) => ({ store: updater(state.store) })),
    }),
    {
      name: "shopping-app:v4",
    }
  )
);

export function useShoppingStore() {
  const { store, setStore } = useShoppingStoreBase();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const finishTrip = useCallback(() => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.bought ? { ...it, inList: false, bought: false } : it,
      ),
    }));
  }, []);

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

  const deleteTrip = useCallback((tripId: string) => {
    setStore((s) => ({
      ...s,
      trips: (s.trips ?? []).filter((t) => t.id !== tripId),
    }));
  }, []);

  const selectAll = useCallback(() => {
    setStore((s) => ({ ...s, items: s.items.map((it) => ({ ...it, inList: true })) }));
  }, []);

  const clearList = useCallback(() => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) => ({ ...it, inList: false, bought: false })),
    }));
  }, []);

  const restoreStore = useCallback((newStore: Store) => {
    setStore(() => newStore);
  }, []);

  const resetToSeedCatalog = useCallback(() => {
    const newSeed = seedStore();
    setStore(() => newSeed);
  }, []);

  const setSyncUrl = useCallback((url: string) => {}, []);
  const syncCatalogPrices = useCallback(async (silent: boolean = false) => {}, []);

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
    isSyncing: false,
    syncError: null,
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
