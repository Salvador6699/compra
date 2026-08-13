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

export function StoreFilterDialog({
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


