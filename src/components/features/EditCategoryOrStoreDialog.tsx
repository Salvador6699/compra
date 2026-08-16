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
import { useScrollOnFocus } from "@/hooks/useScrollOnFocus";

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

export function EditCategoryOrStoreDialog({
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollOnFocus = useScrollOnFocus();

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
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) onClose();
    }}>
      <DialogContent 
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-2xl max-w-sm overflow-y-auto max-h-[100dvh] sm:max-h-[90vh]"
      >
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
              onFocus={scrollOnFocus}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Icon Option 1: Emoji */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Icono (Emoji)</Label>
            <Input
              value={icon.startsWith("data:") || icon.startsWith("http") || icon.startsWith("lucide:") ? "" : icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ej: 🍦, 💊, 🏬..."
              onFocus={scrollOnFocus}
              className="rounded-xl text-xs pr-24"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase font-semibold text-muted-foreground">O Icono Predefinido</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-xl text-xs font-semibold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 gap-2 mb-2"
          >
            <Wand className="h-4 w-4" />
            Elegir icono predefinido
          </Button>

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

        <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 bg-background border-t border-border/30 flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 text-base font-bold rounded-2xl">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim()} className="flex-1 h-14 text-base font-bold text-white shadow-lg bg-gradient-to-r from-primary to-primary/90 rounded-2xl">
            Guardar
          </Button>
        </div>

        <IconPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={setIcon}
        />
      </DialogContent>
    </Dialog>
  );
}


