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

export function BackupDialog({
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

