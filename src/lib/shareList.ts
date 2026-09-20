import { Product } from "@/types/database";

export async function shareShoppingList(activeProducts: Product[]): Promise<{ shared: boolean; copied: boolean }> {
  if (activeProducts.length === 0) {
    return { shared: false, copied: false };
  }

  const lines = activeProducts.map((p) => {
    const qty = p.cantidad && p.cantidad > 1 ? `x${p.cantidad} ` : "";
    return `• ${p.name} ${qty}`.trim();
  });

  const messageText = `🛒 *Lista de la compra:*\n\n${lines.join("\n")}\n\n_Compartido desde Libreta de la Compra_`;

  // 1. Try Web Share API (native WhatsApp/Telegram share sheet on mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Lista de la compra",
        text: messageText,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      // User cancelled share dialog, or fallback
      if (err?.name === "AbortError") {
        return { shared: false, copied: false };
      }
    }
  }

  // 2. Fallback: Copy to clipboard
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(messageText);
      return { shared: false, copied: true };
    }
  } catch (err) {
    console.warn("No se pudo copiar al portapapeles:", err);
  }

  return { shared: false, copied: false };
}
