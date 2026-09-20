import React from "react";
import { Product } from "@/types/database";
import { X, Check, Plus, Minus, Navigation, Clock } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHaptic";

interface ActiveListProps {
  products: Product[];
  sortMode?: "route" | "added";
  onToggleSortMode?: () => void;
  onToggle: (productId: string) => void;
  onRemove: (productId: string) => void;
  onAdjustQuantity: (productId: string, delta: number) => void;
}

export const ActiveList: React.FC<ActiveListProps> = ({
  products,
  sortMode = "added",
  onToggleSortMode,
  onToggle,
  onRemove,
  onAdjustQuantity,
}) => {
  return (
    <div className="px-1 sm:px-2 py-2 select-none">
      {/* Toolbar: siempre visible para ver el recuento y alternar el modo de ordenación */}
      {onToggleSortMode && (
        <div className="flex items-center justify-between pb-2 px-1 text-xs text-[#5e5950] dark:text-[#b0a99c]">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#47433c] dark:text-[#c4bdb2]">
            Pendientes ({products.length})
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onToggleSortMode();
            }}
            title={
              sortMode === "route"
                ? "Ordenado según tu recorrido habitual por el supermercado. Pulsa para ver por orden de adición."
                : "Ordenado conforme se añadieron a la lista (recientes arriba). Pulsa para ordenar por recorrido del súper."
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5efe3] dark:bg-[#252320] hover:bg-[#eae1d0] dark:hover:bg-[#2e2b27] text-[#47433c] dark:text-[#d1ccc4] active:scale-95 transition-all cursor-pointer font-semibold border-2 border-[#cfc7b6] dark:border-[#423d35] shadow-2xs"
          >
            {sortMode === "route" ? (
              <>
                <Navigation className="w-3 h-3 text-[#245840] dark:text-emerald-400 rotate-45 stroke-[2.5]" />
                <span>Ruta del súper</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-[#245840] dark:text-emerald-400 stroke-[2.5]" />
                <span>Como se añadió</span>
              </>
            )}
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="py-12 px-6 text-center select-none">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#f3eedf] dark:bg-[#252320] border border-[#e0d8c7] dark:border-[#383531] flex items-center justify-center text-[#8c8273] dark:text-[#9e988e] mb-3">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-bold text-[#22201d] dark:text-[#f4f1ea] font-heading">
            ¡Libreta al día!
          </h3>
          <p className="text-sm text-[#746f66] dark:text-[#9e988e] mt-1 max-w-xs mx-auto">
            No tienes productos pendientes en la lista. Escribe arriba qué falta o revisa las sugerencias de reposición.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
        {products.map((item) => {
          const qty = item.cantidad || 1;

          return (
            <div
              key={item.id}
              className="group relative flex items-center justify-between min-h-[56px] px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1f1d1a] border-2 border-[#cfc7b6] dark:border-[#423d35] shadow-xs hover:border-[#b8af9c] dark:hover:border-[#595248] active:bg-[#fbf9f4] dark:active:bg-[#262420] transition-all animate-in slide-in-from-top-2 fade-in duration-150"
            >
              {/* Main tap area: whole row toggles item to cart */}
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="flex-1 flex items-center gap-3 text-left py-1 pr-2 cursor-pointer min-w-0"
              >
                {/* Check box with crisp hand-drawn feel */}
                <div className="w-6 h-6 rounded-lg border-2 border-[#8c8577] dark:border-[#736c61] group-hover:border-[#245840] dark:group-hover:border-emerald-500 flex items-center justify-center transition-colors flex-shrink-0 bg-[#fbf9f4] dark:bg-[#181715]">
                  <span className="opacity-0 group-active:opacity-100 transition-opacity">
                    <Check className="w-3.5 h-3.5 text-[#245840] dark:text-emerald-400 stroke-[3]" />
                  </span>
                </div>

                {/* Product name & quantity badge */}
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-base font-semibold text-[#181715] dark:text-[#f8f6f0] pencil-strikethrough leading-snug line-clamp-2">
                    {item.name}
                  </span>
                  {qty > 1 && (
                    <span className="text-xs font-bold text-[#245840] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.2 rounded-md flex-shrink-0">
                      x{qty}
                    </span>
                  )}
                </div>
              </button>

              {/* Quantity stepper for quick one-thumb adjustments */}
              <div className="flex items-center gap-0.5 flex-shrink-0 ml-1.5">
                <div className="flex items-center bg-[#f5efe3] dark:bg-[#282622] rounded-xl border border-[#cfc7b6] dark:border-[#423d35] p-0.5">
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustQuantity(item.id, -1);
                    }}
                    className="w-5 h-7 flex items-center justify-center text-[#5e5950] dark:text-[#b0a99c] hover:text-[#181715] dark:hover:text-white disabled:opacity-20 active:scale-95 cursor-pointer"
                    title="Restar cantidad"
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-[#245840] dark:text-emerald-400">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustQuantity(item.id, 1);
                    }}
                    className="w-5 h-7 flex items-center justify-center text-[#5e5950] dark:text-[#b0a99c] hover:text-[#181715] dark:hover:text-white active:scale-95 cursor-pointer"
                    title="Sumar cantidad"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>

                {/* Delete button (cross) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[#8c8577] dark:text-[#787268] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors active:scale-90 cursor-pointer ml-0.5"
                  title="Eliminar de la lista"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
