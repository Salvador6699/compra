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
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Sun,
  Moon,
  Tag,
  Trash2,
  Upload,
  Wand,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollOnFocus } from "@/hooks/useScrollOnFocus";
import { useBackButton } from "@/hooks/use-back-button";

import { DynamicIcon } from "@/components/dynamic-icon";
import { supabase } from "@/lib/supabase";
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
import type { CompletedTrip, Item, Store, TripItem, ProductFormat, Unit } from "@/lib/use-shopping-store";
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
import { BarcodeScanner } from "./BarcodeScanner";

export function ItemFormDialog({
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
    preferredStore: StoreName | undefined,
    formats: ProductFormat[],
    note: string,
    existingItemId?: string
  ) => void;
}) {
  const { store, setLastUsedCategory } = useShoppingStore();
  const currentLocation = store.currentLocation;
  const lastUsedCategory = store.lastUsedCategory;
  const scrollOnFocus = useScrollOnFocus();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Despensa");
  const [preferredStore, setPreferredStore] = useState<string>("NONE");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [formatName, setFormatName] = useState("Genérico");
  const [formatSize, setFormatSize] = useState<string>("1");
  const [formatUnit, setFormatUnit] = useState<Unit>("u");
  const [barcode, setBarcode] = useState<string | undefined>(undefined);

  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showAddStoreInput, setShowAddStoreInput] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");

  const [existingItemId, setExistingItemId] = useState<string | undefined>(undefined);
  const [existingFormatId, setExistingFormatId] = useState<string | undefined>(undefined);

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  useEffect(() => {
    if (!open) setViewingImage(null);
  }, [open]);
  useBackButton(viewingImage !== null, () => setViewingImage(null));

  useEffect(() => {
    if (open) {
      setShowAddCategoryInput(false);
      setShowAddStoreInput(false);
      setNewCatName("");
      setNewStoreName("");
      setExistingItemId(undefined);
      setExistingFormatId(undefined);
      setBarcode(undefined);

      if (item) {
        setStep(2);
        setName(item.name);
        setCategory(item.category);
        setPreferredStore(currentLocation !== "Casa" ? currentLocation : (item.preferredStore ?? "NONE"));
        setNote(item.note ?? "");
        const firstFormat = item.formats && item.formats[0];
        setImage(firstFormat?.image ?? null);
        setFormatName(firstFormat?.name ?? "Genérico");
        setFormatSize(firstFormat?.size ? String(firstFormat.size) : "1");
        setFormatUnit(firstFormat?.unit ?? "u");

        const strPrices: Record<string, string> = {};
        if (firstFormat?.prices) {
          for (const [k, v] of Object.entries(firstFormat.prices)) {
            if (v !== undefined) strPrices[k] = String(v);
          }
        }
        setPrices(strPrices);
      } else {
        setStep(1);
        setName("");
        setCategory(lastUsedCategory || allCategories[0] || "Despensa");
        setPreferredStore(currentLocation === "Casa" ? "NONE" : currentLocation);
        setPrices({});
        setNote("");
        setImage(null);
        setFormatName("Genérico");
        setFormatSize("1");
        setFormatUnit("u");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const parsedSize = parseFloat(formatSize.replace(",", "."));
    const format = {
      id: existingFormatId || item?.formats?.[0]?.id || crypto.randomUUID(),
      barcode: barcode || item?.formats?.[0]?.barcode,
      name: formatName,
      size: isNaN(parsedSize) || parsedSize <= 0 ? 1 : parsedSize,
      unit: formatUnit,
      prices: parsedPrices,
      image: image ?? undefined,
    };

    onSave(
      name,
      category as Category,
      preferredStore === "NONE" ? undefined : (preferredStore as StoreName),
      [format],
      note.trim(),
      existingItemId
    );
  }

  if (step === 1) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          hideCloseButton
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md p-4 sm:p-6 w-[95vw] rounded-3xl gap-4 border-t-4 border-t-primary/50 shadow-2xl overflow-y-auto max-h-[100dvh] sm:max-h-[90vh]"
        >
          <DialogHeader className="text-left mb-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
              <Wand className="h-6 w-6 text-primary" />
              Elige Categoría
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {allCategories.map((c) => {
              const icon = getCategoryIcon(c);
              const isSelected = category === c;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setLastUsedCategory(c);
                    setStep(2);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-sm font-medium gap-2",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "border-border/50 bg-muted/20 hover:bg-muted/50"
                  )}
                >
                  <span className="text-2xl"><DynamicIcon icon={icon} fallback="📦" className="h-6 w-6" /></span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 space-y-1.5 border-t pt-4">
             <div className="flex items-center justify-between">
                <Label>Nueva Categoría</Label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  + Nueva
                </button>
              </div>

              {showAddCategoryInput && (
                <div className="flex gap-1">
                  <Input
                    placeholder="Categoría..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const trimmed = newCatName.trim();
                      if (!trimmed) return;
                      onAddCategory(trimmed);
                      setCategory(trimmed);
                      setLastUsedCategory(trimmed);
                      setNewCatName("");
                      setShowAddCategoryInput(false);
                      setStep(2);
                    }}
                    className="h-9 text-xs rounded-xl px-2.5 bg-primary"
                  >
                    OK
                  </Button>
                </div>
              )}
          </div>

          <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 bg-background border-t border-border/30 flex gap-3 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-base font-bold rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={() => setStep(2)} className="flex-1 h-14 text-base font-bold text-white shadow-lg bg-gradient-to-r from-primary to-primary/90 rounded-2xl">
              Siguiente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-2xl max-w-md max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {item ? (
                <Pencil className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
              {item ? "Editar producto" : "Añadir nuevo producto"}
            </DialogTitle>
            {!item && (
              <Button 
                onClick={() => setScannerOpen(true)}
                variant="outline" 
                size="sm" 
                className="rounded-xl border-primary/50 text-primary hover:bg-primary/10 font-bold"
              >
                <Camera className="h-4 w-4 mr-1.5" /> Escanear
              </Button>
            )}
          </div>
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
              onFocus={scrollOnFocus}
              className="rounded-xl"
            />
          </div>

          {/* Format Settings */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                Formato
              </Label>
              <Input
                value={formatName}
                onChange={(e) => setFormatName(e.target.value)}
                placeholder="Ej: Botella, Pack 6..."
                onFocus={scrollOnFocus}
                className="rounded-xl h-9"
              />
            </div>
            <div className="space-y-1.5 w-16">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                Cant.
              </Label>
              <Input
                value={formatSize}
                onChange={(e) => setFormatSize(e.target.value)}
                placeholder="1"
                onFocus={scrollOnFocus}
                className="rounded-xl h-9 text-center"
              />
            </div>
            <div className="space-y-1.5 w-[70px]">
              <Select value={formatUnit} onValueChange={(v: any) => setFormatUnit(v)}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="u">ud</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <div className="space-y-2">
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border/60 bg-muted/30 shadow-sm">
                  <img 
                    src={image} 
                    alt="Vista previa del producto" 
                    className="w-full h-full object-contain bg-background cursor-pointer" 
                    onClick={() => setViewingImage(image)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImage(null)}
                  className="w-full rounded-xl text-xs font-semibold hover:bg-accent border-border/60"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Eliminar / Cambiar imagen
                </Button>
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
            {/* Cabecera con Categoría (Editable volviendo al paso 1) */}
            <div className="flex items-center gap-3 mb-2 p-2.5 bg-muted/40 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <DynamicIcon icon={getCategoryIcon(category)} fallback="📦" className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Categoría</p>
                <p className="text-sm font-bold leading-tight">{category}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep(1)} 
                className="text-xs h-8 rounded-xl bg-background shadow-sm border border-border/50 hover:bg-accent"
              >
                Cambiar
              </Button>
            </div>

            {/* Tienda Preferida y Precio */}
            <div className="grid grid-cols-[1fr_100px] gap-2 items-end">
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
                      onFocus={scrollOnFocus}
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
                            <div className="flex items-center gap-1.5">
                              <DynamicIcon icon={icon} fallback="🏪" className="h-4 w-4" />
                              <span>{s}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Precio para la tienda seleccionada */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Precio (€)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={preferredStore !== "NONE" ? (prices[preferredStore] ?? "") : ""}
                  disabled={preferredStore === "NONE"}
                  onChange={(e) => {
                    if (preferredStore === "NONE") return;
                    const val = e.target.value;
                    if (/^[0-9.,]*$/.test(val)) {
                      setPrices((prev) => ({ ...prev, [preferredStore]: val }));
                    }
                  }}
                  onFocus={scrollOnFocus}
                  className="rounded-xl h-9"
                />
              </div>
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
              onFocus={scrollOnFocus}
              className="rounded-xl"
            />
          </div>
        </div>



        <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 bg-background border-t border-border/30 flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-base font-bold rounded-2xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 h-14 text-base font-bold text-white shadow-lg bg-gradient-to-r from-primary to-primary/90 rounded-2xl"
          >
            {item ? "Guardar" : "Añadir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      <BarcodeScanner 
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={async (product, scannedBarcode) => {
          setBarcode(scannedBarcode);
          
          // 1. Check if barcode already exists in Global Catalog
          const { data: dbFormat, error: lookupErr } = await supabase
            .from('compra_product_formats')
            .select('*, compra_items(*)')
            .eq('barcode', scannedBarcode)
            .limit(1)
            .maybeSingle();
            
          if (lookupErr) console.error("Error looking up barcode:", lookupErr);

          // Determinar la tienda por defecto basada en ubicación o OpenFoodFacts
          let prefilledStore = currentLocation === "Casa" ? "NONE" : currentLocation;
          
          if (product.stores) {
            const offStores = product.stores.toLowerCase();
            // Si no estamos en Casa y la tienda actual es una de las tiendas donde se vende, la mantenemos
            if (currentLocation !== "Casa" && offStores.includes(currentLocation.toLowerCase())) {
              prefilledStore = currentLocation;
            } else {
              // Si no coincide con la actual, buscamos si coincide con alguna otra (ej. es marca blanca de otra tienda)
              for (const st of allStores) {
                if (offStores.includes(st.toLowerCase())) {
                  prefilledStore = st;
                  break;
                }
              }
            }
          }
          
          if (dbFormat) {
            // It exists! Let's reuse its IDs so we don't create duplicates
            setExistingFormatId(dbFormat.id);
            setExistingItemId(dbFormat.item_id);
            
            // Populate form with DB data (which might be better/edited by community)
            setName(dbFormat.compra_items.name);
            setCategory(dbFormat.compra_items.category);
            setImage(dbFormat.image || product.image_url || null);
            setFormatSize(String(dbFormat.size));
            setFormatUnit(dbFormat.unit as any);
            setFormatName(dbFormat.name);
            setPreferredStore(dbFormat.compra_items.preferred_store && dbFormat.compra_items.preferred_store !== "NONE" ? dbFormat.compra_items.preferred_store : prefilledStore);

            // Fetch community prices (now stored as JSONB)
            if (dbFormat.prices) {
              const strPrices: Record<string, string> = {};
              for (const [store, price] of Object.entries(dbFormat.prices)) {
                strPrices[store] = String(price);
              }
              setPrices(strPrices);
            }
            return; // Skip OpenFoodFacts default population
          }

          // 2. If it doesn't exist, use OpenFoodFacts data to populate the new item
          const qty = product.quantity || "";
          let parsedSize = "1";
          let parsedUnit = "u";
          
          if (qty) {
            const match = qty.match(/([\d\.,]+)\s*([a-zA-Z]+)/);
            if (match) {
              parsedSize = match[1].replace(',', '.');
              const unitRaw = match[2].toLowerCase();
              if (["g", "kg", "ml", "u"].includes(unitRaw)) {
                parsedUnit = unitRaw;
              } else if (unitRaw === "l") {
                parsedUnit = "L";
              }
            }
          }

          const bestName = product.product_name_es || product.product_name || product.generic_name_es || product.generic_name || product.brands || "";
          setName(bestName);
          setImage(product.image_url || null);
          setFormatSize(parsedSize);
          setFormatUnit(parsedUnit as any);
          setFormatName(qty ? qty : "Genérico");
          setPreferredStore(prefilledStore);

          const apiCats = (product.categories || "").toLowerCase();
          if (apiCats.includes("bebida")) setCategory("Bebidas");
          else if (apiCats.includes("lácteo") || apiCats.includes("queso")) setCategory("Lácteos y huevos");
          else if (apiCats.includes("carne")) setCategory("Carne y embutidos");
          else if (apiCats.includes("snack") || apiCats.includes("dulce")) setCategory("Snacks y dulces");
          else if (apiCats.includes("pan")) setCategory("Panadería");
          else if (apiCats.includes("pet") || apiCats.includes("perro") || apiCats.includes("gato") || apiCats.includes("dog") || apiCats.includes("cat")) setCategory("Mascotas");
          else if (apiCats.includes("beauty") || apiCats.includes("cosmetic") || apiCats.includes("higiene") || apiCats.includes("cuidado") || apiCats.includes("piel") || apiCats.includes("cabello") || apiCats.includes("shampoo")) setCategory("Cuidado personal");
          else if (apiCats.includes("limpieza") || apiCats.includes("hogar") || apiCats.includes("detergente") || apiCats.includes("clean")) setCategory("Hogar y limpieza");
        }}
      />

      {viewingImage && (
        <div 
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => window.history.back()}
        >
          <img 
            src={viewingImage} 
            alt="Preview" 
            className="w-full h-full object-contain"
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); window.history.back(); }}
            className="absolute top-4 right-4 bg-muted/50 hover:bg-muted text-foreground rounded-full p-2 backdrop-blur-md transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

