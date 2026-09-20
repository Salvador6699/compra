import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { SuggestionProduct } from "@/types/database";

interface SmartSuggestionsProps {
  suggestions: SuggestionProduct[];
  onAddSuggestion: (productId: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onAddSuggestion,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#746f66]">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Toca reponer (Sugerencias)</span>
        </div>
        <span className="text-[11px] text-[#a6a095]">
          {suggestions.length} {suggestions.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 scroll-smooth">
        {suggestions.map((item) => {
          const lastQty = item.ultima_cantidad_comprada || 1;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAddSuggestion(item.id)}
              className="flex-shrink-0 flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-[#faf5ea] hover:bg-[#f3eedf] active:scale-95 border border-[#e8dfcb] text-[#22201d] transition-all shadow-2xs group"
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#22201d] leading-snug">
                    {item.name}
                  </span>
                  {lastQty > 1 && (
                    <span className="text-[10px] font-bold text-[#2d6a4f] bg-white px-1.5 py-0.2 rounded-md border border-[#e8dfcb]">
                      x{lastQty}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#8c8273]">
                  hace {item.dias_desde_compra}d (estimado ~{item.duracion_esperada}d)
                </span>
              </div>

              <div className="w-6 h-6 rounded-lg bg-white/80 group-hover:bg-[#2d6a4f] group-hover:text-white border border-[#ded8cb] flex items-center justify-center text-[#2d6a4f] transition-colors ml-0.5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
