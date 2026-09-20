import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product, SuggestionProduct } from "@/types/database";
import { triggerHaptic } from "./useHaptic";
import { playPencilStroke, playEraseSound, playFinishChime } from "@/lib/soundEffects";

const SPANISH_NUMBER_WORDS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  doce: 12,
  medio: 1,
  media: 1,
};

// Helper to parse quantities from natural typing or voice (e.g. "3 panes", "dos de leche", "leche x2")
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

  // Case 2: Numbers as digits or Spanish words at the start
  // e.g. "3 panes", "dos de leche", "cuatro bricks de leche", "seis huevos"
  const prefixRegex = /^(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|medio|media)\s*(?:[xX]|\s+de|\s+kilos?\s+de|\s+litros?\s+de|\s+paquetes?\s+de|\s+bricks?\s+de|\s+latas?\s+de|\s+botellas?\s+de|\s+docenas?\s+de)?\s+(.+)$/i;
  const prefixMatch = text.match(prefixRegex);

  if (prefixMatch) {
    const rawQty = prefixMatch[1].toLowerCase();
    const parsedNum = parseInt(rawQty, 10);
    const parsedQty = !isNaN(parsedNum) ? parsedNum : SPANISH_NUMBER_WORDS[rawQty] || 1;

    if (parsedQty > 0 && parsedQty <= 99) {
      return { name: prefixMatch[2].trim(), quantity: parsedQty };
    }
  }

  return { name: text, quantity };
}

// Helper to parse multiple products from voice dictation, commas, newlines, or conjunctions
export function parseBulkInput(raw: string): Array<{ name: string; quantity: number }> {
  if (!raw.trim()) return [];

  // 1. Clean conversational leading verbs common in voice dictation ("apunta leche y pan", "comprar manzanas y peras")
  let cleaned = raw.replace(/^(?:añade|añadir|apunta|apuntar|comprar|necesito|necesitamos|pon|poner|traer|hay que comprar)\s+/i, "");

  // 2. Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, "\n");

  // 3. Convert conjunctions " y " or " e " into commas to split items naturally
  // e.g. "leche, pan y café" -> "leche, pan, café"
  // "leche y pan" -> "leche, pan"
  cleaned = cleaned.replace(/\s+(?:y|e)\s+/gi, ", ");

  // 4. In spoken Spanish without commas, users often say: "dos leches tres panes seis huevos"
  // Detect transitions where a number/word-number is preceded by text and separate with comma
  const numTokens = "un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\\d+";
  const numTransitionRegex = new RegExp(`([^,;\\n\\s]+)\\s+(?=(?:${numTokens})\\s+(?:de\\s+)?[a-záéíóúñ]+)`, "gi");
  cleaned = cleaned.replace(numTransitionRegex, "$1, ");

  // 5. Split by comma, semicolon or newline
  const segments = cleaned.split(/[,;\n]+/);
  const results: Array<{ name: string; quantity: number }> = [];

  for (const seg of segments) {
    const cleanedSeg = seg.replace(/^[\s\-*•\d.)]+/, "").trim();
    if (!cleanedSeg) continue;

    const { name, quantity } = parseInputQuantity(cleanedSeg);
    if (name) {
      // Clean up punctuation and capitalize
      const cleanName = name.replace(/[.,;]+$/, "").trim();
      if (cleanName) {
        const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        results.push({ name: formatted, quantity });
      }
    }
  }

  return results;
}

