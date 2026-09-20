import React from "react";
import { Wifi, WifiOff, Sparkles } from "lucide-react";

interface HeaderProps {
  activeCount: number;
  cartCount: number;
  isRealtimeConnected: boolean;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeCount,
  cartCount,
  isRealtimeConnected,
  isOnline,
}) => {
  const todayFormatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="pt-4 pb-3 px-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#22201d] font-heading flex items-center gap-2">
              <span>Libreta de la Compra</span>
            </h1>
          </div>
          <p className="text-xs font-medium text-[#746f66] mt-0.5 capitalize">
            {capitalizedDate}
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors ${
              !isOnline
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isRealtimeConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                : "bg-stone-100 text-stone-600 border-stone-200"
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">Sin conexión</span>
              </>
            ) : isRealtimeConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold tracking-wide">EN VIVO</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-stone-400" />
                <span className="text-[11px]">Conectando...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini counter bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#746f66] border-b border-[#e2dcce]/70 pb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[#22201d]">
            {activeCount === 0
              ? "Todo listo"
              : `${activeCount} ${activeCount === 1 ? "cosa pendiente" : "cosas pendientes"}`}
          </span>
          {cartCount > 0 && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-emerald-700 font-medium">
                {cartCount} en el carro
              </span>
            </>
          )}
        </div>
        <div className="text-[11px] text-[#a6a095] flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Fricción cero</span>
        </div>
      </div>
    </header>
  );
};
