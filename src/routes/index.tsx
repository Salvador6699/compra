import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  Download,
  Eye,
  Filter,
  HardDrive,
  History,
  Image as ImageIcon,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  LogOut,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Sun,
  Moon,
  MapPin,
  Tag,
  Trash2,
  Upload,
  Wand,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { DynamicIcon } from "@/components/dynamic-icon";
import { IconPickerDialog } from "@/components/icon-picker-dialog";

/** Helper to compress uploaded images to max 400px width WebP to conserve LocalStorage space */
function compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CompletedTrip, Item, Store, TripItem } from "@/lib/use-shopping-store";
import { useShoppingStore } from "@/lib/use-shopping-store";
import {
  CATEGORIES,
  STORE_BADGE_STYLE,
  STORES,
  type Category,
  type StoreName,
} from "@/lib/shopping-data";
import { cn } from "@/lib/utils";
import { BasketCalculator } from "@/components/basket-calculator";
import { ItemRow } from "@/components/features/ItemRow";
import { EditCategoryOrStoreDialog } from "@/components/features/EditCategoryOrStoreDialog";
import { StoreFilterDialog } from "@/components/features/StoreFilterDialog";
import { ItemFormDialog } from "@/components/features/ItemFormDialog";
import { ItemDetailsDialog } from "@/components/features/ItemDetailsDialog";
import { CategoryTitle } from "@/components/features/CategoryTitle";
import { EmptyState } from "@/components/features/EmptyState";
import { BackupDialog } from "@/components/features/BackupDialog";
import { FinishTripDialog } from "@/components/features/FinishTripDialog";
import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";
import { toast, Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@tanstack/react-router";
import { useBackButton } from "@/hooks/use-back-button";


type TabValue = "compra" | "catalogo" | "historial" | "ajustes";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as TabValue) || "compra",
    }
  },
  head: () => ({
    meta: [
      { title: "Mi Lista de la Compra" },
      {
        name: "description",
        content:
          "Tu lista de la compra personal: compara precios por supermercado y organiza tus compras en Mercadona, Lidl, Carrefour y más.",
      },
      { property: "og:title", content: "Mi Lista de la Compra" },
      {
        property: "og:description",
        content:
          "Lista de la compra inteligente: compara precios, agrupa por supermercado y calcula tu ahorro total.",
      },
    ],
  }),
  component: Index,
});


/* ── EDIT CATEGORY OR STORE DIALOG (Name & Icon: Emoji or Image Upload) ── */
/* ── Emoji map for each category ── */
const CATEGORY_EMOJI: Record<string, string> = {
  "Bebidas": "🧃",
  "Carne y embutidos": "🥩",
  "Cuidado personal": "🧼",
  "Despensa": "🥫",
  "Frutas y verduras": "🥦",
  "Hogar y limpieza": "🧹",
  "Lácteos y huevos": "🥚",
  "Mascotas": "🐾",
  "Otros": "📦",
  "Panadería": "🥖",
  "Pescado": "🐟",
  "Platos preparados": "🍱",
  "Snacks y dulces": "🍿",
};


