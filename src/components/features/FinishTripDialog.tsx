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

export function FinishTripDialog({
  open,
  onClose,
  boughtItems,
  onSaveTrip,
  allStores,
  getStoreIcon,
}: {
  open: boolean;
  onClose: () => void;
  boughtItems: Item[];
  onSaveTrip: (tripData: Omit<CompletedTrip, "id" | "date">) => void;
  allStores: string[];
  getStoreIcon: (st: string) => string;
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

