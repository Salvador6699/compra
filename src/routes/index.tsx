import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
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
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Helper to compress uploaded images to max 400px width JPEG to conserve LocalStorage space */
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
        resolve(canvas.toDataURL("image/jpeg", quality));
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


export const Route = createFileRoute("/")({
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

/* ── Emoji map for each category ── */
const CATEGORY_EMOJI: Record<Category, string> = {
  "Despensa": "🫙",
  "Panadería": "🥖",
  "Carne y embutidos": "🥩",
  "Pescado": "🐟",
  "Lácteos y huevos": "🥛",
  "Frutas y verduras": "🥦",
  "Platos preparados": "🍝",
  "Bebidas": "🥤",
  "Snacks y dulces": "🍿",
  "Mascotas": "🐱",
  "Hogar y limpieza": "🧹",
  "Cuidado personal": "🧴",
  "Otros": "📦",
};

function Index() {
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
  } = useShoppingStore();

  const [tab, setTab] = useState<"compra" | "catalogo" | "historial" | "ajustes">("compra");

  const [groupBy, setGroupBy] = useState<"category" | "store">("category");

  // Multi-store filter state
  const [selectedStores, setSelectedStores] = useState<Set<StoreName>>(new Set());
  const [storeFilterOpen, setStoreFilterOpen] = useState(false);

  // Search & Item Form modal
  const [search, setSearch] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Finish trip & receipt view modals
  const [finishTripModalOpen, setFinishTripModalOpen] = useState(false);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);

  // Single expanded category (Accordion mode)
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);

  // Backup dialog
  const [backupOpen, setBackupOpen] = useState(false);


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
    const map = new Map<Category, typeof pending>();
    for (const it of pending) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
  }, [pending]);

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
    for (const s of STORES) {
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
  }, [pending]);

  const groupedCatalog = useMemo(() => {
    const map = new Map<Category, typeof filteredCatalog>();
    for (const it of filteredCatalog) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
  }, [filteredCatalog]);

  // Auto-expand category when searching
  useEffect(() => {
    const q = search.trim();
    if (q) {
      if (groupedCatalog.length > 0) {
        setExpandedCategory(groupedCatalog[0].category);
      }
    } else {
      setExpandedCategory(null);
    }
  }, [search, groupedCatalog]);

  // Accordion toggle handler: only 1 category open at a time
  function toggleCategory(category: Category) {
    setExpandedCategory((prev) => (prev === category ? null : category));
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
    preferredStore: StoreName | null,
    prices: Partial<Record<StoreName, number>>,
    note: string,
    image?: string | null,
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore,
        prices,
        note,
        image,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore === null ? undefined : preferredStore,
        prices,
        note,
        image ?? undefined,
      );
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
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-primary/20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 grid place-items-center text-primary-foreground shadow-sm shadow-primary/30">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Mi Lista de la Compra</h1>
              <p className="text-xs text-muted-foreground">
                {listItems.length === 0
                  ? "Catálogo listo"
                  : `${pending.length} pendientes · ${done.length} en carrito`}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <button
              type="button"
              onClick={() => setStoreFilterOpen(true)}
              className={cn(
                "h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 shadow-sm",
                selectedStores.size > 0
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border/60 text-foreground hover:border-primary/30",
              )}
            >
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Tiendas</span>
              {selectedStores.size > 0 && selectedStores.size < STORES.length && (
                <Badge className="h-4.5 px-1.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                  {selectedStores.size}
                </Badge>
              )}
            </button>

            {totalItemsCount > 0 && (
              <div className="relative h-9 w-9 grid place-items-center">
                <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/60"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    className="text-primary transition-all duration-500 ease-out"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 0.942} 100`}
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-foreground">
                  {progress}%
                </span>
              </div>
            )}
          </div>
        </div>


        {/* ── ACTIVE STORE FILTERS CHIPS BAR ── */}
        <div className="mx-auto max-w-2xl px-4 pb-2.5 pt-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-wrap">
          {selectedStores.size === 0 || selectedStores.size === STORES.length ? (
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
                const badge = STORE_BADGE_STYLE[s];
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
                    <span>{badge.icon}</span>
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedStores);
                        next.delete(s);
                        setSelectedStores(next);
                      }}
                      className="hover:opacity-75 p-0.5 rounded ml-0.5"
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
            <BasketCalculator items={listItems} />

            {listItems.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Organizar vista por:
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
                      <CategoryTitle emoji={CATEGORY_EMOJI[category]} count={items.length}>
                        {category}
                      </CategoryTitle>
                      <ul className="space-y-2">
                        {items.map((it) => (
                          <ItemRow
                            key={it.id}
                            item={it}
                            onToggleBought={() => toggleBought(it.id)}
                            onToggleInList={() => toggleInList(it.id)}
                            onEdit={() => handleOpenEditModal(it)}
                          />
                        ))}
                      </ul>
                    </section>
                  ))}

                {/* GROUPED BY STORE */}
                {groupBy === "store" &&
                  groupedByStore.map(({ storeKey, items }) => {
                    const isKnownStore = storeKey !== "Sin supermercado asignado";
                    const badge = isKnownStore
                      ? STORE_BADGE_STYLE[storeKey as StoreName]
                      : { icon: "📦", bg: "bg-muted", text: "text-muted-foreground" };

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
                            <span>{badge.icon}</span>
                            <span>{storeKey}</span>
                            <span className="opacity-80">({items.length})</span>
                          </Badge>
                        </div>
                        <ul className="space-y-2">
                          {items.map((it) => (
                            <ItemRow
                              key={it.id}
                              item={it}
                              onToggleBought={() => toggleBought(it.id)}
                              onToggleInList={() => toggleInList(it.id)}
                              onEdit={() => handleOpenEditModal(it)}
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
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="pl-9 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30"
                  />
                </div>
                <Button
                  onClick={handleOpenAddModal}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold shadow-md shadow-primary/20 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Añadir nuevo producto
                </Button>
              </div>
            </div>

            {/* Collapsible categories accordion (single expanded category) */}
            <div className="space-y-2">
              {groupedCatalog.map(({ category, items }) => {
                const inListCount = items.filter((i) => i.inList).length;
                const isExpanded = expandedCategory === category;

                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="w-full group">
                      <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border/60 px-3.5 py-2.5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 cursor-pointer">
                        <span className="text-lg leading-none" aria-hidden>
                          {CATEGORY_EMOJI[category]}
                        </span>
                        <span className="flex-1 text-left text-sm font-semibold text-foreground">
                          {category}
                        </span>
                        {inListCount > 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 h-5 bg-primary/15 text-primary border-0 font-semibold">
                            {inListCount} en lista
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                          {items.length}
                        </Badge>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                            isExpanded && "rotate-180 text-primary",
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="collapsible-content">
                      <ul className="space-y-1.5 pt-1.5 pl-1 pr-1">
                        {items.map((it) => (
                          <li
                            key={it.id}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all duration-200 hover:-translate-y-[1px]",
                              it.inList
                                ? "border-primary/30 bg-primary/5 shadow-sm hover:shadow-md"
                                : "border-border/50 hover:border-border hover:shadow-sm",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => toggleInList(it.id)}
                              aria-pressed={it.inList}
                              className={cn(
                                "h-5.5 w-5.5 rounded-md border-2 grid place-items-center shrink-0 transition-all duration-200",
                                it.inList
                                  ? "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-sm"
                                  : "border-muted-foreground/30 hover:border-primary/50",
                              )}
                            >
                              {it.inList && <Check className="h-3.5 w-3.5" />}
                            </button>

                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="h-9 w-9 rounded-lg object-cover border border-border/60 shrink-0 shadow-xs"
                              />
                            )}

                            <div className="flex-1 min-w-0">

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">{it.name}</span>
                                {it.preferredStore && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 h-4 border font-medium",
                                      STORE_BADGE_STYLE[it.preferredStore].bg,
                                      STORE_BADGE_STYLE[it.preferredStore].text,
                                    )}
                                  >
                                    {STORE_BADGE_STYLE[it.preferredStore].icon} {it.preferredStore}
                                  </Badge>
                                )}
                              </div>
                              {it.note && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                  🏷️ {it.note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(it)}
                                aria-label={`Editar ${it.name}`}
                                className="text-muted-foreground/50 hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(it.id)}
                                aria-label={`Eliminar ${it.name}`}
                                className="text-muted-foreground/40 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
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
                      : { icon: "🛒", bg: "bg-muted", text: "text-muted-foreground" };

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
                                primaryStoreBadge.bg,
                                primaryStoreBadge.text,
                              )}
                            >
                              <span>{primaryStoreBadge.icon}</span>
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
                            {Object.entries(t.storeTotals).map(([st, val]) => {
                              const isKnown = st !== "Otro";
                              const badge = isKnown
                                ? STORE_BADGE_STYLE[st as StoreName]
                                : { icon: "📦", bg: "bg-muted", text: "text-muted-foreground" };
                              return (
                                <span
                                  key={st}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-semibold"
                                >
                                  {badge.icon} {st}: {val ? `${val.toFixed(2)}€` : "—"}
                                </span>
                              );
                            })}
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
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">Mi Lista de la Compra v2.0</p>
              <p className="text-[11px] text-muted-foreground">
                {store.items.length} productos en catálogo · {listItems.length} en la compra
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── FIXED BOTTOM NAVIGATION BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 shadow-xl">
        <div className="mx-auto max-w-2xl px-4 py-1.5 flex items-center justify-around">
          {/* Compra hoy */}
          <button
            type="button"
            onClick={() => setTab("compra")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 relative",
              tab === "compra"
                ? "text-primary font-bold bg-primary/10"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {pending.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center min-w-4 shadow-sm">
                  {pending.length}
                </span>
              )}
            </div>
            <span className="text-[11px]">Compra hoy</span>
          </button>

          {/* Catálogo */}
          <button
            type="button"
            onClick={() => setTab("catalogo")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 relative",
              tab === "catalogo"
                ? "text-primary font-bold bg-primary/10"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative">
              <ClipboardList className="h-5 w-5" />
              <span className="absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center border border-border/50 min-w-4">
                {store.items.length}
              </span>
            </div>
            <span className="text-[11px]">Catálogo</span>
          </button>

          {/* Historial */}
          <button
            type="button"
            onClick={() => setTab("historial")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 relative",
              tab === "historial"
                ? "text-primary font-bold bg-primary/10"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative">
              <Receipt className="h-5 w-5" />
              {(store.trips ?? []).length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center min-w-4 shadow-sm">
                  {(store.trips ?? []).length}
                </span>
              )}
            </div>
            <span className="text-[11px]">Historial</span>
          </button>

          {/* Ajustes */}
          <button
            type="button"
            onClick={() => setTab("ajustes")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 relative",
              tab === "ajustes"
                ? "text-primary font-bold bg-primary/10"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[11px]">Ajustes</span>
          </button>
        </div>
      </nav>



      {/* ── MODALS ── */}

      {/* Store Filter Dialog */}
      <StoreFilterDialog
        open={storeFilterOpen}
        onClose={() => setStoreFilterOpen(false)}
        selectedStores={selectedStores}
        onChangeSelectedStores={setSelectedStores}
      />

      {/* Item Form Dialog (Add / Edit Product) */}
      <ItemFormDialog
        open={itemDialogOpen}
        item={editingItem}
        onClose={() => setItemDialogOpen(false)}
        onSave={handleSaveItem}
      />

      {/* Finish Trip Dialog */}
      <FinishTripDialog
        open={finishTripModalOpen}
        onClose={() => setFinishTripModalOpen(false)}
        boughtItems={done}
        onSaveTrip={saveCompletedTrip}
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
    </div>
  );
}


/* ── STORE FILTER DIALOG ── */
function StoreFilterDialog({
  open,
  onClose,
  selectedStores,
  onChangeSelectedStores,
}: {
  open: boolean;
  onClose: () => void;
  selectedStores: Set<StoreName>;
  onChangeSelectedStores: (stores: Set<StoreName>) => void;
}) {
  const isAll = selectedStores.size === 0 || selectedStores.size === STORES.length;

  function toggleStore(s: StoreName) {
    const next = new Set(selectedStores);
    if (next.has(s)) {
      next.delete(s);
    } else {
      next.add(s);
    }
    onChangeSelectedStores(next);
  }

  function selectAll() {
    onChangeSelectedStores(new Set());
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtrar por Tiendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <p className="text-xs text-muted-foreground mb-2">
            Selecciona una o varias tiendas para filtrar los productos de la compra y del catálogo.
          </p>

          <button
            type="button"
            onClick={selectAll}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all",
              isAll
                ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                : "bg-card border-border/60 hover:bg-accent text-foreground",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span>🏷️</span>
              <span>Todas las tiendas</span>
            </div>
            {isAll && <Check className="h-4 w-4 text-primary" />}
          </button>

          <div className="border-t border-border/50 my-2 pt-2 space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {STORES.map((s) => {
              const badge = STORE_BADGE_STYLE[s];
              const isChecked = !isAll && selectedStores.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStore(s)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-sm font-medium transition-all",
                    isChecked
                      ? "bg-primary/5 border-primary/40 text-foreground"
                      : "bg-card border-border/40 hover:bg-accent/60 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{badge.icon}</span>
                    <span className="font-semibold">{s}</span>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border grid place-items-center transition-all",
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isChecked && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="rounded-xl text-xs flex-1"
          >
            Limpiar filtro
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs px-6 flex-1 bg-primary text-primary-foreground"
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── ITEM FORM DIALOG (Add / Edit Product) ── */
function ItemFormDialog({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onSave: (
    name: string,
    category: Category,
    preferredStore: StoreName | null,
    prices: Partial<Record<StoreName, number>>,
    note: string,
    image?: string | null,
  ) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Despensa");
  const [preferredStore, setPreferredStore] = useState<StoreName | "NONE">("NONE");
  const [prices, setPrices] = useState<Partial<Record<StoreName, string>>>({});
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setCategory(item.category);
        setPreferredStore(item.preferredStore ?? "NONE");
        setNote(item.note ?? "");
        setImage(item.image ?? null);

        const strPrices: Partial<Record<StoreName, string>> = {};
        if (item.prices) {
          for (const [k, v] of Object.entries(item.prices)) {
            if (v !== undefined) strPrices[k as StoreName] = String(v);
          }
        }
        setPrices(strPrices);
      } else {
        setName("");
        setCategory("Despensa");
        setPreferredStore("NONE");
        setPrices({});
        setNote("");
        setImage(null);
      }
    }
  }, [item, open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch {
      // ignore
    }
    e.target.value = "";
  }

  function handleSave() {
    if (!name.trim()) return;

    const parsedPrices: Partial<Record<StoreName, number>> = {};
    for (const [k, v] of Object.entries(prices)) {
      if (v) {
        const num = parseFloat(v.replace(",", "."));
        if (!isNaN(num) && num >= 0) {
          parsedPrices[k as StoreName] = num;
        }
      }
    }

    onSave(
      name,
      category,
      preferredStore === "NONE" ? null : preferredStore,
      parsedPrices,
      note.trim(),
      image,
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {item ? (
              <Pencil className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            {item ? "Editar producto" : "Añadir nuevo producto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Nombre del producto</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plátanos, Papel higiénico..."
              autoFocus
              className="rounded-xl"
            />
          </div>

          {/* Image Attachment */}
          <div className="space-y-1.5 pt-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Camera className="h-3.5 w-3.5 text-primary" />
              Foto o imagen del producto (opcional)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {image ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border/60 bg-muted/30 group shadow-sm">
                <img src={image} alt="Vista previa del producto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground p-1.5 rounded-lg shadow hover:bg-destructive transition-all"
                  aria-label="Quitar foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                    }
                  }}
                  className="rounded-xl text-xs font-medium border-border/60 bg-muted/20 hover:bg-accent"
                >
                  <ImageIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  Elegir de galería
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute("capture", "environment");
                      fileInputRef.current.click();
                    }
                  }}
                  className="rounded-xl text-xs font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                >
                  <Camera className="h-4 w-4 mr-1.5 text-primary" />
                  Hacer foto
                </Button>
              </div>
            )}
          </div>

          {/* Category & Preferred Store */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_EMOJI[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tienda preferida</Label>
              <Select
                value={preferredStore}
                onValueChange={(v) => setPreferredStore(v as StoreName | "NONE")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sin tienda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin preferencia</SelectItem>
                  {STORES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STORE_BADGE_STYLE[s].icon} {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="item-note">Nota u oferta (opcional)</Label>
            <Input
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Marca Blanca, Oferta 3x2..."
              className="rounded-xl"
            />
          </div>

          {/* Prices per Store */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              Precios conocidos por supermercado (€)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STORES.map((s) => {
                const badge = STORE_BADGE_STYLE[s];
                return (
                  <div key={s} className="space-y-1 bg-muted/40 p-2 rounded-xl border border-border/40">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      {badge.icon} {s}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={prices[s] ?? ""}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [s]: e.target.value }))
                      }
                      className="h-8 text-xs rounded-lg bg-background"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-xl bg-gradient-to-r from-primary to-primary/90 font-semibold"
          >
            {item ? "Guardar cambios" : "Añadir producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Item Row Component for Shopping List ── */
function ItemRow({
  item,
  onToggleBought,
  onToggleInList,
  onEdit,
}: {
  item: Item;
  onToggleBought: () => void;
  onToggleInList: () => void;
  onEdit: () => void;
}) {
  const storeBadge = item.preferredStore ? STORE_BADGE_STYLE[item.preferredStore] : null;

  // Best price calculation
  const pricesList = item.prices ? Object.entries(item.prices).filter(([, p]) => p && p > 0) : [];
  const bestPrice = useMemo(() => {
    if (pricesList.length === 0) return null;
    return pricesList.reduce((min, cur) => (cur[1]! < min[1]! ? cur : min));
  }, [pricesList]);

  return (
    <li className="group w-full flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleBought}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggleBought();
        }}
        className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-10 w-10 rounded-xl object-cover border border-border/60 shrink-0 shadow-xs"
          />
        ) : (
          <span className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/60 transition-colors shrink-0" />
        )}
        <div className="min-w-0">

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{item.name}</span>
            {storeBadge && item.preferredStore && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 border font-medium",
                  storeBadge.bg,
                  storeBadge.text,
                )}
              >
                {storeBadge.icon} {item.preferredStore}
              </Badge>
            )}
            {bestPrice && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300/40">
                {bestPrice[1]?.toFixed(2)}€ ({bestPrice[0]})
              </span>
            )}
          </div>
          {item.note && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              🏷️ {item.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${item.name}`}
          className="text-muted-foreground/50 hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all duration-150"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleInList}
          aria-label={`Quitar ${item.name} de la lista`}
          className="text-muted-foreground/50 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all duration-150"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

/* ── Category Title Component ── */
function CategoryTitle({
  children,
  emoji,
  count,
}: {
  children: React.ReactNode;
  emoji: string;
  count: number;
}) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
      <span className="text-sm normal-case">{emoji}</span>
      <span>{children}</span>
      <span className="text-[10px] text-muted-foreground/70 font-normal">({count})</span>
    </h2>
  );
}

/* ── Empty State Component ── */
function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 text-center my-6 space-y-3 animate-in fade-in-0 duration-300">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-muted grid place-items-center text-muted-foreground">
        <ShoppingBasket className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ── BACKUP DIALOG ── */
function BackupDialog({
  open,
  onClose,
  store,
  onRestore,
  onResetToSeed,
}: {
  open: boolean;
  onClose: () => void;
  store: Store;
  onRestore: (s: Store) => void;
  onResetToSeed?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (open) setStatus(null);
  }, [open]);

  function createBackupBlob() {
    const backup = {
      _app: "lista-compra",
      _version: 1,
      _date: new Date().toISOString(),
      store,
    };
    return new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  }

  function formatDate() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function handleDownload() {
    const blob = createBackupBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista_compra_backup_${formatDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ type: "success", msg: "Copia descargada correctamente" });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);

        if (
          data._app !== "lista-compra" ||
          !data.store?.items ||
          !Array.isArray(data.store.items)
        ) {
          setStatus({ type: "error", msg: "El archivo no es una copia de seguridad válida." });
          return;
        }

        const validItems = data.store.items.every(
          (it: Record<string, unknown>) =>
            typeof it.id === "string" &&
            typeof it.name === "string" &&
            typeof it.category === "string" &&
            typeof it.inList === "boolean" &&
            typeof it.bought === "boolean",
        );

        if (!validItems) {
          setStatus({ type: "error", msg: "Los datos de la copia están corruptos." });
          return;
        }

        const backupDate = data._date
          ? new Date(data._date as string).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "fecha desconocida";

        if (
          !confirm(
            `¿Restaurar la copia del ${backupDate}?\n\nEsto reemplazará todos tus datos actuales (${store.items.length} productos) con los de la copia (${data.store.items.length} productos).`,
          )
        ) {
          return;
        }

        onRestore(data.store as Store);
        setStatus({
          type: "success",
          msg: `Restaurados ${data.store.items.length} productos correctamente.`,
        });
      } catch {
        setStatus({
          type: "error",
          msg: "Error al leer el archivo. Asegúrate de que es un archivo .json válido.",
        });
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  }

  function handleResetSeed() {
    if (
      confirm(
        "¿Restablecer todo el catálogo con la lista oficial consolidada de tus tickets?\n\nSe actualizará la lista de productos al catálogo oficial base.",
      )
    ) {
      onResetToSeed?.();
      setStatus({ type: "success", msg: "Catálogo oficial cargado correctamente." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Copia de seguridad y Catálogo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-600/10 grid place-items-center shrink-0">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Descargar copia</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guarda un archivo .json con tus datos
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleResetSeed}
            className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/15 grid place-items-center shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Restaurar a catálogo base
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Restablece tus productos a la lista base oficial
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 grid place-items-center shrink-0">
              <Upload className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Restaurar copia (.json)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Carga un archivo de respaldo previo
              </p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {status && (
          <div
            className={cn(
              "rounded-xl px-3.5 py-2.5 text-sm font-medium flex items-center gap-2 animate-in fade-in-0 duration-200",
              status.type === "success"
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {status.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            {status.msg}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground/70 text-center pt-1">
          {store.items.length} productos en el catálogo · Último cambio ahora
        </p>
      </DialogContent>
    </Dialog>
  );
}

/* ── FINISH TRIP DIALOG (Save purchase to history) ── */
function FinishTripDialog({
  open,
  onClose,
  boughtItems,
  onSaveTrip,
}: {
  open: boolean;
  onClose: () => void;
  boughtItems: Item[];
  onSaveTrip: (tripData: Omit<CompletedTrip, "id" | "date">) => void;
}) {
  const [storeName, setStoreName] = useState<StoreName | "Varios">("Mercadona");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate store breakdown and totals
  const { storeTotals, grandTotal, itemsList } = useMemo(() => {
    const totals: Partial<Record<StoreName | "Otro", number>> = {};
    let grand = 0;
    const items: TripItem[] = [];

    for (const it of boughtItems) {
      const store = it.preferredStore ?? "Otro";
      const pricesList = it.prices ? Object.entries(it.prices).filter(([, p]) => p && p > 0) : [];
      let itemPrice = 0;

      if (it.preferredStore && it.prices?.[it.preferredStore]) {
        itemPrice = it.prices[it.preferredStore]!;
      } else if (pricesList.length > 0) {
        itemPrice = pricesList.reduce((min, cur) => (cur[1]! < min[1]! ? cur : min))[1]!;
      }

      totals[store] = (totals[store] ?? 0) + itemPrice;
      grand += itemPrice;

      items.push({
        name: it.name,
        category: it.category,
        preferredStore: it.preferredStore,
        price: itemPrice > 0 ? itemPrice : undefined,
      });
    }

    return { storeTotals: totals, grandTotal: grand, itemsList: items };
  }, [boughtItems]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setReceiptImage(compressed);
    } catch {
      // ignore
    }
    e.target.value = "";
  }

  function handleSave() {
    onSaveTrip({
      storeName,
      storeTotals,
      grandTotal,
      items: itemsList,
      receiptImage: receiptImage ?? undefined,
      note: note.trim() || undefined,
    });
    setReceiptImage(null);
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Finalizar Compra y Guardar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Summary Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{boughtItems.length} productos comprados</span>
              <span className="text-sm font-bold text-primary">
                {grandTotal > 0 ? `${grandTotal.toFixed(2)}€` : "Total sin estimar"}
              </span>
            </div>

            {/* Per Store Breakdown */}
            {Object.keys(storeTotals).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(storeTotals).map(([st, val]) => {
                  const isKnown = st !== "Otro";
                  const badge = isKnown
                    ? STORE_BADGE_STYLE[st as StoreName]
                    : { icon: "📦", bg: "bg-muted", text: "text-muted-foreground" };
                  return (
                    <Badge
                      key={st}
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-medium border",
                        badge.bg,
                        badge.text,
                      )}
                    >
                      {badge.icon} {st}: {val ? `${val.toFixed(2)}€` : "—"}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Store Selector */}
          <div className="space-y-1.5">
            <Label>Supermercado principal de la compra</Label>
            <Select value={storeName} onValueChange={(v) => setStoreName(v as StoreName | "Varios")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Varios">🛒 Varios supermercados</SelectItem>
                {STORES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STORE_BADGE_STYLE[s].icon} {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Image */}
          <div className="space-y-1.5 pt-1">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Camera className="h-3.5 w-3.5 text-primary" />
              Foto del Ticket de Compra (opcional)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {receiptImage ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/60 bg-muted/30 group shadow-sm">
                <img src={receiptImage} alt="Ticket de compra" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground p-1.5 rounded-lg shadow hover:bg-destructive transition-all"
                  aria-label="Quitar foto ticket"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                    }
                  }}
                  className="rounded-xl text-xs font-medium border-border/60 bg-muted/20 hover:bg-accent"
                >
                  <ImageIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  Elegir de galería
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute("capture", "environment");
                      fileInputRef.current.click();
                    }
                  }}
                  className="rounded-xl text-xs font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                >
                  <Camera className="h-4 w-4 mr-1.5 text-primary" />
                  Hacer foto ticket
                </Button>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <Label htmlFor="trip-note">Nota sobre esta compra (opcional)</Label>
            <Input
              id="trip-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Compra mensual de despensa..."
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-primary to-primary/90 font-semibold shadow-md"
          >
            Guardar en Historial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── RECEIPT VIEWER DIALOG ── */
function ReceiptViewerDialog({
  image,
  onClose,
}: {
  image: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!image} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-lg p-3 bg-card border-border/80">
        <DialogHeader className="px-2 pt-2 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Ticket de Compra
          </DialogTitle>
        </DialogHeader>
        {image && (
          <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-1">
            <img src={image} alt="Ticket completo" className="w-full h-auto rounded-lg" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

