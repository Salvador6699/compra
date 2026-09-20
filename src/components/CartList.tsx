import React, { useState } from "react";
import { Product } from "@/types/database";
import { CheckCheck, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface CartListProps {
  products: Product[];
  onToggle: (productId: string) => void;
}

export const CartList: React.FC<CartListProps> = ({ products, onToggle }) => {
  const [expanded, setExpanded] = useState(true);

  if (products.length === 0) {
    return null;
  }

  const totalUnits = products.reduce((acc, item) => acc + (item.cantidad || 1), 0);

  return (
    <div className="px-4 py-4 select-none">
      {/* Header bar of cart section */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-[#746f66] dark:text-[#9e988e] hover:text-[#22201d] dark:hover:text-[#f4f1ea] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>
            En el carrito ({products.length} {products.length === 1 ? "ítem" : "ítems"}
            {totalUnits > products.length && ` · ${totalUnits} uds`})
          </span>
        </div>
        <div className="p-1 text-[#a6a095] dark:text-[#787268]">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 mt-1">
          {products.map((item) => {
            const qty = item.cantidad || 1;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className="w-full flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-[#f4f1ea]/75 dark:bg-[#1c1b18]/80 border border-[#e5dfd2] dark:border-[#2e2a24] text-left transition-all active:scale-[0.99] group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Checked icon indicator */}
                  <div className="w-5 h-5 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>

                  {/* Strikethrough item name with quantity */}
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="text-base line-through text-[#8c8577] dark:text-[#7c766b] truncate">
                      {item.name}
                    </span>
                    {qty > 1 && (
                      <span className="text-xs font-bold text-[#8c8577] dark:text-[#9e988e] bg-stone-200/60 dark:bg-[#282622] px-1.5 py-0.2 rounded-sm flex-shrink-0">
                        x{qty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Undo hint icon */}
                <div className="text-xs text-[#a6a095] dark:text-[#6a645b] group-hover:text-[#746f66] dark:group-hover:text-[#b3aca0] flex items-center gap-1 flex-shrink-0 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
