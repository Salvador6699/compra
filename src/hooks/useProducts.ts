import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product, SuggestionProduct } from "@/types/database";
import { triggerHaptic } from "./useHaptic";

// Helper to parse quantities from natural typing (e.g., "3 panes", "leche x2", "2 de aceite")
export function parseInputQuantity(rawText: string): { name: string; quantity: number } {
  let text = rawText.trim();
  let quantity = 1;

  // Case 1: "pan x3", "pan x 3", "pan * 3"
  const suffixMatch = text.match(/^(.*?)\s+[xX*]\s*(\d+)$/);
  if (suffixMatch) {
    const parsedQty = parseInt(suffixMatch[2], 10);
    if (parsedQty > 0 && parsedQty <= 99) {
      return { name: suffixMatch[1].trim(), quantity: parsedQty };
    }
  }

  // Case 2: "3 panes", "3 de leche", "3x leche"
  const prefixMatch = text.match(/^(\d+)\s*(?:[xX]|\s+de|\s+)?\s+(.+)$/);
  if (prefixMatch) {
    const parsedQty = parseInt(prefixMatch[1], 10);
    if (parsedQty > 0 && parsedQty <= 99) {
      return { name: prefixMatch[2].trim(), quantity: parsedQty };
    }
  }

  return { name: text, quantity };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("libreta_products");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(products.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Sync to localStorage for offline and zero-drop resilience
  useEffect(() => {
    try {
      localStorage.setItem("libreta_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initial fetch
  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      if (data && data.length > 0) {
        const normalized = data.map((p) => ({
          ...p,
          cantidad: p.cantidad ?? 1,
          ultima_cantidad_comprada: p.ultima_cantidad_comprada ?? 1,
          dias_por_unidad: Number(p.dias_por_unidad ?? p.intervalo_dias_promedio ?? 7),
          total_unidades_compradas: p.total_unidades_compradas ?? p.total_compras ?? 0,
        }));

        setProducts(normalized);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar productos";
      console.error("Error fetching products:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("shared_shopping_list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newProduct = payload.new as Product;
            setProducts((prev) => {
              if (prev.some((p) => p.id === newProduct.id)) return prev;
              return [...prev, newProduct].sort((a, b) =>
                a.name.localeCompare(b.name, "es", { sensitivity: "base" })
              );
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Product;
            setProducts((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
          } else if (payload.eventType === "DELETE") {
            const oldProduct = payload.old as { id: string };
            setProducts((prev) => prev.filter((p) => p.id !== oldProduct.id));
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Derived lists
  const activeProducts = useMemo(
    () => products.filter((p) => p.en_lista && !p.comprado),
    [products]
  );

  const cartProducts = useMemo(
    () => products.filter((p) => p.en_lista && p.comprado),
    [products]
  );

  // Suggestions based on QUANTITY and DAYS PER UNIT:
  // duracion_esperada = ultima_cantidad_comprada * dias_por_unidad
  const suggestedProducts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list: SuggestionProduct[] = [];

    for (const product of products) {
      if (product.en_lista) continue;

      // Solo sugerir si se ha comprado al menos 2 veces para confirmar un hábito periódico
      // Las compras únicas o esporádicas se quedan en el catálogo para autocompletar, no en sugerencias
      if ((product.total_compras || 0) < 2) continue;

      if (product.ultima_compra) {
        const lastPurchaseDate = new Date(product.ultima_compra);
        lastPurchaseDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - lastPurchaseDate.getTime();
        const daysSinceLastPurchase = Math.max(
          0,
          Math.floor(diffTime / (1000 * 60 * 60 * 24))
        );

        const lastQty = product.ultima_cantidad_comprada || 1;
        const daysPerUnit = product.dias_por_unidad || product.intervalo_dias_promedio || 7;
        const duracionEsperada = Math.max(1, Math.round(lastQty * daysPerUnit));

        // Algoritmo: transcurrido >= duracion_esperada - 1
        if (daysSinceLastPurchase >= duracionEsperada - 1) {
          list.push({
            ...product,
            dias_desde_compra: daysSinceLastPurchase,
            duracion_esperada: duracionEsperada,
          });
        }
      }
    }

    // Sort by most overdue first
    return list.sort(
      (a, b) =>
        b.dias_desde_compra -
        b.duracion_esperada -
        (a.dias_desde_compra - a.duracion_esperada)
    );
  }, [products]);

  // Quick Add / Reactivate with Quantity
  const addProduct = async (rawInput: string, explicitQty?: number) => {
    const { name, quantity: parsedQty } = parseInputQuantity(rawInput);
    if (!name) return;

    const finalQuantity = Math.max(1, explicitQty || parsedQty || 1);
    triggerHaptic(20);

    // Check if product already exists (case-insensitive)
    const existing = products.find(
      (p) => p.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === existing.id
            ? { ...p, en_lista: true, comprado: false, cantidad: finalQuantity }
            : p
        )
      );

      const { error: updateErr } = await supabase
        .from("products")
        .update({
          en_lista: true,
          comprado: false,
          cantidad: finalQuantity,
        })
        .eq("id", existing.id);

      if (updateErr) {
        console.warn("Supabase update error (persisting locally):", updateErr);
      }
    } else {
      const tempId = crypto.randomUUID();
      const newProd: Product = {
        id: tempId,
        name,
        cantidad: finalQuantity,
        en_lista: true,
        comprado: false,
        ultima_compra: null,
        ultima_cantidad_comprada: finalQuantity,
        dias_por_unidad: 7,
        intervalo_dias_promedio: 7,
        total_compras: 0,
        total_unidades_compradas: 0,
        created_at: new Date().toISOString(),
      };

      setProducts((prev) =>
        [...prev, newProd].sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        )
      );

      const { data, error: insertErr } = await supabase
        .from("products")
        .insert({
          name,
          cantidad: finalQuantity,
          en_lista: true,
          comprado: false,
          ultima_cantidad_comprada: finalQuantity,
          dias_por_unidad: 7,
          intervalo_dias_promedio: 7,
          total_compras: 0,
          total_unidades_compradas: 0,
        })
        .select()
        .single();

      if (insertErr) {
        console.warn("Supabase insert error (persisting locally):", insertErr);
      } else if (data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === tempId ? (data as Product) : p))
        );
      }
    }
  };

  // Adjust quantity on active list items (+1 or -1)
  const adjustQuantity = async (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const currentQty = prod.cantidad || 1;
    const newQty = Math.max(1, Math.min(99, currentQty + delta));
    if (newQty === currentQty) return;

    triggerHaptic(15);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, cantidad: newQty } : p))
    );

    const { error: err } = await supabase
      .from("products")
      .update({ cantidad: newQty })
      .eq("id", productId);

    if (err) {
      console.error("Error adjusting quantity:", err);
      fetchProducts();
    }
  };

  // Toggle item between active and cart
  const toggleComprado = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const nextComprado = !prod.comprado;
    triggerHaptic(nextComprado ? [15, 20] : 15);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, comprado: nextComprado } : p))
    );

    const { error: updateErr } = await supabase
      .from("products")
      .update({ comprado: nextComprado })
      .eq("id", productId);

    if (updateErr) {
      console.error("Error toggling comprado:", updateErr);
      fetchProducts();
    }
  };

  // Remove from list
  const removeFromList = async (productId: string) => {
    triggerHaptic(10);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, en_lista: false, comprado: false } : p
      )
    );

    const { error: err } = await supabase
      .from("products")
      .update({ en_lista: false, comprado: false })
      .eq("id", productId);

    if (err) {
      console.error("Error removing from list:", err);
      fetchProducts();
    }
  };

  // Add suggestion to list (strictly 1 unit)
  const addSuggestion = async (productId: string) => {
    triggerHaptic(20);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, en_lista: true, comprado: false, cantidad: 1 }
          : p
      )
    );

    const { error: err } = await supabase
      .from("products")
      .update({ en_lista: true, comprado: false, cantidad: 1 })
      .eq("id", productId);

    if (err) {
      console.warn("Error adding suggestion (saved locally):", err);
    }
  };

  // Finalize purchase with quantity tracking
  const finalizePurchase = async (): Promise<{ count: number }> => {
    const purchasedItems = products.filter((p) => p.en_lista && p.comprado);
    if (purchasedItems.length === 0) return { count: 0 };

    triggerHaptic([30, 50, 40]);

    // Try Supabase RPC first
    try {
      const { data, error: rpcErr } = await supabase.rpc("finalize_purchase");
      if (!rpcErr && data) {
        await fetchProducts();
        return { count: purchasedItems.length };
      }
      if (rpcErr) {
        console.warn("RPC finalize_purchase error, running fallback:", rpcErr);
      }
    } catch (e) {
      console.warn("RPC caught exception:", e);
    }

    // Client-side fallback with Quantity-aware frequency calculation
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    for (const item of purchasedItems) {
      const boughtQty = Math.max(1, item.cantidad || 1);
      const prevQty = Math.max(1, item.ultima_cantidad_comprada || 1);
      const totalUnits = Math.max(0, item.total_unidades_compradas || 0);

      // 1. Insert history with quantity
      await supabase.from("purchase_history").insert({
        product_id: item.id,
        cantidad: boughtQty,
        purchased_at: todayStr,
      });

      // 2. Compute new days per unit
      let newDaysPerUnit = Number(item.dias_por_unidad || item.intervalo_dias_promedio || 7);
      if (item.ultima_compra && item.total_compras >= 1) {
        const lastDate = new Date(item.ultima_compra);
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        // Moving average weighted by units consumed in that interval
        newDaysPerUnit = Number(
          (
            (newDaysPerUnit * Math.max(1, totalUnits) + diffDays) /
            (Math.max(1, totalUnits) + prevQty)
          ).toFixed(2)
        );
      }

      // 3. Update product
      await supabase
        .from("products")
        .update({
          ultima_compra: todayStr,
          ultima_cantidad_comprada: boughtQty,
          total_compras: (item.total_compras || 0) + 1,
          total_unidades_compradas: totalUnits + boughtQty,
          dias_por_unidad: Math.max(0.5, newDaysPerUnit),
          intervalo_dias_promedio: Math.max(1, Math.round(newDaysPerUnit * boughtQty)),
          cantidad: 1, // reset quantity for next time
          en_lista: false,
          comprado: false,
        })
        .eq("id", item.id);
    }

    await fetchProducts();
    return { count: purchasedItems.length };
  };

  return {
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
    refresh: fetchProducts,
  };
}