function Index() {
  const router = useRouter();
  const {
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
    addCustomCategory,
    updateCategoryIcon,
    renameCategory,
    removeCategory,
    addCustomStore,
    updateStoreIcon,
    renameStore,
    removeStore,
    setSyncUrl,
    syncCatalogPrices,
    isSyncing,
    syncError,
    setCurrentLocation,
  } = useShoppingStore();



  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  
  const setTab = (newTab: TabValue) => {
    navigate({ search: { tab: newTab } });
  };

  const [groupBy, setGroupBy] = useState<"category" | "store">(() => {
    return (localStorage.getItem("ui_groupBy") as any) || "category";
  });

  useEffect(() => {
    localStorage.setItem("ui_groupBy", groupBy);
  }, [groupBy]);

  // Multi-store filter state
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [storeFilterOpen, setStoreFilterOpen] = useState(false);

  // Search & Item Form modal
  const [search, setSearch] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Finish trip & receipt view modals
  const [finishTripModalOpen, setFinishTripModalOpen] = useState(false);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);

  // Theme toggle
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ui_theme") as any) || 
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("ui_theme", theme);
  }, [theme]);

  // Single expanded category (Grid vs List mode)
  const [selectedCategoryForGrid, setSelectedCategoryForGrid] = useState<string | null>(null);

  // Icon Picker Modal
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerCallback, setIconPickerCallback] = useState<{ fn: (icon: string) => void } | null>(null);

  function openIconPicker(callback: (icon: string) => void) {
    setIconPickerCallback({ fn: callback });
    setIconPickerOpen(true);
  }

  // Backup dialog
  const [backupOpen, setBackupOpen] = useState(false);

  // Edit Icon dialog
  const [editingIconTarget, setEditingIconTarget] = useState<{
    type: "category" | "store";
    name: string;
    icon: string;
  } | null>(null);
  
  const [viewingItemDetails, setViewingItemDetails] = useState<Item | null>(null);

  // Inputs for adding custom categories and stores in Ajustes
  const [newCatInput, setNewCatInput] = useState("");
  const [newCatIconInput, setNewCatIconInput] = useState("");
  const [newStoreInput, setNewStoreInput] = useState("");
  const [newStoreIconInput, setNewStoreIconInput] = useState("");


  const getCategoryIcon = useCallback(
    (cat: string) => {
      if (store.categoryIcons && store.categoryIcons[cat]) return store.categoryIcons[cat];
      if (CATEGORY_EMOJI[cat]) return CATEGORY_EMOJI[cat];
      return "📦";
    },
    [store.categoryIcons],
  );

  const getStoreIcon = useCallback(
    (st: string) => {
      if (store.storeIcons && store.storeIcons[st]) return store.storeIcons[st];
      if (STORE_BADGE_STYLE[st as StoreName]?.icon) return STORE_BADGE_STYLE[st as StoreName].icon;
      return "🏪";
    },
    [store.storeIcons],
  );
  const allCategories = useMemo(() => {
    const deleted = new Set(store.deletedCategories ?? []);
    const set = new Set([...CATEGORIES, ...(store.customCategories ?? [])]);
    return Array.from(set)
      .filter((c) => typeof c === "string" && !deleted.has(c))
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [store.customCategories, store.deletedCategories]);

  const allStores = useMemo(() => {
    const deleted = new Set(store.deletedStores ?? []);
    const set = new Set([...STORES, ...(store.customStores ?? [])]);
    return Array.from(set)
      .filter((s) => typeof s === "string" && !deleted.has(s))
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [store.customStores, store.deletedStores]);


  const listItems = useMemo(
    () => store.items.filter((i) => i.inList),
    [store.items],
  );

  const pending = useMemo(() => {
    let items = listItems.filter((i) => !i.bought);
    if (selectedStores.size > 0) {
      items = items.filter(
        (i) => i.preferredStore && selectedStores.has(i.preferredStore),
      );
    }
    return items;
  }, [listItems, selectedStores]);

  const done = listItems.filter((i) => i.bought);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = store.items;

    if (selectedStores.size > 0) {
      items = items.filter(
        (i) => i.preferredStore && selectedStores.has(i.preferredStore),
      );
    }

    if (q) {
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }

    return items.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [store.items, search, selectedStores]);

  // Group pending items by Category
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, typeof pending>();
    for (const it of pending) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return allCategories.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
  }, [pending, allCategories]);

  // Group pending items by Store
  const groupedByStore = useMemo(() => {
    const map = new Map<string, typeof pending>();
    for (const it of pending) {
      const key = it.preferredStore ?? "Sin supermercado asignado";
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }

    const result: { storeKey: string; items: typeof pending }[] = [];
    
    // First active stores in order
    for (const s of allStores) {
      if (map.has(s)) {
        result.push({
          storeKey: s,
          items: (map.get(s) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es")),
        });
      }
    }
    // Then unassigned
    if (map.has("Sin supermercado asignado")) {
      result.push({
        storeKey: "Sin supermercado asignado",
        items: (map.get("Sin supermercado asignado") ?? []).sort((a, b) =>
          a.name.localeCompare(b.name, "es"),
        ),
      });
    }

    return result;
  }, [pending, allStores]);

  const groupedCatalog = useMemo(() => {
    const map = new Map<string, typeof filteredCatalog>();
    for (const it of filteredCatalog) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return allCategories.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
  }, [filteredCatalog, allCategories]);


  // Auto-expand first category when searching
  useEffect(() => {
    const q = search.trim();
    if (q && groupedCatalog.length > 0) {
      setSelectedCategoryForGrid(groupedCatalog[0].category);
    } else if (!q) {
      setSelectedCategoryForGrid(null);
    }
  }, [search]);


  // Accordion toggle handler: only 1 category open at a time
  function toggleCategory(category: string) {
    setSelectedCategoryForGrid((prev) => (prev === category ? null : category));
  }

  function handleOpenAddModal() {
    setEditingItem(null);
    setItemDialogOpen(true);
  }

  function handleOpenEditModal(item: Item) {
    setEditingItem(item);
    setItemDialogOpen(true);
  }

  function handleSaveItem(
    name: string,
    category: Category,
    preferredStore: StoreName | undefined,
    formats: any[],
    note: string,
    existingItemId?: string
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore: preferredStore ?? undefined,
        note,
        formats,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore ?? undefined,
        formats,
        note,
        existingItemId
      );
    }

    // Business Logic: Smart Price Comparison
    if (formats && store.currentLocation) {
      for (const format of formats) {
        if (format.prices && format.prices[store.currentLocation] !== undefined) {
          const currentPrice = format.prices[store.currentLocation];
          let cheaperStore = null;
          let cheaperPrice = currentPrice;
          
          for (const [st, p] of Object.entries(format.prices)) {
             if (st !== store.currentLocation && p !== undefined && typeof p === "number" && p < cheaperPrice) {
                 cheaperPrice = p;
                 cheaperStore = st;
             }
          }
          
          if (cheaperStore) {
             toast(`💡 Recuerda: Este formato está más barato en ${cheaperStore} (${cheaperPrice.toFixed(2)}€) que en ${store.currentLocation} (${currentPrice.toFixed(2)}€)`, {
               duration: 6000,
               style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' },
             });
          }
        }
      }
    }

    setItemDialogOpen(false);
    setEditingItem(null);
  }


  const totalItemsCount = listItems.length;
  const boughtCount = done.length;
  const progress = totalItemsCount === 0 ? 0 : Math.round((boughtCount / totalItemsCount) * 100);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium">Cargando tu lista de la compra…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg text-foreground pb-24 font-sans antialiased transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/40 shadow-sm pt-safe">
        {/* Global Location Bar */}
        <div className="bg-primary/5 border-b border-border/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
            <MapPin className="h-3 w-3" />
            <span>UBICACIÓN ACTUAL</span>
          </div>
          <Select
            value={store.currentLocation || "Casa"}
            onValueChange={setCurrentLocation}
          >
            <SelectTrigger className="w-auto h-8 text-xs font-bold bg-background border-border/60 shadow-sm gap-2 border-0">
              <SelectValue placeholder="Selecciona ubicación" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Casa">
                <div className="flex items-center gap-2">
                  <span>🏠</span>
                  <span>Casa</span>
                </div>
              </SelectItem>
              {allStores.map(st => (
                <SelectItem key={st} value={st}>
                  <div className="flex items-center gap-2">
                    <DynamicIcon icon={getStoreIcon(st)} fallback="🏪" className="h-4 w-4 object-contain rounded-sm" />
                    <span>{st}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-accent grid place-items-center text-primary-foreground shadow-md shadow-primary/30">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Mi Lista de la Compra</h1>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                {listItems.length} en compra · {store.items.length} catálogo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl h-9 w-9 bg-card/80 text-muted-foreground hover:text-foreground border border-border/50 shadow-xs backdrop-blur-md transition-transform active:scale-95"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>

            {/* Filter by Stores button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStoreFilterOpen(true)}
              className={cn(
                "rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 border-border/60 transition-all shadow-xs",
                selectedStores.size > 0
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>
                {selectedStores.size === 0
                  ? "Todas las tiendas"
                  : `${selectedStores.size} ${selectedStores.size === 1 ? "tienda" : "tiendas"}`}
              </span>
            </Button>
          </div>
        </div>

        {/* Selected Store Badges strip */}
        <div className="mx-auto max-w-2xl px-4 pb-2.5 pt-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-wrap">
          {selectedStores.size === 0 || selectedStores.size === allStores.length ? (
            <Badge
              variant="outline"
              className="text-[11px] px-2.5 py-0.5 rounded-lg border-muted bg-muted/40 font-medium text-muted-foreground"
            >
              🏷️ Todas las tiendas
            </Badge>
          ) : (
            <>
              <span className="text-[11px] text-muted-foreground font-medium mr-0.5">Filtrando:</span>
              {Array.from(selectedStores).map((s) => {
                const badge = (s && STORE_BADGE_STYLE[s as StoreName]) || { bg: "bg-muted", text: "text-muted-foreground" };
                return (
                  <Badge
                    key={s}
                    variant="outline"
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 shadow-sm",
                      badge.bg,
                      badge.text,
                    )}
                  >
                    <DynamicIcon icon={getStoreIcon(s)} fallback="🏪" className="h-3.5 w-3.5 object-cover rounded-sm" />
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedStores);
                        next.delete(s);
                        setSelectedStores(next);
                      }}
                      className="ml-1 hover:opacity-75"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedStores(new Set())}
                className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 font-medium"
              >
                Limpiar todo
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-2xl px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "compra" | "catalogo" | "ajustes")}>


          {/* ── COMPRA DE HOY ── */}
          <TabsContent value="compra" className="space-y-4 mt-4">
            {/* Basket Comparator Card */}
            <BasketCalculator items={listItems} allStores={allStores} getStoreIcon={getStoreIcon} />

            {listItems.length > 0 && (
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                    Organizar por:
                  </span>
                  <div className="inline-flex rounded-lg bg-muted p-1 gap-1 border border-border/40">
                    <button
                      type="button"
                      onClick={() => setGroupBy("category")}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        groupBy === "category"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      🥦 Categoría
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupBy("store")}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        groupBy === "store"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      🛒 Supermercado
                    </button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("¿Vaciar la lista de la compra de hoy? (Los productos seguirán guardados en el catálogo)")) {
                      clearList();
                    }
                  }}
                  className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 h-8 gap-1.5 px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Vaciar compra</span>
                </Button>
              </div>
            )}


            {listItems.length === 0 ? (
              <EmptyState
                title="Lista de hoy vacía"
                description="Ve al Catálogo y marca los productos que necesitas comprar hoy."
                actionLabel="Abrir catálogo"
                onAction={() => setTab("catalogo")}
              />
            ) : (
              <>
                {/* GROUPED BY CATEGORY */}
                {groupBy === "category" &&
                  groupedByCategory.map(({ category, items }) => (
                    <section key={category} className="animate-in fade-in-0 duration-300">
                      <CategoryTitle icon={getCategoryIcon(category)} count={items.length}>
                        {category}
                      </CategoryTitle>
                      <ul className="space-y-2">
                        {items.map((it) => (
                          <ItemRow
                            key={it.id}
                            item={it}
                            getStoreIcon={getStoreIcon}
                            onToggleBought={() => toggleBought(it.id)}
                            onToggleInList={() => toggleInList(it.id)}
                            onEdit={() => handleOpenEditModal(it)}
                            onViewDetails={() => setViewingItemDetails(it)}
                          />
                        ))}
                      </ul>
                    </section>
                  ))}

                {/* GROUPED BY STORE */}
                {groupBy === "store" &&
                  groupedByStore.map(({ storeKey, items }) => {
                    const isKnownStore = storeKey !== "Sin supermercado asignado";
                    const badge = (isKnownStore && STORE_BADGE_STYLE[storeKey as StoreName]) || {
                      icon: "🏪",
                      bg: "bg-muted",
                      text: "text-muted-foreground",
                    };

                    return (
                      <section key={storeKey} className="animate-in fade-in-0 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 shadow-sm",
                              badge.bg,
                              badge.text,
                            )}
                          >
                            <DynamicIcon icon={getStoreIcon(storeKey)} fallback="🏪" className="h-4 w-4 object-cover rounded-md" />
                            <span>{storeKey}</span>
                            <span className="opacity-80">({items.length})</span>
                          </Badge>
                        </div>

                        <ul className="space-y-2">
                          {items.map((it) => (
                            <ItemRow
                              key={it.id}
                              item={it}
                              getStoreIcon={getStoreIcon}
                              onToggleBought={() => toggleBought(it.id)}
                              onToggleInList={() => toggleInList(it.id)}
                              onEdit={() => handleOpenEditModal(it)}
                              onViewDetails={() => setViewingItemDetails(it)}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}

                {/* BOUGHT ITEMS SECTION */}
                {done.length > 0 && (
                  <section className="pt-4 border-t border-border/60 animate-in fade-in-0 duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        Comprados ({done.length})
                      </h2>
                      <button
                        type="button"
                        onClick={finishTrip}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Limpiar comprados
                      </button>
                    </div>
                    <ul className="space-y-2 opacity-75">
                      {done.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/40 px-3.5 py-2.5 transition-all duration-150"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleBought(it.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") toggleBought(it.id);
                            }}
                            className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                          >
                            <span className="h-6 w-6 rounded-full bg-primary border-2 border-primary text-primary-foreground grid place-items-center shrink-0">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm font-medium text-muted-foreground line-through truncate">
                              {it.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleInList(it.id)}
                            aria-label={`Quitar ${it.name} de la lista`}
                            className="text-muted-foreground/50 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-all duration-150"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* Botón destacado para Finalizar y Guardar en Historial */}
                    <div className="pt-2">
                      <Button
                        onClick={() => setFinishTripModalOpen(true)}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20 h-11 text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Finalizar compra y guardar en historial ({done.length})
                      </Button>
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>


          {/* ── CATÁLOGO ── */}
          <TabsContent value="catalogo" className="space-y-4 mt-4">
            {/* Search & Add New Product Card */}
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar producto por nombre..."
                      className="pl-9 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleOpenAddModal}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold shadow-md shadow-primary/20 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Añadir nuevo producto
                </Button>
              </div>
            </div>

            {/* Catalog Grid vs List View */}
            {!selectedCategoryForGrid ? (
              <div className="grid grid-cols-2 gap-3 pb-8 animate-in fade-in zoom-in-95 duration-300">
                {groupedCatalog.map(({ category, items }) => {
                  const inListCount = items.filter((i) => i.inList).length;
                  return (
                    <div
                      key={category}
                      onClick={() => setSelectedCategoryForGrid(category)}
                      className="group flex flex-col items-center justify-center gap-2 rounded-3xl bg-card border border-border/40 p-4 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
                        <DynamicIcon
                          icon={getCategoryIcon(category)}
                          fallback="📦"
                          className="h-8 w-8 object-cover rounded-xl"
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground text-center line-clamp-1">{category}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary/60 border-0">
                          {items.length} prod
                        </Badge>
                        {inListCount > 0 && (
                          <Badge className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold shadow-sm border-0">
                            {inListCount} lista
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 pb-8 animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="flex items-center mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCategoryForGrid(null)}
                    className="rounded-full pl-2 pr-4 h-9 font-bold hover:bg-muted text-muted-foreground hover:text-foreground -ml-2 transition-transform active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Volver a Categorías
                  </Button>
                </div>
                
                {groupedCatalog.filter(g => g.category === selectedCategoryForGrid).map(({ category, items }) => {
                  const currentIndex = groupedCatalog.findIndex(g => g.category === category);
                  const hasPrev = currentIndex > 0;
                  const hasNext = currentIndex < groupedCatalog.length - 1;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <Button
                          variant="default"
                          size="icon"
                          disabled={!hasPrev}
                          onClick={() => hasPrev && setSelectedCategoryForGrid(groupedCatalog[currentIndex - 1].category)}
                          className="rounded-full h-10 w-10 shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        <div className="flex items-center justify-center gap-3 flex-1">
                          <DynamicIcon
                            icon={getCategoryIcon(category)}
                            fallback="📦"
                            className="h-8 w-8 object-cover rounded-xl shadow-sm"
                          />
                          <h2 className="text-xl font-extrabold text-foreground text-center line-clamp-1">{category}</h2>
                        </div>
                        
                        <Button
                          variant="default"
                          size="icon"
                          disabled={!hasNext}
                          onClick={() => hasNext && setSelectedCategoryForGrid(groupedCatalog[currentIndex + 1].category)}
                          className="rounded-full h-10 w-10 shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    <ul className="space-y-2">
                      {items.map((it) => (
                        <ItemRow
                          key={it.id}
                          item={it}
                          mode="catalogo"
                          getStoreIcon={getStoreIcon}
                          onToggleInList={() => toggleInList(it.id)}
                          onToggleBought={() => toggleBought(it.id)}
                          onEdit={() => handleOpenEditModal(it)}
                          onViewDetails={() => setViewingItemDetails(it)}
                          onDelete={() => removeItem(it.id)}
                        />
                      ))}
                    </ul>
                  </div>
                )})}
              </div>
            )}
          </TabsContent>

          {/* ── HISTORIAL DE COMPRAS ── */}
          <TabsContent value="historial" className="space-y-4 mt-4 animate-in fade-in-0 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Receipt className="h-4 w-4 text-primary" />
                Historial de compras realizadas
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                {(store.trips ?? []).length} compras guardadas
              </span>
            </div>

            {(store.trips ?? []).length === 0 ? (
              <EmptyState
                title="Sin historial de compras"
                description="Al finalizar tu compra en la pestaña 'Compra hoy', podrás guardar el resumen con desglose por supermercado y la foto del ticket aquí."
                actionLabel="Ir a Compra hoy"
                onAction={() => setTab("compra")}
              />
            ) : (
              <div className="space-y-3">
                {(store.trips ?? []).map((t) => {
                  const formattedDate = new Date(t.date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const primaryStoreBadge =
                    t.storeName && t.storeName !== "Varios"
                      ? STORE_BADGE_STYLE[t.storeName as StoreName]
                      : { bg: "bg-muted", text: "text-muted-foreground" };

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2.5 py-0.5 rounded-lg border font-bold flex items-center gap-1.5 shadow-sm",
                                primaryStoreBadge?.bg ?? "bg-muted",
                                primaryStoreBadge?.text ?? "text-muted-foreground",
                              )}
                            >
                              <DynamicIcon icon={getStoreIcon(t.storeName ?? "")} fallback="🛒" className="h-4 w-4 object-cover rounded-md" />
                              <span>{t.storeName ?? "Compra"}</span>
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formattedDate}
                            </span>
                          </div>
                          {t.note && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                              🏷️ {t.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-extrabold text-primary">
                            {t.grandTotal > 0 ? `${t.grandTotal.toFixed(2)}€` : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("¿Eliminar este registro de compra del historial?")) {
                                deleteTrip(t.id);
                              }
                            }}
                            className="text-muted-foreground/40 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-all"
                            aria-label="Eliminar del historial"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ticket Image & Store Totals */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-border/40">
                        {t.receiptImage ? (
                          <button
                            type="button"
                            onClick={() => setViewingReceiptImage(t.receiptImage!)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-xs font-semibold text-primary"
                          >
                            <Receipt className="h-4 w-4" />
                            <span>Ver Foto del Ticket</span>
                            <Eye className="h-3.5 w-3.5 ml-0.5 opacity-70" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Sin foto de ticket</span>
                        )}

                        {/* Breakdown per store */}
                        {Object.keys(t.storeTotals ?? {}).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(t.storeTotals).map(([st, val]) => (
                              <span
                                key={st}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-semibold inline-flex items-center gap-1"
                              >
                                <DynamicIcon icon={getStoreIcon(st)} fallback="🏪" className="h-3 w-3 object-cover rounded-sm" />
                                {st}: {val ? `${val.toFixed(2)}€` : "—"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Items List Collapsible */}
                      {t.items && t.items.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="w-full text-left text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1">
                            <span>Ver {t.items.length} productos comprados</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2 space-y-1 text-xs">
                            {t.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-muted/30 text-muted-foreground"
                              >
                                <span>{it.name}</span>
                                {it.price ? (
                                  <span className="font-semibold text-foreground">{it.price.toFixed(2)}€</span>
                                ) : null}
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── AJUSTES ── */}
          <TabsContent value="ajustes" className="space-y-4 mt-4 animate-in fade-in-0 duration-300">
            {/* Gestión de Categorías y Supermercados Personalizados */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4 text-primary" />
                Categorías y Supermercados Personalizados
              </h2>

              {/* Añadir Categoría */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Añadir nueva categoría</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {allCategories.length} categorías activas
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative w-24 shrink-0 flex items-center">
                    <Input
                      placeholder="Icono (ej: 🍦)"
                      value={newCatIconInput}
                      onChange={(e) => setNewCatIconInput(e.target.value)}
                      className="w-full rounded-xl text-xs text-center pr-8"
                    />
                    <button 
                      type="button" 
                      title="Elegir icono predefinido"
                      onClick={() => openIconPicker(setNewCatIconInput)}
                      className="absolute right-1 p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                    >
                      <Wand className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    placeholder="Ej: Congelados, Farmacia, Bebé..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCatInput.trim()) {
                        addCustomCategory(newCatInput, newCatIconInput);
                        setNewCatInput("");
                        setNewCatIconInput("");
                      }
                    }}
                    className="rounded-xl text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newCatInput.trim()) {
                        addCustomCategory(newCatInput, newCatIconInput);
                        setNewCatInput("");
                        setNewCatIconInput("");
                      }
                    }}
                    disabled={!newCatInput.trim()}
                    className="rounded-xl text-xs shrink-0 bg-primary font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir
                  </Button>
                </div>

                {/* Lista Completa de Categorías Activas */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {allCategories.map((cat) => {
                    const count = store.items.filter((i) => i.category === cat).length;
                    const icon = getCategoryIcon(cat);
                    return (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card text-xs font-semibold border border-border/60 shadow-xs"
                      >
                        <DynamicIcon icon={icon} fallback="📦" className="h-4.5 w-4.5 object-cover rounded-md" />
                        <span>{cat}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          ({count} p.)
                        </span>
                        
                        {/* Botón editar icono (Emoji o Foto) */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIconTarget({
                              type: "category",
                              name: cat,
                              icon: getCategoryIcon(cat),
                            });
                          }}
                          title="Cambiar icono (Emoji o Imagen)"
                          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded hover:bg-muted ml-0.5"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        {/* Botón eliminar */}
                        <button
                          type="button"
                          onClick={() => {
                            if (count > 0) {
                              alert(
                                `No se puede eliminar la categoría "${cat}" porque tiene ${count} producto(s) vinculado(s) en el catálogo.`,
                              );
                            } else if (confirm(`¿Eliminar la categoría "${cat}"?`)) {
                              removeCategory(cat);
                            }
                          }}
                          title={
                            count > 0
                              ? `Tiene ${count} productos ligados`
                              : `Eliminar categoría ${cat}`
                          }
                          className={cn(
                            "p-0.5 rounded hover:bg-destructive/10 transition-colors",
                            count > 0
                              ? "text-muted-foreground/30 cursor-not-allowed"
                              : "text-muted-foreground hover:text-destructive",
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Añadir Supermercado */}
              <div className="space-y-2 pt-3 border-t border-border/40">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Añadir nuevo supermercado / tienda</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {allStores.length} tiendas activas
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative w-24 shrink-0 flex items-center">
                    <Input
                      placeholder="Icono (ej: 🏪)"
                      value={newStoreIconInput}
                      onChange={(e) => setNewStoreIconInput(e.target.value)}
                      className="w-full rounded-xl text-xs text-center pr-8"
                    />
                    <button 
                      type="button" 
                      title="Elegir icono predefinido"
                      onClick={() => openIconPicker(setNewStoreIconInput)}
                      className="absolute right-1 p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                    >
                      <Wand className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    placeholder="Ej: AhorraMas, Hipercor, Coviran..."
                    value={newStoreInput}
                    onChange={(e) => setNewStoreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newStoreInput.trim()) {
                        addCustomStore(newStoreInput, newStoreIconInput);
                        setNewStoreInput("");
                        setNewStoreIconInput("");
                      }
                    }}
                    className="rounded-xl text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newStoreInput.trim()) {
                        addCustomStore(newStoreInput, newStoreIconInput);
                        setNewStoreInput("");
                        setNewStoreIconInput("");
                      }
                    }}
                    disabled={!newStoreInput.trim()}
                    className="rounded-xl text-xs shrink-0 bg-primary font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir
                  </Button>
                </div>

                {/* Lista Completa de Supermercados Activos */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {allStores.map((st) => {
                    const count = store.items.filter(
                      (i) =>
                        i.preferredStore === st ||
                        (i.formats?.[0]?.prices &&
                          i.formats?.[0]?.prices[st as StoreName] !== undefined &&
                          i.formats?.[0]?.prices[st as StoreName]! > 0),
                    ).length;
                    const icon = getStoreIcon(st);

                    return (
                      <span
                        key={st}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card text-xs font-semibold border border-border/60 shadow-xs"
                      >
                        <DynamicIcon icon={icon} fallback="🏪" className="h-4.5 w-4.5 object-cover rounded-md" />
                        <span>{st}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          ({count} p.)
                        </span>

                        {/* Botón editar icono (Emoji o Foto) */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIconTarget({
                              type: "store",
                              name: st,
                              icon: getStoreIcon(st),
                            });
                          }}
                          title="Cambiar icono (Emoji o Imagen)"
                          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded hover:bg-muted ml-0.5"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        {/* Botón eliminar */}
                        <button
                          type="button"
                          onClick={() => {
                            if (count > 0) {
                              alert(
                                `No se puede eliminar la tienda "${st}" porque tiene ${count} producto(s) vinculado(s) en el catálogo.`,
                              );
                            } else if (confirm(`¿Eliminar la tienda "${st}"?`)) {
                              removeStore(st);
                            }
                          }}
                          title={
                            count > 0
                              ? `Tiene ${count} productos ligados`
                              : `Eliminar tienda ${st}`
                          }
                          className={cn(
                            "p-0.5 rounded hover:bg-destructive/10 transition-colors",
                            count > 0
                              ? "text-muted-foreground/30 cursor-not-allowed"
                              : "text-muted-foreground hover:text-destructive",
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>


            </div>

            {/* Sincronización con Servidor Central (PHP/MySQL) */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <HardDrive className="h-4 w-4 text-primary" />
                Sincronización de Precios
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conecta con tu servidor central (PHP/MySQL) para descargar los últimos precios del catálogo. 
                Si eres el administrador, sube aquí tus precios extraídos (scraping).
              </p>
              
              <div className="space-y-2 pt-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">URL del Servidor</Label>
                <div className="flex gap-2">
                  <Input 
                    type="url" 
                    placeholder="https://tuhosting.com/backend/api.php" 
                    value={store.syncUrl || ""} 
                    onChange={(e) => setSyncUrl(e.target.value)}
                    className="flex-1 rounded-xl text-xs bg-muted/30"
                  />
                  <Button 
                    type="button"
                    onClick={() => syncCatalogPrices(false)}
                    disabled={isSyncing || !store.syncUrl}
                    className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {isSyncing ? (
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isSyncing ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                </div>
                {syncError && (
                  <p className="text-[11px] text-destructive font-medium mt-1">Error: {syncError}</p>
                )}
                {store.lastSyncDate && !syncError && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    Última sincronización: {new Date(store.lastSyncDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Seccion Copia de Seguridad y Catálogo */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">

              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <HardDrive className="h-4 w-4 text-primary" />
                Copia de seguridad y Catálogo
              </h2>
              <p className="text-xs text-muted-foreground">
                Guarda tus productos y precios o restaura el catálogo oficial en cualquier momento.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBackupOpen(true)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center shrink-0">
                    <Download className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Gestor de Copias (.json)</p>
                    <p className="text-[11px] text-muted-foreground">Descargar o subir archivo de copia</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "¿Restablecer todo el catálogo con la lista oficial consolidada de tus tickets?\n\nSe actualizará la lista de productos al catálogo oficial base.",
                      )
                    ) {
                      resetToSeedCatalog();
                    }
                  }}
                  className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 text-left hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Restaurar Catálogo Base Oficial
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                      Recupera los ~115 productos acordados de los tickets
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Acciones Rápidas de Lista */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Gestión de la Compra
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("¿Poner TODOS los productos del catálogo en la lista de hoy?")) {
                      selectAll();
                      setTab("compra");
                    }
                  }}
                  className="rounded-xl text-xs font-semibold border-border/60 justify-start h-10"
                >
                  <CheckCheck className="h-4 w-4 mr-2 text-emerald-600" />
                  Seleccionar todo el catálogo
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("¿Vaciar la lista de la compra de hoy? (Los productos se mantienen en el catálogo)")) {
                      clearList();
                    }
                  }}
                  className="rounded-xl text-xs font-semibold border-border/60 text-destructive hover:bg-destructive/10 justify-start h-10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Vaciar lista de hoy
                </Button>
              </div>
            </div>

            {/* Info App */}
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-center space-y-1 mt-6">
              <p className="text-xs font-semibold text-foreground">Mi Lista de la Compra Compartida v3.0</p>
              <p className="text-[11px] text-muted-foreground">
                {store.items.length} productos en catálogo · {listItems.length} en la compra
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── FIXED BOTTOM NAVIGATION BAR (FLOATING DOCK) ── */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-3xl bg-background/70 backdrop-blur-2xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        <div className="px-2 py-2 flex items-center justify-around gap-1">
          {/* Compra hoy */}
          <button
            type="button"
            onClick={() => setTab("compra")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 relative",
              tab === "compra"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {pending.length > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center min-w-[16px] shadow-sm border",
                  tab === "compra" ? "bg-background text-primary border-primary/20" : "bg-primary text-primary-foreground border-border/50"
                )}>
                  {pending.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Compra</span>
          </button>

          {/* Catálogo */}
          <button
            type="button"
            onClick={() => {
              setTab("catalogo");
              setSelectedCategoryForGrid(null); // Reset to grid view when tapping tab
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 relative",
              tab === "catalogo"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <div className="relative">
              <ClipboardList className="h-5 w-5" />
              <span className={cn(
                "absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center min-w-[16px] border",
                tab === "catalogo" ? "bg-background text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/50"
              )}>
                {store.items.length}
              </span>
            </div>
            <span className="text-[10px] font-bold">Catálogo</span>
          </button>

          {/* Historial */}
          <button
            type="button"
            onClick={() => setTab("historial")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 relative",
              tab === "historial"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <div className="relative">
              <Receipt className="h-5 w-5" />
              {(store.trips ?? []).length > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center min-w-[16px] shadow-sm border",
                  tab === "historial" ? "bg-background text-primary border-primary/20" : "bg-primary text-primary-foreground border-border/50"
                )}>
                  {(store.trips ?? []).length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Historial</span>
          </button>

          {/* Ajustes */}
          <button
            type="button"
            onClick={() => setTab("ajustes")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 relative",
              tab === "ajustes"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-bold">Ajustes</span>
          </button>
        </div>
      </nav>



      {/* ── MODALS ── */}

      {/* Store Filter Dialog */}
      <StoreFilterDialog
        open={storeFilterOpen}
        allStores={allStores}
        getStoreIcon={getStoreIcon}
        onClose={() => setStoreFilterOpen(false)}
        selectedStores={selectedStores}
        onChangeSelectedStores={setSelectedStores}
      />


      {/* Item Form Dialog (Add / Edit Product) */}
      <ItemFormDialog
        open={itemDialogOpen}
        item={editingItem}
        allCategories={allCategories}
        allStores={allStores}
        getCategoryIcon={getCategoryIcon}
        getStoreIcon={getStoreIcon}
        onAddCategory={addCustomCategory}
        onAddStore={addCustomStore}
        onClose={() => setItemDialogOpen(false)}
        onSave={handleSaveItem}
      />



      {/* Finish Trip Dialog */}
      <FinishTripDialog
        open={finishTripModalOpen}
        onClose={() => setFinishTripModalOpen(false)}
        boughtItems={done}
        onSaveTrip={saveCompletedTrip}
        allStores={allStores}
        getStoreIcon={getStoreIcon}
      />

      {/* Full Ticket Receipt Viewer */}
      <ReceiptViewerDialog
        image={viewingReceiptImage}
        onClose={() => setViewingReceiptImage(null)}
      />

      {/* Backup Dialog */}
      <BackupDialog
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        store={store}
        onRestore={restoreStore}
        onResetToSeed={resetToSeedCatalog}
      />

      {/* Edit Category or Store Dialog (name + icon) */}
      <EditCategoryOrStoreDialog
        open={!!editingIconTarget}
        type={editingIconTarget?.type ?? "category"}
        currentName={editingIconTarget?.name ?? ""}
        currentIcon={editingIconTarget?.icon ?? ""}
        onClose={() => setEditingIconTarget(null)}
        onSave={(newName, newIcon) => {
          if (!editingIconTarget) return;
          const oldName = editingIconTarget.name;
          if (editingIconTarget.type === "category") {
            renameCategory(oldName, newName, newIcon);
          } else {
            renameStore(oldName, newName, newIcon);
          }
        }}
      />
      
      {/* Item Details Dialog */}
      <ItemDetailsDialog
        item={viewingItemDetails}
        open={!!viewingItemDetails}
        onClose={() => setViewingItemDetails(null)}
        getStoreIcon={getStoreIcon}
        getCategoryIcon={getCategoryIcon}
      />

      <Toaster position="top-center" />
      <IconPickerDialog
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(icon) => {
          if (iconPickerCallback) {
            iconPickerCallback.fn(icon);
          }
        }}
      />
    </div>
  );
}


/* ── STORE FILTER DIALOG ── */
/* ── ITEM FORM DIALOG (Add / Edit Product) ── */
/* ── Item Row Component for Shopping List ── */
/* ── Category Title Component ── */
/* ── Empty State Component ── */
/* ── BACKUP DIALOG ── */
/* ── FINISH TRIP DIALOG (Save purchase to history) ── */
/* ── RECEIPT VIEWER DIALOG ── */