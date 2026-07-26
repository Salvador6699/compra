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

/* ── Helper component to render an Emoji or a resized Custom Image Icon ── */
function DynamicIcon({
  icon,
  fallback = "📦",
  className = "h-4 w-4 rounded object-cover shrink-0 inline-block",
}: {
  icon?: string;
  fallback?: string;
  className?: string;
}) {
  if (!icon) return <span className="text-base leading-none">{fallback}</span>;
  const isImg =
    icon.startsWith("data:image/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("blob:") ||
    icon.length > 30;
  if (isImg) {
    return (
      <img
        src={icon}
        alt=""
        className={cn("object-cover rounded-md shrink-0 inline-block align-middle", className)}
      />
    );
  }
  return <span className="text-base leading-none inline-block align-middle">{icon}</span>;
}

/* ── EDIT CATEGORY OR STORE DIALOG (Name & Icon: Emoji or Image Upload) ── */
function EditCategoryOrStoreDialog({
  open,
  type,
  currentName,
  currentIcon,
  onSave,
  onClose,
}: {
  open: boolean;
  type: "category" | "store";
  currentName: string;
  currentIcon: string;
  onSave: (newName: string, newIcon: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName || "");
      setIcon(currentIcon || "");
    }
  }, [open, currentName, currentIcon]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Compress image icon down to max 128px width
      const compressed = await compressImage(file, 128, 0.85);
      setIcon(compressed);
    } catch {
      // ignore
    }
    e.target.value = "";
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), icon);
    onClose();
  }

  const titleText = type === "category" ? `Editar categoría "${currentName}"` : `Editar supermercado "${currentName}"`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            {titleText}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preview Header */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
            <div className="h-10 w-10 rounded-xl bg-background border border-border grid place-items-center shadow-xs overflow-hidden shrink-0">
              <DynamicIcon icon={icon} fallback="📦" className="h-7 w-7 object-cover rounded-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Vista previa</span>
              <p className="text-sm font-bold truncate text-foreground">{name || "Sin nombre"}</p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escribe el nombre..."
              className="rounded-xl text-xs"
            />
          </div>

          {/* Icon Option 1: Emoji */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Icono (Emoji)</Label>
            <Input
              value={icon.startsWith("data:") ? "" : icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ej: 🍦, 💊, 🏬..."
              className="rounded-xl text-xs text-center"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase font-semibold text-muted-foreground">O foto / imagen</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {/* Icon Option 2: Image Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl text-xs font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 gap-2"
            >
              <Upload className="h-4 w-4" />
              Subir foto desde galería / PC
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs flex-1">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim()} className="rounded-xl text-xs px-4 flex-1 bg-primary font-semibold">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
  } = useShoppingStore();



  const [tab, setTab] = useState<"compra" | "catalogo" | "historial" | "ajustes">("compra");

  const [groupBy, setGroupBy] = useState<"category" | "store">("category");

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

  // Single expanded category (Accordion mode)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Backup dialog
  const [backupOpen, setBackupOpen] = useState(false);

  // Edit Icon dialog
  const [editingIconTarget, setEditingIconTarget] = useState<{
    type: "category" | "store";
    name: string;
    icon: string;
  } | null>(null);

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
      .filter((c) => !deleted.has(c))
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [store.customCategories, store.deletedCategories]);

  const allStores = useMemo(() => {
    const deleted = new Set(store.deletedStores ?? []);
    const set = new Set([...STORES, ...(store.customStores ?? [])]);
    return Array.from(set)
      .filter((s) => !deleted.has(s))
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
      setExpandedCategory(groupedCatalog[0].category);
    }
  }, [search]);


  // Accordion toggle handler: only 1 category open at a time
  function toggleCategory(category: string) {
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
        preferredStore ?? undefined,
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
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans antialiased transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/60 shadow-xs">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 grid place-items-center text-primary-foreground shadow-sm">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Mi Lista de la Compra</h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                {listItems.length} en la compra · {store.items.length} en catálogo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <BasketCalculator items={listItems} />

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
                        <DynamicIcon
                          icon={getCategoryIcon(category)}
                          fallback="📦"
                          className="h-5 w-5 object-cover rounded-md"
                        />
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
                                {it.preferredStore && (() => {
                                  const sb = STORE_BADGE_STYLE[it.preferredStore] || { bg: "bg-muted", text: "text-muted-foreground" };
                                  return (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 border font-medium flex items-center gap-0.5",
                                        sb.bg,
                                        sb.text,
                                      )}
                                    >
                                      <DynamicIcon icon={getStoreIcon(it.preferredStore)} fallback="🏪" className="h-3 w-3 object-cover rounded-sm" />
                                      <span>{it.preferredStore}</span>
                                    </Badge>
                                  );
                                })()}
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
                  <Input
                    placeholder="Icono (ej: 🍦)"
                    value={newCatIconInput}
                    onChange={(e) => setNewCatIconInput(e.target.value)}
                    className="w-24 rounded-xl text-xs text-center"
                  />
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
                  <Input
                    placeholder="Icono (ej: 🏪)"
                    value={newStoreIconInput}
                    onChange={(e) => setNewStoreIconInput(e.target.value)}
                    className="w-24 rounded-xl text-xs text-center"
                  />
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
                        (i.prices &&
                          i.prices[st as StoreName] !== undefined &&
                          i.prices[st as StoreName]! > 0),
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


    </div>
  );
}


