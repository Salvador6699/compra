# 📝 Hoja de Ruta y Cosas a Implementar en Lista de la Compra

Este documento consolida el estado actual, el análisis competitivo, los bugs detectados y el plan de implementación de las futuras actualizaciones para la aplicación "Lista de la Compra", priorizando el uso móvil en tienda (Mobile-First).

---

## 🐛 Fase 0: Corrección de Errores Inmediatos (Bugs)
- [x] **Eliminación Silenciosa**: Mostrar notificaciones (Toasts con `sonner`) al intentar borrar categorías o supermercados que ya tienen productos asignados en lugar de cancelar la acción sin avisar.
- [x] **Buscador Sensible a Tildes**: Normalizar el texto (ignorar acentos) para que búsquedas como "salmon" encuentren "Salmón".
- [x] **Interfaz Zombi de Sincronización**: Eliminar la sección en Ajustes que pide "URL del Servidor" y el botón "Sincronizar", ya que la app actual es 100% local y esos botones no tienen función.

## 🛠️ Fase 0.5: UX Core (Pre-Supabase)
- [x] **Implementar "Cantidades"**: Añadir el campo `quantity` al modelo de datos `Item` y botones de incremento/decremento rápidos (`- 1 +`) directo en las tarjetas de lista, evitando abrir menús adicionales. *(Crítico hacer esto ANTES de migrar a la nube para no tener que refactorizar la base de datos de Supabase luego).*

## 🚀 Fase 1: Arquitectura, Supabase y Colaboración
- [ ] **Migración a la Nube**: Desplegar el Frontend (PWA) en **Vercel** y usar **Supabase** para el backend (Base de Datos y Autenticación).
- [ ] **Esquema de Base de Datos**:
  - `households` y `profiles`: Para gestionar grupos familiares y vincular usuarios.
  - `items_catalog`: **(Global)** Catálogo colaborativo compartido para toda la comunidad.
  - `shopping_list`, `trips`, `trip_items` y `loyalty_cards`: Vinculados y privados a cada hogar (`household_id`).
- [ ] **Autenticación y Sincronización In-Store**: 
  - Login/Registro con enlace mágico o email. Compartir listas con código de 6 dígitos.
  - **Sincronización Real-time**: Suscripción vía WebSockets (`supabase.channel`) para ver instantáneamente si el otro miembro de la familia tacha un producto en otro pasillo, evitando dobles compras.
  - Script automático para migrar datos actuales del `localStorage` a Supabase sin perder nada.
- [ ] **Almacenamiento de Tickets**: Migrar la subida de fotos de tickets a **Supabase Storage**. *(Resuelve definitivamente el Bug Crítico de 5MB de límite del `localStorage`)*.

## 📱 Fase 1.5: Experiencia de Compra Mobile-First
- [ ] **Gestos Swipe**: Añadir soporte para "deslizar a la derecha" (tachar) y "deslizar a la izquierda" (borrar) usando `framer-motion` o `@use-gesture/react` en `ItemRow.tsx`.
- [ ] **Drawers (Bottom Sheets)**: Reemplazar los componentes `Dialog` por `Drawer` (ej. librería `vaul`) en dispositivos móviles. Facilitan el uso a una mano y no entran en conflicto con el teclado nativo.
- [ ] **Micro-animaciones y Feedback**: Al marcar como comprado, retrasar ~500ms su bajada a la sección inferior y aplicar una atenuación, para que el usuario no pierda el contexto si pulsó por error.
- [ ] **Pantalla Siempre Activa**: Añadir un toggle para mantener la pantalla encendida (WakeLock API) durante el "Modo Compra".

## 📸 Fase 2: Escáner Inteligente (Código de Barras)
- [ ] **Lector en PWA**: Integrar `html5-qrcode` para la cámara trasera.
- [ ] **Flujo Inteligente**: Autocompletar con *Open Food Facts*, extraer precio/peso de códigos de báscula (empiezan por 2) y tachar automático de lista al escanear.

## 💳 Fase 3: Tarjetero de Fidelización Digital
- [ ] **Cartera (Wallet)**: Sección nativa para guardar tarjetas (Mi Carrefour, Lidl Plus, etc.).
- [ ] **Escaneo Rápido en Caja**: Maximizar brillo de pantalla automáticamente y generar código de barras (`bwip-js`) para lectura directa por láser de caja.

## 💡 Fase 4: Sugerencias y Extras
- [ ] **Sugerencias Predictivas**: Algoritmo sobre historial de compras para sugerir re-compra de habituales.
- [ ] **Nutri-Score**: Visualización pasiva de info nutricional y alérgenos en el catálogo.

---
> **Nota:** La aplicación se mantendrá como PWA (Progressive Web App) instalable, combinando la velocidad de React 19 / Zustand con el poder en la nube de Supabase.
