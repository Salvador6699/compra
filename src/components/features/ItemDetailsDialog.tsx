import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/lib/use-shopping-store";
import { DynamicIcon } from "@/components/dynamic-icon";
import { CATEGORIES, STORE_BADGE_STYLE, STORES, type StoreName } from "@/lib/shopping-data";
import { Store as StoreIcon, Tag, Coins, Image as ImageIcon, Info, X } from "lucide-react";
import { useState, useEffect } from "react";

export function ItemDetailsDialog({
  item,
  open,
  onClose,
  getStoreIcon,
  getCategoryIcon,
}: {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  getStoreIcon: (st: string) => string;
  getCategoryIcon: (cat: string) => string;
}) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setViewingImage(null);
  }, [open]);

  if (!item) return null;

  const activeFormat = item.formats.find(f => f.id === item.selectedFormatId) || item.formats[0];
  const cIcon = item.preferredStore ? getStoreIcon(item.preferredStore) : "";
  const storeBadge = item.preferredStore ? (STORE_BADGE_STYLE[item.preferredStore] || { bg: "bg-muted", text: "text-muted-foreground", icon: "🏪" }) : null;

  const pricesList = activeFormat && activeFormat.prices ? Object.entries(activeFormat.prices).filter(([, p]) => p && p > 0) : [];
  const bestPrice = pricesList.length > 0 ? pricesList.reduce((min, cur) => (cur[1]! < min[1]! ? cur : min)) : null;

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="rounded-3xl p-0 overflow-hidden max-w-sm border-none shadow-2xl max-h-[100dvh] sm:max-h-[85vh]">
        
        {/* Header with image */}
        <div 
          className="relative h-48 bg-muted/30 w-full flex items-center justify-center cursor-pointer active:opacity-80 transition-opacity"
          onClick={() => {
            if (activeFormat?.image) setViewingImage(activeFormat.image);
          }}
        >
          {activeFormat?.image ? (
            <img 
              src={activeFormat.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-primary/30" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md rounded-full px-3 py-1 shadow-sm flex items-center gap-1.5 border border-white/20">
            <DynamicIcon icon={getCategoryIcon(item.category)} fallback="📦" className="h-4 w-4" />
            <span className="text-xs font-bold">{item.category}</span>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground leading-tight">{item.name}</h2>
            {item.note && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-start gap-1">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{item.note}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Store Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-3 shadow-sm">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <StoreIcon className="h-3 w-3" />
                Tienda Preferida
              </div>
              {item.preferredStore ? (
                <div className="flex items-center gap-2">
                  {cIcon ? (
                    <div title={item.preferredStore} className="shrink-0 flex items-center justify-center bg-white shadow-sm rounded-lg overflow-hidden h-6 w-6 border border-border/50">
                      <DynamicIcon icon={cIcon} fallback="🏪" className="h-full w-full object-cover p-0.5" />
                    </div>
                  ) : (
                    <DynamicIcon icon={storeBadge?.icon || "🏪"} fallback="🏪" className="h-5 w-5" />
                  )}
                  <span className="text-sm font-bold truncate">{item.preferredStore}</span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">Ninguna</span>
              )}
            </div>

            {/* Format Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-3 shadow-sm">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Formato
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{activeFormat?.name || "Unidad"}</span>
                <span className="text-sm text-muted-foreground font-medium">({activeFormat?.size || 1} {activeFormat?.unit || "ud"})</span>
              </div>
            </div>
          </div>

          {/* Price History */}
          {pricesList.length > 0 && (
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/40">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-primary" />
                Historial de Precios
              </div>
              <ul className="space-y-2.5">
                {pricesList.sort((a, b) => a[1]! - b[1]!).map(([storeName, price]) => {
                  const isBest = bestPrice && bestPrice[0] === storeName;
                  const stIcon = getStoreIcon(storeName);
                  const sb = STORE_BADGE_STYLE[storeName as StoreName] || { bg: "bg-muted", text: "text-muted-foreground", icon: "🏪" };
                  
                  return (
                    <li key={storeName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {stIcon ? (
                           <div className="shrink-0 flex items-center justify-center bg-white shadow-sm rounded-lg overflow-hidden h-6 w-6 border border-border/50">
                             <DynamicIcon icon={stIcon} fallback="🏪" className="h-full w-full object-cover p-0.5" />
                           </div>
                        ) : (
                          <DynamicIcon icon={sb.icon || "🏪"} fallback="🏪" className="h-5 w-5 rounded-md" />
                        )}
                        <span className="text-sm font-semibold text-foreground">{storeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                          {price?.toFixed(2)}€
                        </span>
                        {isBest && (
                          <span className="text-[9px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">
                            Mejor
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 pt-0">
          <button 
            onClick={onClose}
            className="w-full h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-2xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Visor de imagen a pantalla completa totalmente independiente del Dialog de Radix para evitar bugs */}
    {viewingImage && (
      <div 
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in-0 p-4 sm:p-8"
        onClick={() => setViewingImage(null)}
      >
        <img 
          src={viewingImage} 
          alt="Ampliación" 
          className="max-w-full max-h-[90dvh] object-contain rounded-md"
          onClick={(e) => e.stopPropagation()} 
        />
        <button 
          type="button"
          onClick={() => setViewingImage(null)}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    )}
    </>
  );
}
