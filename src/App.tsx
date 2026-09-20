import React, { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useDarkMode } from "@/hooks/useDarkMode";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundEffects";
import { shareShoppingList } from "@/lib/shareList";
import { triggerHaptic } from "@/hooks/useHaptic";
import { Header } from "@/components/Header";
import { QuickAddInput } from "@/components/QuickAddInput";
import { SmartSuggestions } from "@/components/SmartSuggestions";
import { ActiveList } from "@/components/ActiveList";
import { CartList } from "@/components/CartList";
import { FinishPurchaseBar } from "@/components/FinishPurchaseBar";
import { AlertCircle, Loader2 } from "lucide-react";

import { SpiralBinding } from "@/components/SpiralBinding";

export function App() {
  const {
    products,
    activeProducts,
    cartProducts,
    suggestedProducts,
    loading,
    error,
    isOnline,
    isRealtimeConnected,
    sortMode,
    toggleSortMode,
    addProduct,
    adjustQuantity,
    toggleComprado,
    removeFromList,
    addSuggestion,
    addDirectToCart,
    finalizePurchase,
    refresh,
  } = useProducts();

  // Dark Blackboard Theme
  const { isDark, toggleDark } = useDarkMode();

  // Screen Wake Lock: keeps screen awake in the supermarket when items are pending
  const {
    isSupported: isWakeLockSupported,
    isActive: isWakeLockActive,
    isEnabled: isWakeLockEnabled,
    toggleEnabled: toggleWakeLock,
  } = useWakeLock(activeProducts.length > 0);

  // Sound effects state
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    setSoundActive((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  };

  // WhatsApp Share state
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    triggerHaptic(15);
    const result = await shareShoppingList(activeProducts);
    if (result.copied) {
      triggerHaptic([20, 40]);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen desk-bg flex flex-col items-center justify-start p-0 sm:py-6 sm:px-4">
      {/* Libreta con gusanillo lateral sutil, efecto taco de papel y sombra realista */}
      <main className="w-full max-w-md min-h-screen sm:min-h-[92vh] flex flex-col pb-28 relative notebook-shell bg-[#fdfbf7] dark:bg-[#181715] rounded-none sm:rounded-3xl sm:rounded-l-lg overflow-hidden">
        {/* Gusanillo metálico en el lateral izquierdo */}
        <SpiralBinding />

        {/* Zona de contenido con sangría sutil y óptima */}
        <div className="flex-1 flex flex-col pl-6 sm:pl-7 pr-2.5 sm:pr-4 relative z-10">
          {/* Header */}
          <Header
            activeCount={activeProducts.length}
            cartCount={cartProducts.length}
            isRealtimeConnected={isRealtimeConnected}
            isOnline={isOnline}
            isWakeLockActive={isWakeLockActive}
            isWakeLockEnabled={isWakeLockEnabled}
            isWakeLockSupported={isWakeLockSupported}
            onToggleWakeLock={toggleWakeLock}
            isSoundActive={soundActive}
            onToggleSound={handleToggleSound}
            isDark={isDark}
            onToggleDark={toggleDark}
            onShare={handleShare}
            shareCopied={shareCopied}
          />

          {/* Error notification banner if Supabase fails */}
          {error && (
            <div className="mx-3 my-2 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Nota sobre la base de datos:</p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">{error}</p>
                <p className="text-amber-700/80 dark:text-amber-400/80 mt-1">
                  Asegúrate de haber ejecutado el script en <code>supabase/schema.sql</code> en tu panel de Supabase.
                </p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200 underline hover:text-amber-950 dark:hover:text-white"
                >
                  Reintentar conexión
                </button>
              </div>
            </div>
          )}

          {/* Modo Nevera: Input rápido de añadir con autocompletado del catálogo */}
          <QuickAddInput onAdd={addProduct} catalog={products} />

          {/* Modo Repaso del Sábado: Sugerencias basadas en frecuencia */}
          <SmartSuggestions
            suggestions={suggestedProducts}
            onAddSuggestion={addSuggestion}
          />

          {/* Loading skeleton or Lists */}
          {loading && products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#8c8577] dark:text-[#9e988e]">
              <Loader2 className="w-8 h-8 animate-spin text-[#245840] dark:text-emerald-400" />
              <span className="text-sm font-semibold mt-3 text-[#5e5950] dark:text-[#b0a99c]">
                Abriendo tu libreta...
              </span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col notebook-paper -ml-6 sm:-ml-7 pl-6 sm:pl-7 pb-4">
              {/* Modo Supermercado: Lista de productos activos */}
              <ActiveList
                products={activeProducts}
                sortMode={sortMode}
                onToggleSortMode={toggleSortMode}
                onToggle={toggleComprado}
                onRemove={removeFromList}
                onAdjustQuantity={adjustQuantity}
              />

              {/* Bloque inferior: En el carrito / Comprados */}
              <CartList products={cartProducts} onToggle={toggleComprado} />
            </div>
          )}
        </div>

        {/* Barra accesible de finalizar compra */}
        <FinishPurchaseBar
          cartCount={cartProducts.length}
          suggestedProducts={suggestedProducts}
          onFinalize={finalizePurchase}
          onAddDirectToCart={addDirectToCart}
        />
      </main>
    </div>
  );
}

export default App;
