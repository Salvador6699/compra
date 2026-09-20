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
    <div className="min-h-screen notebook-bg flex flex-col items-center">
      {/* Container constrained to mobile phone width for optimal one-hand ergonomics */}
      <main className="w-full max-w-md min-h-screen flex flex-col pb-28 relative">
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
          <div className="mx-4 my-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Nota sobre la base de datos:</p>
              <p className="text-amber-800 mt-0.5">{error}</p>
              <p className="text-amber-700/80 mt-1">
                Asegúrate de haber ejecutado el script en <code>supabase/schema.sql</code> en tu panel de Supabase.
              </p>
              <button
                type="button"
                onClick={refresh}
                className="mt-2 text-xs font-semibold text-amber-900 underline hover:text-amber-950"
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
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#a6a095]">
            <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
            <span className="text-sm font-medium mt-3 text-[#746f66]">
              Abriendo tu libreta...
            </span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
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
