import React, { useState } from "react";
import { Plus, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { SuggestionProduct } from "@/types/database";

interface SmartSuggestionsProps {
  suggestions: SuggestionProduct[];
  onAddSuggestion: (productId: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onAddSuggestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (suggestions.length === 0) {
    return null;
  }

  // On mobile, show first 4 items or all if expanded
  const visibleItems = isExpanded ? suggestions : suggestions.slice(0, 6);

  return (
    <section className="px-4 py-1.5 select-none" aria-label="Sugerencias de reposición">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#746f66]">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20" />
          <span>Toca reponer ({suggestions.length})</span>
        </div>

        {suggestions.length > 4 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-[#2d6a4f] font-semibold flex items-center gap-0.5 hover:underline"
          >
            <span>{isExpanded ? "Ver menos" : "Ver todos"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Pill chips: compact, mobile-friendly wrapped or smooth scrolling tags */}
      <div className="flex flex-wrap gap-1.5 py-0.5">
        {visibleItems.map((item) => {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAddSuggestion(item.id)}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-[#fbf7ee] hover:bg-[#f4edd9] active:scale-95 border border-[#e5dcce] text-[#22201d] text-xs font-medium shadow-2xs transition-all group max-w-full"
              title={`Comprado hace ${item.dias_desde_compra} días`}
            >
              {/* Plus icon tag */}
              <span className="w-4 h-4 rounded-full bg-emerald-700/10 group-hover:bg-[#2d6a4f] group-hover:text-white text-[#2d6a4f] flex items-center justify-center transition-colors flex-shrink-0">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </span>

              {/* Product name */}
              <span className="truncate max-w-[190px] sm:max-w-[220px]">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
