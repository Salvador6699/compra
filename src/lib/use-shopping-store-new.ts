import { useCallback, useEffect, useState } from "react";
import { SEED_ITEMS, type Category, type StoreName } from "./shopping-data";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Unit = "u" | "kg" | "g" | "L" | "ml";

export type ProductFormat = {
  id: string;
  barcode?: string;
  name: string;
  size: number;
  unit: Unit;
  image?: string;
  prices: Partial<Record<StoreName, number>>;
};

export type Item = {
  id: string;
  name: string;
  category: Category;
  inList: boolean;
  bought: boolean;
  preferredStore?: StoreName;
  note?: string;
  quantity?: number;
  formats: ProductFormat[];
  selectedFormatId?: string | null;
};

export type TripItem = {
  name: string;
  category: Category;
  preferredStore?: StoreName;
  price?: number;
  quantity?: number;
  formatId?: string | null;
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
  currentLocation: "Casa" | string;
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
    currentLocation: "Casa",
    items: SEED_ITEMS.map((s) => ({
      id: makeId(),
      name: s.name,
      category: s.category,
      inList: false,
      bought: false,
      preferredStore: s.preferredStore,
      formats: [
        {
          id: makeId(),
          name: "Formato por defecto",
          size: 1,
          unit: "u",
          prices: s.prices ?? {},
        }
      ],
      selectedFormatId: null,
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
      name: "shopping-app:v5",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const store = persistedState.store || {};
          const migratedItems = (store.items || []).map((it: any) => {
            const formats = it.formats || [];
            if (formats.length === 0) {
              formats.push({
                id: makeId(),
                name: "Por defecto",
                size: 1,
                unit: "u",
                image: it.image,
                prices: it.prices || {}
              });
            }
            return {
              ...it,
              formats,
              selectedFormatId: it.inList ? formats[0].id : null
            };
          });
          return {
            ...persistedState,
            store: {
              ...store,
              items: migratedItems,
              currentLocation: "Casa",
            }
          };
        }
        return persistedState;
      }
    }
  )
);

export function useShoppingStore() {
  const { store, setStore } = useShoppingStoreBase();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const setCurrentLocation = useCallback((loc: string) => {
    setStore((s) => ({ ...s, currentLocation: loc }));
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

        const nextFormats = it.formats.map(f => {
           if (f.prices[oldName as StoreName] !== undefined) {
             const newPrices = { ...f.prices };
             newPrices[trimmedNew as StoreName] = newPrices[oldName as StoreName];
             delete newPrices[oldName as StoreName];
             return { ...f, prices: newPrices };
           }
           return f;
        });

        return {
          ...it,
          preferredStore: updatedStore,
          formats: nextFormats,
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
          it.formats.some(f => f.prices[storeName as StoreName] !== undefined && f.prices[storeName as StoreName]! > 0)
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

  const toggleInList = useCallback((id: string, selectedFormatId?: string) => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) => {
        if (it.id === id) {
          const nowInList = !it.inList;
          return { 
            ...it, 
            inList: nowInList, 
            bought: nowInList ? false : it.bought,
            selectedFormatId: nowInList ? (selectedFormatId ?? (it.formats[0]?.id || null)) : null,
            quantity: 1
          };
        }
        return it;
      }),
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
      formats?: ProductFormat[],
      note?: string,
    ) => {
      const trimmed = capitalize(name);
      if (!trimmed) return;
      
      setStore((s) => {
        const existing = s.items.find((it) => it.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
          return {
            ...s,
            items: s.items.map((it) =>
              it.name.toLowerCase() === trimmed.toLowerCase()
                ? {
                    ...it,
                    inList: true,
                    preferredStore: preferredStore ?? it.preferredStore,
                    note: note !== undefined ? note : it.note,
                    formats: formats ? formats : it.formats, // In future we merge formats
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
              formats: formats ?? [],
              note,
              quantity: 1,
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
        formats?: ProductFormat[];
        note?: string;
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
            formats: patch.formats ?? it.formats,
            note: patch.note !== undefined ? patch.note : it.note,
          };
        }),
      }));
    },
    [],
  );

  const updateQuantity = useCallback((id: string, delta: number) => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) => {
        if (it.id !== id) return it;
        
        const activeFormat = it.formats.find(f => f.id === it.selectedFormatId) || it.formats[0];
        const minQty = activeFormat && (activeFormat.unit === "kg" || activeFormat.unit === "L") ? 0.1 : 1;
        
        let newQty = (it.quantity || minQty) + delta;
        // Fix JS floating point issues
        newQty = Math.round(newQty * 100) / 100;
        
        return { ...it, quantity: Math.max(minQty, newQty) };
      }),
    }));
  }, []);
  
  const setQuantity = useCallback((id: string, qty: number) => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) => {
        if (it.id !== id) return it;
        return { ...it, quantity: Math.max(0.1, qty) };
      }),
    }));
  }, []);

  const finishTrip = useCallback(() => {
    setStore((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.bought ? { ...it, inList: false, bought: false, selectedFormatId: null } : it,
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
          it.bought ? { ...it, inList: false, bought: false, selectedFormatId: null } : it,
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
      items: s.items.map((it) => ({ ...it, inList: false, bought: false, selectedFormatId: null })),
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
    setCurrentLocation,
    toggleInList,
    toggleBought,
    addItem,
    removeItem,
    updateItem,
    updateQuantity,
    setQuantity,
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
