import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Minus, Search, Mic, MicOff } from "lucide-react";
import { Product } from "@/types/database";
import { parseInputQuantity, parseBulkInput } from "@/hooks/useProducts";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceInput();

  // Detect parsed quantity from natural typing
  const parsed = useMemo(() => {
    return parseInputQuantity(value);
  }, [value]);

  // Detect if input contains multiple items (bulk)
  const bulkItems = useMemo(() => {
    return parseBulkInput(value);
  }, [value]);

  // Sync internal quantity state when parsed quantity changes
  useEffect(() => {
    if (parsed.quantity > 0) {
      setQuantity(parsed.quantity);
    }
  }, [parsed.quantity]);

  const effectiveQty = quantity;

  // Filter catalog products for autocomplete (only if single item being typed)
  const matches = useMemo(() => {
    if (bulkItems.length > 1) return [];
    const searchPart = parsed.name.toLowerCase().trim();
    if (!searchPart || searchPart.length < 1) return [];

    return catalog
      .filter((p) => p.name.toLowerCase().includes(searchPart))
      .slice(0, 6);
  }, [catalog, parsed.name, bulkItems.length]);

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
    const clean = value.trim();
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

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript, isFinal) => {
        setValue(transcript);
        if (isFinal) {
          // If speech is recognized as final sentence, add directly after short moment
          setTimeout(() => {
            if (transcript.trim()) {
              onAdd(transcript.trim());
              setValue("");
              setQuantity(1);
            }
          }, 350);
        }
      });
    }
  };

  return (
    <div className="relative px-4 py-2 z-20 select-none">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
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
            placeholder={
              isListening
                ? "Escuchando... di qué falta"
                : "¿Qué falta? (ej: 2 leche, pan)"
            }
            className={`w-full h-13 pl-4 pr-16 text-base rounded-2xl bg-white border text-[#22201d] placeholder:text-[#a6a095] focus:outline-none focus:ring-2 shadow-sm transition-all ${
              isListening
                ? "border-red-400 focus:ring-red-200/50 bg-red-50/20"
                : "border-[#ded8cb] focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
            }`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Stepper inside input for fast single-tap quantity */}
          <div className="absolute right-1.5 flex items-center bg-[#f5f2eb] rounded-xl border border-[#ded8cb] px-0.5 py-0.5">
            <button
              type="button"
              disabled={effectiveQty <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-5 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] disabled:opacity-25 active:scale-95"
              title="Restar cantidad"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-4 text-center text-xs font-bold text-[#2d6a4f]">
              {effectiveQty}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-5 h-7 flex items-center justify-center text-[#746f66] hover:text-[#22201d] active:scale-95"
              title="Sumar cantidad"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Voice dictation button (if browser supports SpeechRecognition) */}
        {isSupported && (
          <button
            type="button"
            onClick={handleToggleVoice}
            aria-label={isListening ? "Detener dictado" : "Dictar por voz"}
            title={isListening ? "Detener dictado" : "Dictar productos por voz"}
            className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer active:scale-95 ${
              isListening
                ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200 shadow-md"
                : "bg-[#f4efe4] hover:bg-[#eae3d5] text-[#746f66] hover:text-[#22201d] border border-[#ded8cb]"
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Mic className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        )}

        {/* Big Add button */}
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Añadir a la lista"
          className="w-13 h-13 rounded-2xl bg-[#2d6a4f] hover:bg-[#23533e] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </form>

      {/* Multiple items preview pill if multiple items detected */}
      {bulkItems.length > 1 && (
        <div className="mt-2 p-2.5 rounded-2xl bg-[#f4faec] border border-[#d4eac2] text-[#24543f] text-xs animate-in fade-in space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#24543f]">
            <span>Se detectaron {bulkItems.length} productos:</span>
            <span className="text-[10px] font-medium text-[#3b6f59]">
              pulsa [+] o Enter
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {bulkItems.map((b, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#d4eac2] text-xs font-medium text-[#22201d] shadow-2xs"
              >
                <span>{b.name}</span>
                {b.quantity > 1 && (
                  <span className="text-[10px] font-bold text-[#2d6a4f] bg-emerald-50 px-1.5 py-0.2 rounded">
                    x{b.quantity}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Floating autocomplete dropdown */}
      {showDropdown && matches.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-4 right-19 top-16 bg-white rounded-2xl border border-[#ded8cb] shadow-xl overflow-hidden py-1 divide-y divide-stone-100 z-30 animate-in fade-in zoom-in-98 duration-100"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#746f66] uppercase flex items-center gap-1 bg-[#faf8f5]">
            <Search className="w-3 h-3 text-[#a6a095]" />
            <span>
              Del historial (
              {effectiveQty > 1 ? `añadir x${effectiveQty}` : "añadir"})
            </span>
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
