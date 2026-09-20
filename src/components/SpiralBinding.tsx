import React from "react";

export const SpiralBinding: React.FC = () => {
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-5 pointer-events-none z-20 select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Sombra sutil y fina en el lomo izquierdo */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/15 to-transparent dark:from-black/40 dark:to-transparent z-10" />

      {/* SVG fino y sutil de gusanillo metálico con perforaciones */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Brillo metálico acero fino para Modo Claro */}
          <linearGradient id="wire-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#736f69" />
            <stop offset="30%" stopColor="#d8d4cd" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#aba59c" />
            <stop offset="100%" stopColor="#57534d" />
          </linearGradient>

          {/* Brillo metálico titanio fino para Modo Oscuro */}
          <linearGradient id="wire-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#292725" />
            <stop offset="30%" stopColor="#736e67" />
            <stop offset="50%" stopColor="#cfc9be" />
            <stop offset="70%" stopColor="#524d47" />
            <stop offset="100%" stopColor="#1e1d1b" />
          </linearGradient>

          {/* Orificio discreto */}
          <radialGradient id="hole-depth-light" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1f1d1b" />
            <stop offset="100%" stopColor="#47433d" />
          </radialGradient>

          <radialGradient id="hole-depth-dark" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#0a0908" />
            <stop offset="100%" stopColor="#24221f" />
          </radialGradient>

          {/* Patrón compacto de 36px (alineado con los renglones) */}
          <pattern id="spiral-ring-pattern" width="20" height="36" patternUnits="userSpaceOnUse">
            {/* Pequeña perforación troquelada */}
            <rect
              x="10.5"
              y="12"
              width="2.6"
              height="8"
              rx="1.3"
              className="spiral-hole-fill"
            />

            {/* Sombra suave de la anilla */}
            <path
              d="M -1,13 C 4,9.5 11,10.5 11,15.5 C 11,20.5 4,21.5 -1,18"
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Anilla metálica fina y elegante */}
            <path
              className="spiral-wire-stroke"
              d="M -2,12.5 C 4,9 11.5,10 11.5,15.5 C 11.5,21 4,22 -2,18.5"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Toque de brillo superior */}
            <path
              d="M 0,13 C 4,10 9.5,11 10.5,15"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#spiral-ring-pattern)" />
      </svg>
    </div>
  );
};
