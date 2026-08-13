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
                      <DynamicIcon icon={icon} fallback="🏪" className="h-3.5 w-3.5" />
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

