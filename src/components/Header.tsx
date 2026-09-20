import React from "react";
import { Wifi, WifiOff, Sparkles, Smartphone, Volume2, VolumeX } from "lucide-react";

interface HeaderProps {
  activeCount: number;
  cartCount: number;
  isRealtimeConnected: boolean;
  isOnline: boolean;
  isWakeLockActive: boolean;
  isWakeLockEnabled: boolean;
  isWakeLockSupported: boolean;
  onToggleWakeLock: () => void;
  isSoundActive: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCount,
  cartCount,
  isRealtimeConnected,
  isOnline,
  isWakeLockActive,
  isWakeLockEnabled,
  isWakeLockSupported,
  onToggleWakeLock,
  isSoundActive,
  onToggleSound,
}) => {
  const todayFormatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="pt-4 pb-2 px-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#22201d] font-heading">
            Libreta de la Compra
          </h1>
          <p className="text-xs font-medium text-[#746f66] mt-0.5 capitalize">
            {capitalizedDate}
          </p>
        </div>

        {/* Controls and Status indicators */}
        <div className="flex items-center gap-1.5">
          {/* Sound toggle button */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={isSoundActive ? "Silenciar sonidos" : "Activar sonido de lápiz"}
            title={isSoundActive ? "Sonido de lápiz activado" : "Sonido silenciado"}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
              isSoundActive
                ? "bg-[#faf6ee] text-[#2d6a4f] border-[#ded7c8] hover:bg-[#f3ede0]"
                : "bg-stone-100 text-stone-400 border-stone-200"
            }`}
          >
            {isSoundActive ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Screen Wake Lock toggle button (keep screen on) */}
          {isWakeLockSupported && (
            <button
              type="button"
              onClick={onToggleWakeLock}
              aria-label={
                isWakeLockEnabled
                  ? "Pantalla siempre encendida activada"
                  : "Activar pantalla siempre encendida"
              }
              title={
                isWakeLockActive
                  ? "Pantalla siempre encendida: ACTIVA (no se apagará sola en el súper)"
                  : isWakeLockEnabled
                  ? "Pantalla siempre encendida habilitada"
                  : "Pantalla siempre encendida desactivada"
              }
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                isWakeLockActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs ring-2 ring-emerald-200/60"
                  : isWakeLockEnabled
                  ? "bg-[#faf6ee] text-emerald-700/70 border-[#ded7c8]"
                  : "bg-stone-100 text-stone-400 border-stone-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          {/* Live sync badge */}
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
                <span className="hidden sm:inline">Offline</span>
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
      <div className="mt-2.5 flex items-center justify-between text-xs text-[#746f66] border-b border-[#e2dcce]/70 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-[#22201d]">
            {activeCount === 0
              ? "Todo listo"
              : `${activeCount} ${activeCount === 1 ? "pendiente" : "pendientes"}`}
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
