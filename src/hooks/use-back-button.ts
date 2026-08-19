import { useEffect, useRef } from "react";

/**
 * Hook para interceptar el botón físico "Atrás" en móviles (PWA).
 * Soporta anidación perfecta verificando a qué estado navegamos.
 * 
 * @param isActive Si es true, se inyecta un estado en el historial para prevenir que la app se cierre.
 * @param onBack Función que se ejecuta cuando el usuario pulsa el botón atrás.
 */
export function useBackButton(isActive: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!isActive) return;

    // Generamos un ID único para ESTE nivel de modal
    const interceptId = Date.now() + Math.random();
    
    // Inyectamos nuestro estado
    window.history.pushState({ interceptId }, "");

    const handlePopState = (e: PopStateEvent) => {
      // Si el estado al que llegamos tiene nuestro ID, significa que un modal HIJO 
      // acaba de ser cerrado, por lo que volvemos a ser el modal activo. NO cerramos nada.
      if (e.state && e.state.interceptId === interceptId) {
        return;
      }
      
      // Si el estado no es el nuestro, significa que el usuario ha retrocedido MÁS ALLÁ
      // de nuestro estado, o sea, quiere cerrar ESTE modal.
      onBackRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      
      // Si cerramos el modal mediante un botón en pantalla (ej. "X"), 
      // el componente se desmonta pero el estado sigue en la historia.
      // Comprobamos si EL ESTADO ACTUAL es el nuestro para limpiarlo.
      if (window.history.state && window.history.state.interceptId === interceptId) {
        window.history.back();
      }
    };
  }, [isActive]);
}
