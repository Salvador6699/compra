import React, { useState } from "react";
import { CheckCircle2, Loader2, Sparkles, AlertTriangle, Plus, Check } from "lucide-react";
import { SuggestionProduct } from "@/types/database";

interface FinishPurchaseBarProps {
  cartCount: number;
  suggestedProducts?: SuggestionProduct[];
  onFinalize: () => Promise<{ count: number }>;
  onAddDirectToCart?: (productId: string) => Promise<void>;
}

export const FinishPurchaseBar: React.FC<FinishPurchaseBarProps> = ({
  cartCount,
  suggestedProducts = [],
  onFinalize,
  onAddDirectToCart,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  if (cartCount === 0) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onFinalize();
      setShowModal(false);
      setAddedIds([]);
    } catch (err) {
      console.error("Error al finalizar compra:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddForgotten = async (productId: string) => {
    if (!onAddDirectToCart || addedIds.includes(productId)) return;
    setAddedIds((prev) => [...prev, productId]);
    await onAddDirectToCart(productId);
  };

  return (
    <>
      {/* Sticky Bottom Action Bar with notch / safe-area padding */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#faf8f5] dark:from-[#181716] via-[#faf8f5]/95 dark:via-[#181716]/95 to-transparent pb-[calc(1rem+env(safe-area-inset-bottom))] z-30 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full h-14 rounded-2xl bg-[#2d6a4f] hover:bg-[#23533e] active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-3 shadow-lg shadow-[#2d6a4f]/25 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Finalizar compra ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1e1c1a] p-6 shadow-2xl border border-[#ded8cb] dark:border-[#383531] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2d6a4f] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-[#22201d] dark:text-[#f4f1ea] font-heading">
                ¿Finalizar esta compra?
              </h3>
              <p className="text-sm text-[#746f66] dark:text-[#9e988e] leading-relaxed">
                Has marcado <strong className="text-[#22201d] dark:text-[#f4f1ea]">{cartCount} productos</strong> como comprados.
                Guardaremos la fecha para recalcular cuándo toca reponerlos y aprenderemos tu ruta del supermercado.
              </p>
            </div>

            {/* Aviso preventivo de olvidos frecuentes */}
            {suggestedProducts.length > 0 && (
              <div className="bg-amber-50 dark:bg-[#252219] border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-3.5 space-y-2 text-left">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="font-semibold text-xs">
                    ¿Seguro que no falta nada?
                  </span>
                </div>
                <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/80 leading-snug">
                  Por su consumo habitual, hoy suele tocar reponer:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {suggestedProducts.map((p) => {
                    const isAdded = addedIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddForgotten(p.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          isAdded
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-white dark:bg-[#191816] text-[#22201d] dark:text-[#f4f1ea] border border-amber-300/70 dark:border-amber-700/60 hover:border-[#2d6a4f] active:scale-95 cursor-pointer shadow-2xs"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                            <span>{p.name} (en cesta)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 text-[#2d6a4f] stroke-[2.5]" />
                            <span>{p.name}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#8c8273] dark:text-[#999] pt-0.5">
                  Toca para incluirlo si ya lo cogiste. Si prefieres ir a buscarlo, pulsa "Seguir comprando".
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="w-full h-12 rounded-xl bg-[#2d6a4f] hover:bg-[#23533e] active:scale-[0.98] disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Calculando reposición y ruta...</span>
                  </>
                ) : (
                  <span>Sí, finalizar y limpiar</span>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="w-full h-11 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#2a2724] dark:hover:bg-[#34312d] text-[#746f66] dark:text-[#d1ccc4] font-medium transition-all cursor-pointer"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