export function useProducts() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Si no hay conexión al entrar, cargar de local; si hay conexión, empezar limpio y cargar de Supabase
  const [products, setProducts] = useState<Product[]>(() => {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem("libreta_products");
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Sorting mode: 'route' (learned walking path in supermarket) or 'alpha' (A-Z)
  const [sortMode, setSortMode] = useState<"route" | "alpha">(() => {
    try {
      const cachedMode = localStorage.getItem("libreta_sort_mode");
      return cachedMode === "alpha" ? "alpha" : "route";
    } catch {
      return "route";
    }
  });

  // Track the order in which items are crossed off in this supermarket trip
  const [sessionCheckOrder, setSessionCheckOrder] = useState<string[]>([]);

  const toggleSortMode = useCallback(() => {
    setSortMode((prev) => {
      const next = prev === "route" ? "alpha" : "route";
      try {
        localStorage.setItem("libreta_sort_mode", next);
      } catch {}
      return next;
    });
  }, []);

  // Sincronización condicional: si hay conexión, borrar local; si no hay conexión, persistir local
  useEffect(() => {
    if (!isOnline) {
      try {
        localStorage.setItem("libreta_products", JSON.stringify(products));
      } catch {}
    } else {
      try {
        localStorage.removeItem("libreta_products");
      } catch {}
    }
  }, [products, isOnline]);

  // Initial fetch / refresh
  const fetchProducts = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      try {
        const cached = localStorage.getItem("libreta_products");
        if (cached) {
          setProducts(JSON.parse(cached));
        }
      } catch {}
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) {
        setError(fetchErr.message);
        // Fallback a local solo si falla la consulta
        try {
          const cached = localStorage.getItem("libreta_products");
          if (cached) {
            setProducts(JSON.parse(cached));
          }
        } catch {}
        return;
      }

      // Conexión exitosa: normalizar (incluso si está vacía [])
      const normalized = (data || []).map((p) => ({
        ...p,
        cantidad: p.cantidad ?? 1,
        ultima_cantidad_comprada: p.ultima_cantidad_comprada ?? 1,
        dias_por_unidad: Number(p.dias_por_unidad ?? p.intervalo_dias_promedio ?? 7),
        total_unidades_compradas: p.total_unidades_compradas ?? p.total_compras ?? 0,
        orden_recorrido: Number(p.orden_recorrido ?? 100),
      }));

      setProducts(normalized);
      setIsOnline(true);

      // Borrar explícitamente el almacenamiento local
      try {
        localStorage.removeItem("libreta_products");
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar productos";
      console.error("Error fetching products:", err);
      setError(msg);
      try {
        const cached = localStorage.getItem("libreta_products");
        if (cached) {
          setProducts(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchProducts();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setProducts((curr) => {
        try {
          localStorage.setItem("libreta_products", JSON.stringify(curr));
        } catch {}
        return curr;
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProducts]);

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
  const activeProducts = useMemo(() => {
    const list = products.filter((p) => p.en_lista && !p.comprado);
    if (sortMode === "alpha") {
      return [...list].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );
    }
    // Route mode: by orden_recorrido ASC, with alphabetical tiebreaker
    return [...list].sort((a, b) => {
      const orderA = a.orden_recorrido ?? 100;
      const orderB = b.orden_recorrido ?? 100;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
  }, [products, sortMode]);

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

  // Quick Add / Reactivate with Quantity (supports single or multi-item bulk entry)
  const addProduct = async (rawInput: string, explicitQty?: number) => {
    const items = parseBulkInput(rawInput);
    if (items.length === 0) return;

    triggerHaptic(items.length > 1 ? [20, 30, 20] : 20);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // For single item, explicitQty overrides if specified
      const finalQuantity = Math.max(1, items.length === 1 && explicitQty ? explicitQty : item.quantity);
      const name = item.name;

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
          orden_recorrido: 100,
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
            orden_recorrido: 100,
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

  // Toggle item between active and cart (tracking walking route order)
  const toggleComprado = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const nextComprado = !prod.comprado;
    triggerHaptic(nextComprado ? [15, 20] : 15);
    if (nextComprado) {
      playPencilStroke();
      setSessionCheckOrder((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    } else {
      playEraseSound();
      setSessionCheckOrder((prev) => prev.filter((id) => id !== productId));
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, comprado: nextComprado } : p))
    );

    const { error: updateErr } = await supabase
      .from("products")
      .update({ comprado: nextComprado })
      .eq("id", productId);

    if (updateErr) {
      console.warn("Error toggling comprado (saved locally):", updateErr);
    }
  };

  // Remove from list
  const removeFromList = async (productId: string) => {
    triggerHaptic(10);
    playEraseSound();
    setSessionCheckOrder((prev) => prev.filter((id) => id !== productId));
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
      console.warn("Error removing from list (saved locally):", err);
    }
  };

  // Add suggestion to list (strictly 1 unit)
  const addSuggestion = async (productId: string) => {
    triggerHaptic(20);
    playPencilStroke();

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

  // Add forgotten product directly to cart (e.g. from checkout prompt)
  const addDirectToCart = async (productId: string) => {
    triggerHaptic([20, 30]);
    playPencilStroke();

    setSessionCheckOrder((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, en_lista: true, comprado: true, cantidad: 1 }
          : p
      )
    );

    const { error: err } = await supabase
      .from("products")
      .update({ en_lista: true, comprado: true, cantidad: 1 })
      .eq("id", productId);

    if (err) {
      console.warn("Error adding direct to cart (saved locally):", err);
    }
  };

  // Finalize purchase with quantity tracking and supermarket route learning
  const finalizePurchase = async (): Promise<{ count: number }> => {
    const purchasedItems = products.filter((p) => p.en_lista && p.comprado);
    if (purchasedItems.length === 0) return { count: 0 };

    triggerHaptic([30, 50, 40]);
    playFinishChime();

    // Map the relative order in this shopping trip based on session check sequence
    const fullOrderList: string[] = [
      ...sessionCheckOrder.filter((id) => purchasedItems.some((p) => p.id === id)),
    ];
    for (const item of purchasedItems) {
      if (!fullOrderList.includes(item.id)) {
        fullOrderList.push(item.id);
      }
    }
    const totalOrdered = Math.max(1, fullOrderList.length);

    // Client-side execution with Quantity-aware frequency calculation & Route score update
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

      // 3. Compute learned supermarket route score (10 to 95)
      const orderIndex = fullOrderList.indexOf(item.id);
      const visitScore = Math.round(((orderIndex + 1) / totalOrdered) * 85 + 10);
      const prevRouteScore = item.orden_recorrido ?? 100;

      // Moving average for walking route: 40% historical + 60% recent trip
      const newRouteScore = (item.total_compras || 0) >= 1
        ? Math.round((prevRouteScore * 0.4) + (visitScore * 0.6))
        : visitScore;

      // 4. Update product in Supabase
      await supabase
        .from("products")
        .update({
          ultima_compra: todayStr,
          ultima_cantidad_comprada: boughtQty,
          total_compras: (item.total_compras || 0) + 1,
          total_unidades_compradas: totalUnits + boughtQty,
          dias_por_unidad: Math.max(0.5, newDaysPerUnit),
          intervalo_dias_promedio: Math.max(1, Math.round(newDaysPerUnit * boughtQty)),
          orden_recorrido: newRouteScore,
          cantidad: 1, // reset quantity for next time
          en_lista: false,
          comprado: false,
        })
        .eq("id", item.id);
    }

    setSessionCheckOrder([]);
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
    sortMode,
    toggleSortMode,
    addProduct,
    adjustQuantity,
    toggleComprado,
    removeFromList,
    addSuggestion,
    addDirectToCart,
    finalizePurchase,
    refresh: fetchProducts,
  };
}
