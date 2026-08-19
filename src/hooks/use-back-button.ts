import { useEffect, useRef } from "react";

/**
 * Hook para interceptar el botón físico "Atrás" en móviles (PWA).
 * 
 * @param isActive Si es true, se inyecta un estado en el historial para prevenir que la app se cierre.
 * @param onBack Función que se ejecuta cuando el usuario pulsa el botón atrás.
 */
export function useBackButton(isActive: boolean, onBack: () => void) {
  // Guardamos un ref de onBack por si cambia, para no re-ejecutar el efecto y meter más estados
  const onBackRef = useRef(onBack);
  
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!isActive) return;

    // Cuando se activa (ej. se cambia a otra pestaña o se abre un modal)
    // Inyectamos un estado "falso" en el historial del navegador.
    window.history.pushState({ intercept: true }, "");

    const handlePopState = (e: PopStateEvent) => {
      // El usuario ha pulsado atrás y el estado falso se ha consumido.
      onBackRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      
      // Si el componente se desmonta o isActive pasa a false (porque cerramos mediante un botón en pantalla),
      // debemos limpiar el estado falso que metimos, solo si sigue siendo nuestro estado.
      if (window.history.state && window.history.state.intercept) {
        window.history.back();
      }
    };
  }, [isActive]);
}
