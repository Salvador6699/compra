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

export function ItemRow({
  item,
  getStoreIcon,
  onToggleBought,
  onToggleInList,
  onEdit,
  onUpdateQuantity,
  onViewDetails,
  onDelete,
  mode = "compra",
}: {
  item: Item;
  getStoreIcon?: (st: string) => string;
  onToggleBought: () => void;
  onToggleInList: () => void;
  onEdit: () => void;
  onUpdateQuantity?: (delta: number) => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
  mode?: "compra" | "catalogo";
}) {
  const storeBadge = item.preferredStore
    ? (STORE_BADGE_STYLE[item.preferredStore] || { bg: "bg-muted", text: "text-muted-foreground" })
    : null;
  const storeIconResolved = item.preferredStore
    ? (getStoreIcon ? getStoreIcon(item.preferredStore) : (STORE_BADGE_STYLE[item.preferredStore]?.icon ?? "🏪"))
    : null;

  // Best price calculation
  const activeFormat = item.formats.find(f => f.id === item.selectedFormatId) || item.formats[0];
  const pricesList = activeFormat && activeFormat.prices ? Object.entries(activeFormat.prices).filter(([, p]) => p && p > 0) : [];
  const bestPrice = useMemo(() => {
    if (pricesList.length === 0) return null;
    return pricesList.reduce((min, cur) => (cur[1]! < min[1]! ? cur : min));
  }, [pricesList]);

  const isActive = mode === "catalogo" ? item.inList : item.bought;
  const handleToggle = mode === "catalogo" ? onToggleInList : onToggleBought;

  return (
    <li className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-3 shadow-sm hover:shadow-lg hover:border-primary/40 hover:bg-card transition-all duration-300 active:scale-[0.98]">
      <div className="flex-1 flex items-center gap-3.5 min-w-0">
        
        {/* BIG CHECKBOX BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className={cn(
            "shrink-0 p-1 flex items-center justify-center transition-transform active:scale-90",
            isActive && "opacity-80"
          )}
        >
          {activeFormat?.image ? (
            <div className="relative">
              <img
                src={activeFormat.image}
                alt={item.name}
                className={cn(
                  "h-14 w-14 rounded-xl object-contain bg-white border-2 shadow-sm transition-all",
                  isActive ? (mode === "catalogo" ? "border-primary scale-95" : "border-emerald-500 scale-95") : "border-border/60"
                )}
              />
              {isActive && (
                <div className={cn(
                  "absolute inset-0 backdrop-blur-[1px] rounded-xl flex items-center justify-center",
                  mode === "catalogo" ? "bg-primary/20" : "bg-emerald-500/20"
                )}>
                  <div className={cn(
                    "text-white rounded-full p-0.5 shadow-sm",
                    mode === "catalogo" ? "bg-primary" : "bg-emerald-500"
                  )}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className={cn(
              "h-8 w-8 rounded-full border-2 transition-all duration-300 shadow-inner flex items-center justify-center",
              isActive 
                ? (mode === "catalogo" ? "bg-primary border-primary text-primary-foreground" : "bg-emerald-500 border-emerald-500 text-white") 
                : "border-muted-foreground/40 bg-background/50 group-hover:border-primary/80 group-hover:bg-primary/10"
            )}>
              {isActive && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </span>
          )}
        </button>

        {/* ROW CONTENT (CLICK TO VIEW DETAILS) */}
        <div 
          className="min-w-0 flex-1 cursor-pointer py-2"
          onClick={() => onViewDetails && onViewDetails()}
        >

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{item.name}</span>
            {item.preferredStore && (() => {
              const cIcon = getStoreIcon ? getStoreIcon(item.preferredStore) : "";
              const hasCustomIcon = !!cIcon;
              if (hasCustomIcon) {
                return (
                  <div title={item.preferredStore} className="shrink-0 flex items-center justify-center bg-white shadow-sm rounded-lg overflow-hidden h-8 w-8 border border-border/50">
                    <DynamicIcon icon={cIcon} fallback="🏪" className="h-full w-full object-cover p-0.5" />
                  </div>
                );
              }
              const sb = storeBadge || { bg: "bg-muted", text: "text-muted-foreground" };
              return (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 border font-medium flex items-center gap-0.5",
                    sb.bg,
                    sb.text,
                  )}
                >
                  <DynamicIcon icon={(sb as any).icon ?? "🏪"} fallback="🏪" className="h-3 w-3 object-cover rounded-sm" />
                  <span>{item.preferredStore}</span>
                </Badge>
              );
            })()}
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
        {item.inList && onUpdateQuantity && (
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 mr-1 border border-border/50">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(-1); }}
              className="text-muted-foreground hover:text-foreground p-1 hover:bg-background rounded-md transition-all h-7 w-7 flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="text-xs font-bold text-foreground w-4 text-center select-none">
              {item.quantity || 1}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdateQuantity(1); }}
              className="text-muted-foreground hover:text-foreground p-1 hover:bg-background rounded-md transition-all h-7 w-7 flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
        )}
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
          onClick={(e) => {
            e.stopPropagation();
            if (mode === "catalogo" && onDelete) onDelete();
            else onToggleInList();
          }}
          aria-label={mode === "catalogo" ? `Eliminar ${item.name}` : `Quitar ${item.name} de la lista`}
          className="text-muted-foreground/50 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all duration-150"
        >
          {mode === "catalogo" ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    </li>
  );
}