/* ── STORE FILTER DIALOG ── */
function StoreFilterDialog({
  open,
  onClose,
  allStores,
  getStoreIcon,
  selectedStores,
  onChangeSelectedStores,
}: {
  open: boolean;
  onClose: () => void;
  allStores: string[];
  getStoreIcon: (store: string) => string;
  selectedStores: Set<string>;
  onChangeSelectedStores: (stores: Set<string>) => void;
}) {
  const isAll = selectedStores.size === 0 || selectedStores.size === allStores.length;

  function toggleStore(s: string) {
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
            {allStores.map((s) => {
              const icon = getStoreIcon(s);
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
                    <DynamicIcon icon={icon} fallback="🏪" className="h-5 w-5 object-cover rounded-md shrink-0" />
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


        <DialogFooter className="pt-2">
          <Button
            onClick={onClose}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Aplicar Filtro
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
  allCategories,
  allStores,
  getCategoryIcon,
  getStoreIcon,
  onAddCategory,
  onAddStore,
  onClose,
  onSave,
}: {
  open: boolean;
  item: Item | null;
  allCategories: string[];
  allStores: string[];
  getCategoryIcon: (cat: string) => string;
  getStoreIcon: (store: string) => string;
  onAddCategory: (name: string) => void;
  onAddStore: (name: string) => void;
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
  const [category, setCategory] = useState<string>("Despensa");
  const [preferredStore, setPreferredStore] = useState<string>("NONE");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showAddStoreInput, setShowAddStoreInput] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");

  useEffect(() => {
    if (open) {
      setShowAddCategoryInput(false);
      setShowAddStoreInput(false);
      setNewCatName("");
      setNewStoreName("");

      if (item) {
        setName(item.name);
        setCategory(item.category);
        setPreferredStore(item.preferredStore ?? "NONE");
        setNote(item.note ?? "");
        setImage(item.image ?? null);

        const strPrices: Record<string, string> = {};
        if (item.prices) {
          for (const [k, v] of Object.entries(item.prices)) {
            if (v !== undefined) strPrices[k] = String(v);
          }
        }
        setPrices(strPrices);
      } else {
        setName("");
        setCategory(allCategories[0] || "Despensa");
        setPreferredStore("NONE");
        setPrices({});
        setNote("");
        setImage(null);
      }
    }
  }, [item, open, allCategories]);

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

  function handleCreateCategoryInline() {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setNewCatName("");
    setShowAddCategoryInput(false);
  }

  function handleCreateStoreInline() {
    const trimmed = newStoreName.trim();
    if (!trimmed) return;
    onAddStore(trimmed);
    setPreferredStore(trimmed);
    setNewStoreName("");
    setShowAddStoreInput(false);
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
      category as Category,
      preferredStore === "NONE" ? null : (preferredStore as StoreName),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoría */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Categoría</Label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  + Nueva
                </button>
              </div>

              {showAddCategoryInput ? (
                <div className="flex gap-1">
                  <Input
                    placeholder="Categoría..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateCategoryInline}
                    className="h-9 text-xs rounded-xl px-2.5 bg-primary"
                  >
                    OK
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {getCategoryIcon(c)} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tienda Preferida */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Tienda preferida</Label>
                <button
                  type="button"
                  onClick={() => setShowAddStoreInput(!showAddStoreInput)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  + Nueva
                </button>
              </div>

              {showAddStoreInput ? (
                <div className="flex gap-1">
                  <Input
                    placeholder="Tienda..."
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateStoreInline}
                    className="h-9 text-xs rounded-xl px-2.5 bg-primary"
                  >
                    OK
                  </Button>
                </div>
              ) : (
                <Select
                  value={preferredStore}
                  onValueChange={setPreferredStore}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sin tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin preferencia</SelectItem>
                    {allStores.map((s) => {
                      const icon = getStoreIcon(s);
                      return (
                        <SelectItem key={s} value={s}>
                          {icon} {s}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
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
              {allStores.map((s) => {
                const icon = getStoreIcon(s);
                return (
                  <div key={s} className="space-y-1 bg-muted/40 p-2 rounded-xl border border-border/40">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <span>{icon}</span>
                      <span>{s}</span>
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
  getStoreIcon,
  onToggleBought,
  onToggleInList,
  onEdit,
}: {
  item: Item;
  getStoreIcon?: (st: string) => string;
  onToggleBought: () => void;
  onToggleInList: () => void;
  onEdit: () => void;
}) {
  const storeBadge = item.preferredStore
    ? (STORE_BADGE_STYLE[item.preferredStore] || { bg: "bg-muted", text: "text-muted-foreground" })
    : null;
  const storeIconResolved = item.preferredStore
    ? (getStoreIcon ? getStoreIcon(item.preferredStore) : (STORE_BADGE_STYLE[item.preferredStore]?.icon ?? "🏪"))
    : null;

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
                  "text-[10px] px-1.5 py-0 h-4 border font-medium flex items-center gap-0.5",
                  storeBadge.bg,
                  storeBadge.text,
                )}
              >
                <DynamicIcon icon={storeIconResolved ?? "🏪"} fallback="🏪" className="h-3 w-3 object-cover rounded-sm" />
                <span>{item.preferredStore}</span>
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
  icon,
  count,
}: {
  children: React.ReactNode;
  icon?: string;
  count: number;
}) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
      <DynamicIcon icon={icon} fallback="📦" className="h-4.5 w-4.5 object-cover rounded-md" />
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

