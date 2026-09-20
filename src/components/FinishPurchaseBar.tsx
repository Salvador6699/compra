import React, { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface FinishPurchaseBarProps {
  cartCount: number;
  onFinalize: () => Promise<{ count: number }>;
}

export const FinishPurchaseBar: React.FC<FinishPurchaseBarProps> = ({
  cartCount,
  onFinalize,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cartCount === 0) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onFinalize();
      setShowModal(false);
    } catch (err) {
      console.error("Error al finalizar compra:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sticky Bottom Action Bar with notch / safe-area padding */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#faf8f5] via-[#faf8f5]/95 to-transparent pb-[calc(1rem+env(safe-area-inset-bottom))] z-30 pointer-events-none">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#ded8cb] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d6a4f] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-[#22201d] font-heading">
                ¿Finalizar esta compra?
              </h3>
              <p className="text-sm text-[#746f66] leading-relaxed">
                Has marcado <strong className="text-[#22201d]">{cartCount} productos</strong> como comprados.
                Guardaremos la fecha para recalcular cuándo toca reponerlos y la lista quedará limpia.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="w-full h-12 rounded-xl bg-[#2d6a4f] hover:bg-[#23533e] active:scale-[0.98] disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Calculando reposición...</span>
                  </>
                ) : (
                  <span>Sí, finalizar y limpiar</span>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="w-full h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#746f66] font-medium transition-all"
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
