# Hoja de Ruta: Nuevas Funcionalidades a Implementar

Este documento detalla todas las características planificadas para evolucionar la aplicación `lista_compra`, combinando las mejoras descubricas en el análisis de la competencia con la nueva lógica automatizada de escaneo de códigos de barras, diseñada para reducir la fricción del usuario al mínimo.

## 1. Migración a la Nube (Arquitectura)
Para soportar las nuevas funcionalidades sin costes, se migrará la aplicación a una arquitectura moderna:
*   **Frontend (PWA):** Despliegue en **Vercel** (Plan Gratuito).
*   **Backend (Base de Datos y Auth):** Integración con **Supabase** (Plan Gratuito).
*   *Objetivo:* Conseguir almacenamiento persistente en la nube y capacidad de sincronización en tiempo real sin perder la rapidez actual.

## 2. Escáner de Códigos de Barras y Lógica Automatizada
> [!IMPORTANT]
> El objetivo principal es que el usuario solo tenga que **escanear el producto** y la app haga el resto automáticamente.

*   **Lector en la PWA:** Integración de acceso a la cámara del dispositivo (`html5-qrcode` o `BarcodeDetector`) para leer códigos EAN-13 e internos.
*   **Flujo Inteligente de un solo escaneo:**
    1.  **Si no está en catálogo:** Lo busca en la API pública *Open Food Facts* para rellenar nombre y foto automáticamente y lo guarda en Supabase. Si no existe, abre un formulario rápido.
    2.  **Si el precio falta o es distinto:** Permite actualizar el precio para el supermercado actual.
    3.  **Si está en la lista pendiente:** Lo marca instantáneamente como "comprado".
*   **Lectura de productos al peso (Frescos):** Lógica especial para detectar códigos internos (empiezan por 2) generados por básculas de supermercado, extrayendo el peso o precio directamente del código sin requerir acción del usuario.

## 3. Listas Compartidas y Multiusuario (Tiempo Real)
*   **Colaboración Familiar:** Usando las suscripciones en tiempo real de Supabase, varios miembros de la familia pueden tener la app abierta y ver cómo se tachan los productos al instante cuando alguien los compra.
*   **Autenticación Sencilla:** Sistema de login básico (email o enlace mágico) para vincular listas a un "hogar" o grupo familiar.

## 4. Tarjetero de Fidelización Digital
> [!TIP]
> Mejora de comodidad: Evita que el usuario tenga que cambiar entre tu app y las apps de los supermercados en la caja.

*   **Cartera Integrada:** Sección en la app donde el usuario puede registrar (escaneando una vez) sus tarjetas como *Mi Carrefour*, *Lidl Plus* o *Club Dia*.
*   **Mostrar en Caja:** Un botón rápido que maximiza el brillo de la pantalla y muestra el código de barras o QR de la tarjeta de fidelidad del supermercado en el que se encuentra comprando.

## 5. Sugerencias Inteligentes (Predictivas)
*   Aprovechando el historial de compras en Supabase, la app sugerirá añadir a la lista productos que el usuario compra habitualmente y que hace tiempo que no añade (ej. "Sueles comprar Leche cada semana, ¿quieres añadirla?").

## 6. Información Nutricional (Opcional)
*   Gracias a la integración con la API de *Open Food Facts*, mostrar de forma pasiva el **Nutri-Score** y avisos de alérgenos al visualizar la ficha del producto en el catálogo.

---
**Siguiente Paso Sugerido:** Configurar el proyecto inicial en Supabase y crear las tablas base (`productos`, `precios`, `lista_compra`) para comenzar con la migración.
