import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Minus,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  LayoutList,
  Layers,
  RotateCcw,
  X,
  Calendar,
  Trash2,
} from "lucide-react";
import { Product, SuggestionProduct } from "@/types/database";
import { triggerHaptic } from "@/hooks/useHaptic";

interface SmartSuggestionsProps {
  suggestions: SuggestionProduct[];
  onAddSuggestion: (productId: string, quantity?: number) => void;
  onAddAllSuggestions?: (items?: { id: string; quantity?: number }[]) => void;
  onSnoozeSuggestion?: (productId: string, days: number) => void;
  onUnSnoozeSuggestion?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => Promise<void> | void;
  snoozedProducts?: (Product & { snoozedUntil: string; daysLeft: number })[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onAddSuggestion,
  onAddAllSuggestions,
  onSnoozeSuggestion,
  onUnSnoozeSuggestion,
  onDeleteProduct,
  snoozedProducts = [],
}) => {
  // Mode: compact chips vs detail cards
  const [viewMode, setViewMode] = useState<"chips" | "detail">(() => {
    try {
      return (localStorage.getItem("libreta_suggestions_view") as "chips" | "detail") || "chips";
    } catch {
      return "chips";
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [showSnoozedList, setShowSnoozedList] = useState(false);
  const [toastInfo, setToastInfo] = useState<{
    name: string;
    id: string;
    days?: number;
    isDeleted?: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Persist view preference
  const toggleViewMode = () => {
    triggerHaptic(10);
    const next = viewMode === "chips" ? "detail" : "chips";
    setViewMode(next);
    try {
      localStorage.setItem("libreta_suggestions_view", next);
    } catch {}
  };

  // Close popup menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setConfirmDeleteId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
        setConfirmDeleteId(null);
      }
    };

    if (activeMenuId) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenuId]);

  // Clean toast timeout
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Handle snooze action
  const handleSnooze = (item: SuggestionProduct, days: number) => {
    triggerHaptic([15, 20]);
    if (onSnoozeSuggestion) {
      onSnoozeSuggestion(item.id, days);
    }
    setActiveMenuId(null);
    setConfirmDeleteId(null);

    // Show temporary toast with undo
    setToastInfo({ name: item.name, id: item.id, days });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastInfo(null);
    }, 4500);
  };

  // Handle Undo snooze
  const handleUndoSnooze = () => {
    if (toastInfo && onUnSnoozeSuggestion && !toastInfo.isDeleted) {
      triggerHaptic(15);
      onUnSnoozeSuggestion(toastInfo.id);
      setToastInfo(null);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    }
  };

  // Handle permanent delete
  const handleDelete = async (item: SuggestionProduct) => {
    if (!onDeleteProduct) return;
    triggerHaptic([20, 40]);
    await onDeleteProduct(item.id);
    setActiveMenuId(null);
    setConfirmDeleteId(null);

    setToastInfo({ name: item.name, id: item.id, isDeleted: true });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastInfo(null);
    }, 4000);
  };

  // Quantity helpers
  const getItemQuantity = (item: SuggestionProduct) => {
    if (customQuantities[item.id] !== undefined) {
      return customQuantities[item.id];
    }
    return Math.max(1, item.ultima_cantidad_comprada || 1);
  };

  const setItemQuantity = (id: string, qty: number) => {
    setCustomQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, qty),
    }));
  };

  // Add single item
  const handleAdd = (item: SuggestionProduct, customQty?: number) => {
    const qty = customQty ?? getItemQuantity(item);
    onAddSuggestion(item.id, qty);
    setActiveMenuId(null);
    setConfirmDeleteId(null);
  };

  // Add all suggestions at once
  const handleAddAll = () => {
    if (!onAddAllSuggestions) return;
    triggerHaptic([25, 40]);
    const items = suggestions.map((item) => ({
      id: item.id,
      quantity: getItemQuantity(item),
    }));
    onAddAllSuggestions(items);
  };

  // If no suggestions and no snoozed items, hide
  if (suggestions.length === 0 && snoozedProducts.length === 0) {
    return null;
  }

  // Limit in chips mode if not expanded
  const visibleItems = isExpanded || viewMode === "detail" ? suggestions : suggestions.slice(0, 6);

  return (
    <section
      className="px-1 sm:px-2 py-2 select-none relative"
      aria-label="Sugerencias de reposición periódica"
    >
      {/* Toast informativo (pospuesto con deshacer o eliminado definitivo) */}
      {toastInfo && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-[#252219] border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 truncate">
            {toastInfo.isDeleted ? (
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <span className="truncate">
              {toastInfo.isDeleted ? (
                <>
                  <strong>{toastInfo.name}</strong> eliminado de la base de datos.
                </>
              ) : (
                <>
                  <strong>{toastInfo.name}</strong> pospuesto {toastInfo.days} días.
                </>
              )}
            </span>
          </div>
          {!toastInfo.isDeleted && (
            <button
              type="button"
              onClick={handleUndoSnooze}
              className="flex items-center gap-1 font-bold text-amber-950 dark:text-amber-100 underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Deshacer</span>
            </button>
          )}
        </div>
      )}

      {/* Cabecera principal siempre visible (Sticky al hacer scroll) */}
      <div className="sticky top-0 z-30 -mx-1 sm:-mx-2 px-1.5 sm:px-2 py-2 bg-[#fdfbf7]/95 dark:bg-[#181715]/95 backdrop-blur-md border-b border-[#e5dcce]/80 dark:border-[#38332b]/80 flex items-center justify-between gap-2 mb-2 shadow-xs transition-all">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#746f66] dark:text-[#a8a296]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
            <span>Toca reponer</span>
          </div>
          {suggestions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
              {suggestions.length}
            </span>
          )}
        </div>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-1.5">
          {/* Botón Añadir todas */}
          {suggestions.length > 0 && onAddAllSuggestions && (
            <button
              type="button"
              onClick={handleAddAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700/10 dark:bg-emerald-950/60 hover:bg-[#2d6a4f] text-[#2d6a4f] hover:text-white dark:text-emerald-300 dark:hover:text-white border border-emerald-600/30 dark:border-emerald-700/50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Añadir todas las sugerencias a la lista activa"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Añadir todas ({suggestions.length})</span>
            </button>
          )}

          {/* Alternar modo Vista: Chips compactos vs Detalle */}
          <button
            type="button"
            onClick={toggleViewMode}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              viewMode === "detail"
                ? "bg-[#2d6a4f]/15 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-300 border-[#2d6a4f]/30 dark:border-emerald-700/50"
                : "bg-transparent text-[#746f66] dark:text-[#a8a296] hover:bg-[#eae3d5] dark:hover:bg-[#2a2723] border-transparent"
            }`}
            title={viewMode === "chips" ? "Cambiar a vista de fichas detalladas" : "Cambiar a vista de etiquetas compactas"}
            aria-label={viewMode === "chips" ? "Cambiar a vista de fichas detalladas" : "Cambiar a vista de etiquetas compactas"}
          >
            {viewMode === "chips" ? (
              <LayoutList className="w-4 h-4" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
          </button>

          {/* Ver más / menos (en modo chips si hay más de 6) */}
          {viewMode === "chips" && suggestions.length > 6 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-[#2d6a4f] dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>{isExpanded ? "Menos" : `+${suggestions.length - 6}`}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODO A: CHIPS COMPACTOS CON BADGES DE TIEMPO, CANTIDAD Y MENÚ DE ACCIÓN */}
      {viewMode === "chips" && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {visibleItems.map((item) => {
            const habitualQty = item.ultima_cantidad_comprada || 1;
            const diffDays = item.dias_desde_compra - item.duracion_esperada;
            const isMenuOpen = activeMenuId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const isOverdue = diffDays >= 2;

            return (
              <div
                key={item.id}
                className="relative inline-flex items-stretch rounded-full bg-[#fbf7ee] dark:bg-[#201e1b] border border-[#e5dcce] dark:border-[#38332b] shadow-2xs hover:border-[#2d6a4f]/50 dark:hover:border-emerald-600/50 transition-all group max-w-full"
              >
                {/* Zona principal del Chip: Click para Añadir */}
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-left text-xs font-medium text-[#22201d] dark:text-[#f4f1ea] active:scale-[0.98] transition-transform rounded-l-full truncate cursor-pointer"
                  title={`Última compra hace ${item.dias_desde_compra} días. Clic para añadir.`}
                >
                  {/* Icono + circular */}
                  <span className="w-4 h-4 rounded-full bg-emerald-700/10 dark:bg-emerald-900/40 group-hover:bg-[#2d6a4f] group-hover:text-white text-[#2d6a4f] dark:text-emerald-400 flex items-center justify-center transition-colors flex-shrink-0">
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                  </span>

                  {/* Nombre del producto */}
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">
                    {item.name}
                  </span>

                  {/* Badge de cantidad habitual (si > 1) */}
                  {habitualQty > 1 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#e8e0d0] dark:bg-[#2d2a25] text-[#5e5950] dark:text-[#c2bbb0] flex-shrink-0">
                      x{habitualQty}
                    </span>
                  )}

                  {/* Badge de tiempo / días transcurridos */}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 font-medium ${
                      isOverdue
                        ? "bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 font-semibold"
                        : "bg-[#ece5d8] dark:bg-[#2b2722] text-[#746f66] dark:text-[#9e988e]"
                    }`}
                  >
                    hace {item.dias_desde_compra}d
                  </span>
                </button>

                {/* Botón de reloj / opciones (Snooze, Info y Borrar) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    setActiveMenuId(isMenuOpen ? null : item.id);
                    setConfirmDeleteId(null);
                  }}
                  className={`px-1.5 py-1 rounded-r-full text-[#8c8577] dark:text-[#948e83] hover:text-[#22201d] dark:hover:text-[#f8f6f0] hover:bg-[#f0e9d9] dark:hover:bg-[#2a2723] transition-colors border-l border-[#e5dcce]/70 dark:border-[#38332b]/70 flex items-center justify-center cursor-pointer ${
                    isMenuOpen ? "bg-[#f0e9d9] dark:bg-[#2a2723] text-[#22201d]" : ""
                  }`}
                  title="Ficha, opciones y gestión del producto"
                  aria-label={`Opciones para ${item.name}`}
                >
                  <Clock className="w-3 h-3" />
                </button>

                {/* Popover anclado de opciones de consumo / posponer / borrar */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 top-full mt-1.5 z-40 w-68 p-3 rounded-2xl bg-[#fdfbf7] dark:bg-[#201e1b] border border-[#d8cdbc] dark:border-[#3d3830] shadow-xl text-left animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Cabecera del popover */}
                    <div className="flex items-start justify-between gap-1 pb-2 border-b border-[#e5dcce] dark:border-[#332f29]">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-[#181715] dark:text-[#f8f6f0]">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-[#746f66] dark:text-[#a8a296] leading-tight mt-0.5">
                          Comprado hace {item.dias_desde_compra}d · Duración est.: ~{item.duracion_esperada}d
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setConfirmDeleteId(null);
                        }}
                        className="text-[#8c8577] hover:text-[#181715] dark:hover:text-[#f8f6f0] p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selector de cantidad personalizada */}
                    <div className="py-2 flex items-center justify-between border-b border-[#e5dcce] dark:border-[#332f29]">
                      <span className="text-[11px] text-[#5e5950] dark:text-[#c2bbb0] font-medium">
                        Cantidad a añadir:
                      </span>
                      <div className="flex items-center gap-1 bg-[#ede6d8] dark:bg-[#2a2723] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setItemQuantity(item.id, getItemQuantity(item) - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#5e5950] dark:text-[#c2bbb0] hover:bg-white dark:hover:bg-[#35312b] transition-colors cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#181715] dark:text-[#f8f6f0]">
                          {getItemQuantity(item)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemQuantity(item.id, getItemQuantity(item) + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#5e5950] dark:text-[#c2bbb0] hover:bg-white dark:hover:bg-[#35312b] transition-colors cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Botón rápido de Añadir */}
                    <button
                      type="button"
                      onClick={() => handleAdd(item, getItemQuantity(item))}
                      className="w-full mt-2 py-1.5 px-3 rounded-xl bg-[#245840] dark:bg-[#2d6a4f] hover:bg-[#1b4331] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Añadir ({getItemQuantity(item)} ud) a la lista</span>
                    </button>

                    {/* Sección "Aún me queda" (Posponer) */}
                    <div className="mt-2.5 pt-2 border-t border-[#e5dcce] dark:border-[#332f29]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c8577] dark:text-[#948e83] block mb-1.5">
                        ¿Aún te queda en casa?
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSnooze(item, 3)}
                          className="py-1 px-2 rounded-lg bg-[#eee7dc] dark:bg-[#2b2722] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>+3 días</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSnooze(item, 7)}
                          className="py-1 px-2 rounded-lg bg-[#eee7dc] dark:bg-[#2b2722] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>+1 semana</span>
                        </button>
                      </div>
                    </div>

                    {/* SECCIÓN: ELIMINAR DE LA BASE DE DATOS */}
                    {onDeleteProduct && (
                      <div className="mt-2.5 pt-2 border-t border-[#e5dcce] dark:border-[#332f29]">
                        {isConfirmingDelete ? (
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-1.5 animate-in fade-in duration-150">
                            <p className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 leading-tight">
                              ¿Eliminar <strong>{item.name}</strong> de la base de datos?
                            </p>
                            <p className="text-[10px] text-rose-800/80 dark:text-rose-300/80">
                              No volverá a sugerirse ni saldrá en el catálogo.
                            </p>
                            <div className="flex items-center justify-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-[#201e1b] border border-[#d8cdbc] dark:border-[#3d3830] text-[#5e5950] dark:text-[#c2bbb0] hover:bg-[#ece5d8] transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-2xs transition-colors cursor-pointer"
                              >
                                Sí, eliminar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="w-full py-1 px-2 rounded-lg text-[11px] font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Eliminar producto de la base de datos"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>Eliminar de la base de datos</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODO B: TARJETAS DETALLADAS CON MÉTRICAS DE CONSUMO Y BORRADO */}
      {viewMode === "detail" && suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pb-1">
          {suggestions.map((item) => {
            const habitualQty = item.ultima_cantidad_comprada || 1;
            const diffDays = item.dias_desde_compra - item.duracion_esperada;
            const currentQty = getItemQuantity(item);
            const isOverdue = diffDays >= 2;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const progressRatio = Math.min(
              100,
              Math.round((item.dias_desde_compra / Math.max(1, item.duracion_esperada)) * 100)
            );

            return (
              <div
                key={item.id}
                className="bg-[#fdfbf7] dark:bg-[#201e1b] border border-[#e5dcce] dark:border-[#38332b] rounded-2xl p-3 shadow-2xs space-y-2.5 transition-all"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate flex-1">
                    <h4 className="font-heading font-bold text-sm text-[#181715] dark:text-[#f8f6f0] truncate">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-[#746f66] dark:text-[#a8a296]">
                      Comprado {habitualQty} ud{habitualQty > 1 ? "s" : ""} hace {item.dias_desde_compra} días
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isOverdue
                          ? "bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300"
                          : "bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {isOverdue ? `Agotándose (+${diffDays}d)` : "Toca hoy"}
                    </span>

                    {/* Botón rápido de borrar */}
                    {onDeleteProduct && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : item.id)}
                        className="p-1 rounded-md text-[#8c8577] hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar de la base de datos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmación inline de borrado si está activa */}
                {isConfirmingDelete && (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                      ¿Borrar definitivamente de la BD?
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-[#201e1b] border border-[#d8cdbc] text-[#5e5950] dark:text-[#c2bbb0] cursor-pointer"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white cursor-pointer"
                      >
                        Sí, borrar
                      </button>
                    </div>
                  </div>
                )}

                {/* Barra de progreso de consumo estimado */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#8c8577] dark:text-[#948e83] font-medium">
                    <span>Ciclo estimado: ~{item.duracion_esperada} días</span>
                    <span>{progressRatio}% consumido</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#ece5d8] dark:bg-[#2d2924] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverdue ? "bg-amber-600 dark:bg-amber-400" : "bg-[#2d6a4f] dark:bg-emerald-400"
                      }`}
                      style={{ width: `${progressRatio}%` }}
                    />
                  </div>
                </div>

                {/* Fila de acciones y cantidad */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Selector de cantidad */}
                  <div className="flex items-center gap-1 bg-[#ede6d8] dark:bg-[#2a2723] rounded-lg p-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setItemQuantity(item.id, currentQty - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#5e5950] dark:text-[#c2bbb0] hover:bg-white dark:hover:bg-[#35312b] transition-colors cursor-pointer"
                      title="Restar 1 unidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#181715] dark:text-[#f8f6f0]">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemQuantity(item.id, currentQty + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#5e5950] dark:text-[#c2bbb0] hover:bg-white dark:hover:bg-[#35312b] transition-colors cursor-pointer"
                      title="Sumar 1 unidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {/* Botón Posponer 3d */}
                    <button
                      type="button"
                      onClick={() => handleSnooze(item, 3)}
                      className="px-2 py-1.5 rounded-xl bg-[#eee7dc] dark:bg-[#2b2722] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Posponer 3 días (Aún me queda)"
                    >
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Aún me queda</span>
                    </button>

                    {/* Botón Añadir */}
                    <button
                      type="button"
                      onClick={() => handleAdd(item, currentQty)}
                      className="py-1.5 px-3 rounded-xl bg-[#245840] dark:bg-[#2d6a4f] hover:bg-[#1b4331] text-white text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Barra inferior rápida al pie de las fichas */}
          <div className="col-span-1 sm:col-span-2 flex items-center justify-between gap-2 pt-2.5 pb-1 border-t border-[#e5dcce]/70 dark:border-[#38332b]/70">
            <button
              type="button"
              onClick={toggleViewMode}
              className="text-xs text-[#2d6a4f] dark:text-emerald-400 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Volver a etiquetas compactas</span>
            </button>

            {suggestions.length > 0 && onAddAllSuggestions && (
              <button
                type="button"
                onClick={handleAddAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#245840] dark:bg-[#2d6a4f] hover:bg-[#1b4331] text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Añadir todas ({suggestions.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN INFERIOR: PRODUCTOS POSPUESTOS (AÚN ME QUEDA) */}
      {snoozedProducts.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-[#e5dcce]/80 dark:border-[#38332b]/80">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSnoozedList(!showSnoozedList)}
              className="text-[11px] text-[#746f66] dark:text-[#a8a296] hover:text-[#181715] dark:hover:text-[#f8f6f0] flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>
                {snoozedProducts.length} producto{snoozedProducts.length > 1 ? "s" : ""} pospuesto
                {snoozedProducts.length > 1 ? "s" : ""} ("Aún me queda")
              </span>
              {showSnoozedList ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Lista expandible de productos pospuestos para poder restaurarlos */}
          {showSnoozedList && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-150">
              {snoozedProducts.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#f4edd9] dark:bg-[#292621] border border-[#ddd3c1] dark:border-[#3d372e] text-xs text-[#5e5950] dark:text-[#c2bbb0]"
                >
                  <span className="truncate max-w-[130px] font-medium">{p.name}</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold bg-amber-500/10 px-1 py-0.2 rounded">
                    +{p.daysLeft}d
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUnSnoozeSuggestion) {
                        triggerHaptic(15);
                        onUnSnoozeSuggestion(p.id);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-white dark:hover:bg-[#353028] text-emerald-800 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Restaurar a sugerencias de reposición"
                  >
                    <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
