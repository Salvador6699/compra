import React from "react";
import { Product } from "@/types/database";
import { X, Check, Plus, Minus, Navigation, ArrowDownAZ } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHaptic";

interface ActiveListProps {
  products: Product[];
  sortMode?: "route" | "alpha";
  onToggleSortMode?: () => void;
  onToggle: (productId: string) => void;
  onRemove: (productId: string) => void;
  onAdjustQuantity: (productId: string, delta: number) => void;
}

export const ActiveList: React.FC<ActiveListProps> = ({
  products,
  sortMode = "route",
  onToggleSortMode,
  onToggle,
  onRemove,
  onAdjustQuantity,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-12 px-6 text-center select-none">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#f3eedf] border border-[#e0d8c7] flex items-center justify-center text-[#8c8273] mb-3">
          <Check className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h3 className="text-lg font-bold text-[#22201d] font-heading">
          ¡Libreta al día!
        </h3>
        <p className="text-sm text-[#746f66] mt-1 max-w-xs mx-auto">
          No tienes productos pendientes en la lista. Escribe arriba qué falta o revisa las sugerencias de reposición.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 select-none">
      {/* Optional toolbar when multiple items are pending */}
      {products.length > 1 && onToggleSortMode && (
        <div className="flex items-center justify-between pb-2 px-1 text-xs text-[#8c8273]">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
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
                ? "Ordenado según tu recorrido habitual por el supermercado. Pulsa para ordenar A-Z."
                : "Ordenado alfabéticamente. Pulsa para ordenar por recorrido del súper."
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0ece1] hover:bg-[#e7e2d5] text-[#555047] active:scale-95 transition-all cursor-pointer font-medium"
          >
            {sortMode === "route" ? (
              <>
                <Navigation className="w-3 h-3 text-[#2d6a4f] rotate-45" />
                <span>Ruta del súper</span>
              </>
            ) : (
              <>
                <ArrowDownAZ className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>A - Z</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {products.map((item) => {
          const qty = item.cantidad || 1;

          return (
            <div
              key={item.id}
              className="group relative flex items-center justify-between min-h-[56px] px-3.5 py-2 rounded-2xl bg-white border border-[#e2dcce] shadow-2xs hover:border-[#cfc7b6] active:bg-[#fbf9f4] transition-all"
            >
              {/* Main tap area: whole row toggles item to cart */}
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="flex-1 flex items-center gap-3 text-left py-1 pr-2 cursor-pointer min-w-0"
              >
                {/* Check circle */}
                <div className="w-6 h-6 rounded-lg border-2 border-[#b8b0a2] group-hover:border-[#2d6a4f] flex items-center justify-center transition-colors flex-shrink-0">
                  <span className="opacity-0 group-active:opacity-100 transition-opacity">
                    <Check className="w-3.5 h-3.5 text-[#2d6a4f] stroke-[3]" />
                  </span>
                </div>

                {/* Product name & quantity badge */}
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-base font-medium text-[#22201d] pencil-strikethrough leading-snug line-clamp-2">
                    {item.name}
                  </span>
                  {qty > 1 && (
                    <span className="text-xs font-bold text-[#2d6a4f] bg-emerald-50 px-1.5 py-0.2 rounded-md flex-shrink-0">
                      x{qty}
                    </span>
                  )}
                </div>
              </button>

              {/* Quantity stepper for quick one-thumb adjustments */}
              <div className="flex items-center gap-0.5 flex-shrink-0 ml-1.5">
                <div className="flex items-center bg-[#f5f2eb] rounded-xl border border-[#ded8cb] p-0.5">
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustQuantity(item.id, -1);
                    }}
                    className="w-6 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] disabled:opacity-25 active:scale-90 transition-transform"
                    title="Restar cantidad"
                    aria-label={`Restar cantidad de ${item.name}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-5 text-center text-xs font-bold text-[#22201d]">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustQuantity(item.id, 1);
                    }}
                    className="w-6 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] active:scale-90 transition-transform"
                    title="Añadir cantidad"
                    aria-label={`Añadir más cantidad de ${item.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  title="Quitar de la lista"
                  aria-label={`Quitar ${item.name} de la lista`}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#a6a095] hover:text-[#d90429] hover:bg-red-50 active:scale-90 transition-all ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
