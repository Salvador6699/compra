import React from "react";
import {
  Wifi,
  WifiOff,
  Sparkles,
  Smartphone,
  Volume2,
  VolumeX,
  Share2,
  Moon,
  Sun,
  Check,
} from "lucide-react";

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
  isDark: boolean;
  onToggleDark: () => void;
  onShare: () => void;
  shareCopied: boolean;
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
  isDark,
  onToggleDark,
  onShare,
  shareCopied,
}) => {
  const todayFormatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="pt-0 pb-2 px-1 sm:px-2 select-none">
      {/* Cinta superior de encuadernación / cabecera de libreta fina y elegante */}
      <div className="-ml-6 sm:-ml-7 -mr-2.5 sm:-mr-4 mb-3 h-2.5 bg-gradient-to-r from-[#29241d] via-[#3d362a] to-[#29241d] dark:from-[#141311] dark:via-[#22201d] dark:to-[#141311] border-b border-[#5c5344]/50 dark:border-[#38332b]/50 shadow-2xs flex items-center justify-center">
        <div className="w-14 h-0.5 border-t border-dashed border-[#857a68]/40" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#181715] dark:text-[#f8f6f0] font-heading">
              Libreta de la Compra
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#666055] dark:text-[#aba498] mt-0.5 capitalize">
            {capitalizedDate}
          </p>
        </div>

        {/* Controls and Status indicators */}
        <div className="flex items-center gap-1.5">
          {/* Share / WhatsApp button */}
          <button
            type="button"
            onClick={onShare}
            disabled={activeCount === 0}
            aria-label="Compartir lista por WhatsApp"
            title="Compartir o copiar lista para WhatsApp"
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 relative ${
              shareCopied
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-[#f5efe3] dark:bg-[#252320] text-[#245840] dark:text-emerald-400 border-[#cfc6b6] dark:border-[#423d36] hover:bg-[#ebe2d2] disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
            }`}
          >
            {shareCopied ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Theme toggle: Light paper vs Dark blackboard */}
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? "Cambiar a modo papel claro" : "Cambiar a modo pizarra oscura"}
            title={isDark ? "Modo Pizarra Oscura activado" : "Modo Papel Claro"}
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#cfc6b6] dark:border-[#423d36] bg-[#f5efe3] dark:bg-[#252320] text-[#5e5950] dark:text-[#d1ccc4] hover:text-[#181715] dark:hover:text-white transition-all active:scale-90 shadow-2xs cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Sound toggle button */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={isSoundActive ? "Silenciar sonidos" : "Activar sonido de lápiz"}
            title={isSoundActive ? "Sonido de lápiz activado" : "Sonido silenciado"}
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 cursor-pointer shadow-2xs ${
              isSoundActive
                ? "bg-[#f5efe3] dark:bg-[#252320] text-[#245840] dark:text-emerald-400 border-[#cfc6b6] dark:border-[#423d36] hover:bg-[#ebe2d2]"
                : "bg-stone-200/60 dark:bg-[#201e1b] text-stone-400 dark:text-stone-500 border-stone-300 dark:border-[#33302a]"
            }`}
          >
            {isSoundActive ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
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
              <Smartphone className="w-3.5 h-3.5" />
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

      {/* Toast popup when list is copied to clipboard */}
      {shareCopied && (
        <div className="mt-2 py-1 px-3 rounded-xl bg-emerald-700 text-white text-xs font-medium text-center shadow-md animate-in fade-in slide-in-from-top-1">
          ¡Lista copiada con formato para WhatsApp!
        </div>
      )}

      {/* Mini counter bar */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-[#5e5950] dark:text-[#b0a99c] border-b-2 border-[#dcd4c5] dark:border-[#38342e] pb-2">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-[#181715] dark:text-[#f8f6f0]">
            {activeCount === 0
              ? "Todo listo"
              : `${activeCount} ${activeCount === 1 ? "pendiente" : "pendientes"}`}
          </span>
          {cartCount > 0 && (
            <>
              <span className="text-[#a8a090] dark:text-[#5a544a]">•</span>
              <span className="text-[#245840] dark:text-emerald-400 font-bold">
                {cartCount} en el carro
              </span>
            </>
          )}
        </div>
        <div className="text-[11px] font-semibold text-[#8c8577] dark:text-[#8a8478] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#245840] dark:text-emerald-400" />
          <span>Fricción cero</span>
        </div>
      </div>
    </header>
  );
};
