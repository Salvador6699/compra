import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Minus, Search } from "lucide-react";
import { Product } from "@/types/database";
import { parseInputQuantity } from "@/hooks/useProducts";

interface QuickAddInputProps {
  onAdd: (rawText: string, quantity?: number) => void;
  catalog: Product[];
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onAdd,
  catalog,
}) => {
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect parsed quantity from natural typing (e.g. "3 panes" or "pan x2")
  const parsed = useMemo(() => {
    return parseInputQuantity(value);
  }, [value]);

  // Sync internal quantity state when parsed quantity changes
  useEffect(() => {
    if (parsed.quantity > 0) {
      setQuantity(parsed.quantity);
    }
  }, [parsed.quantity]);

  const effectiveQty = quantity;

  // Filter catalog products for autocomplete
  const matches = useMemo(() => {
    const searchPart = parsed.name.toLowerCase().trim();
    if (!searchPart || searchPart.length < 1) return [];

    return catalog
      .filter((p) => p.name.toLowerCase().includes(searchPart))
      .slice(0, 6);
  }, [catalog, parsed.name]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = parsed.name.trim();
    if (!clean) return;

    onAdd(clean, effectiveQty);
    setValue("");
    setQuantity(1);
    setShowDropdown(false);
  };

  const handleSelectAutocomplete = (name: string) => {
    onAdd(name, effectiveQty);
    setValue("");
    setQuantity(1);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative px-4 py-2 z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Input box */}
        <div className="relative flex-1 flex items-center shadow-xs">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (value.trim()) setShowDropdown(true);
            }}
            placeholder="¿Qué falta? (ej: 3 panes, leche x2)"
            className="w-full h-13 pl-4 pr-16 text-base rounded-2xl bg-white border border-[#ded8cb] text-[#22201d] placeholder:text-[#a6a095] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] shadow-sm transition-all"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Quantity stepper inside input for fast tap */}
          <div className="absolute right-1.5 flex items-center bg-[#f5f2eb] rounded-xl border border-[#ded8cb] px-1 py-0.5">
            <button
              type="button"
              disabled={effectiveQty <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-6 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] disabled:opacity-30 active:scale-95"
              title="Restar cantidad"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center text-xs font-bold text-[#2d6a4f]">
              {effectiveQty}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-6 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] active:scale-95"
              title="Sumar cantidad"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Big Add button */}
        <button
          type="submit"
          disabled={!parsed.name.trim()}
          aria-label="Añadir a la lista"
          className="w-13 h-13 rounded-2xl bg-[#2d6a4f] hover:bg-[#23533e] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </form>

      {/* Dropdown flotante de autocompletado */}
      {showDropdown && matches.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-4 right-19 top-16 bg-white rounded-2xl border border-[#ded8cb] shadow-xl overflow-hidden py-1 divide-y divide-stone-100 z-30 animate-in fade-in zoom-in-98 duration-100"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#746f66] uppercase flex items-center gap-1 bg-[#faf8f5]">
            <Search className="w-3 h-3 text-[#a6a095]" />
            <span>Del historial ({effectiveQty > 1 ? `añadir x${effectiveQty}` : "añadir"})</span>
          </div>

          {matches.map((item) => {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectAutocomplete(item.name)}
                className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-[#f7f5f0] active:bg-[#eeebe3] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#22201d] text-base">
                    {item.name}
                  </span>
                  {effectiveQty > 1 && (
                    <span className="text-xs font-bold text-[#2d6a4f] bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      x{effectiveQty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.en_lista ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      En lista
                    </span>
                  ) : item.ultima_cantidad_comprada > 1 ? (
                    <span className="text-[11px] text-[#a6a095]">
                      suele x{item.ultima_cantidad_comprada}
                    </span>
                  ) : null}
                  <Plus className="w-4 h-4 text-[#2d6a4f]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
