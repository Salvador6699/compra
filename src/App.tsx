import React from "react";
import { useProducts } from "@/hooks/useProducts";
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
    addProduct,
    adjustQuantity,
    toggleComprado,
    removeFromList,
    addSuggestion,
    finalizePurchase,
    refresh,
  } = useProducts();

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
          onFinalize={finalizePurchase}
        />
      </main>
    </div>
  );
}

export default App;
