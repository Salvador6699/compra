import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { STORE_BADGE_STYLE, STORES, type StoreName } from "@/lib/shopping-data";
import type { Item } from "@/lib/use-shopping-store";
import { ChevronDown, ChevronUp, Lightbulb, Sparkles, Store, TrendingDown } from "lucide-react";

interface BasketCalculatorProps {
  items: Item[];
}

export function BasketCalculator({ items }: BasketCalculatorProps) {
  const [openDetails, setOpenDetails] = useState(false);

  // Filter only items in list that are pending (not bought)
  const pendingItems = useMemo(() => items.filter((i) => !i.bought), [items]);

  // Calculate totals per store
  const storeStats = useMemo(() => {
    if (pendingItems.length === 0) return [];

    return STORES.map((storeName) => {
      let total = 0;
      let itemsWithPriceCount = 0;
      const itemDetails: { name: string; price: number }[] = [];

      for (const item of pendingItems) {
        const price = item.prices?.[storeName];
        if (price !== undefined && price > 0) {
          total += price;
          itemsWithPriceCount++;
          itemDetails.push({ name: item.name, price });
        }
      }

      return {
        storeName,
        total,
        itemsWithPriceCount,
        itemDetails,
        hasPrices: itemsWithPriceCount > 0,
        coveragePercent: Math.round((itemsWithPriceCount / pendingItems.length) * 100),
      };
    })
      .filter((stat) => stat.hasPrices)
      .sort((a, b) => a.total - b.total); // Sort cheapest to most expensive
  }, [pendingItems]);

  // Calculate multi-store optimized basket (lowest price per item)
  const mixedOptimization = useMemo(() => {
    if (pendingItems.length === 0) return null;

    let mixedTotal = 0;
    let itemsCovered = 0;
    const breakdown: { itemName: string; bestStore: StoreName; bestPrice: number }[] = [];

    for (const item of pendingItems) {
      if (!item.prices) continue;

      let minPrice: number | null = null;
      let bestStore: StoreName | null = null;

      for (const storeName of STORES) {
        const p = item.prices[storeName];
        if (p !== undefined && p > 0) {
          if (minPrice === null || p < minPrice) {
            minPrice = p;
            bestStore = storeName;
          }
        }
      }

      if (minPrice !== null && bestStore !== null) {
        mixedTotal += minPrice;
        itemsCovered++;
        breakdown.push({ itemName: item.name, bestStore, bestPrice: minPrice });
      }
    }

    if (itemsCovered === 0) return null;

    const cheapestSingleStore = storeStats[0];
    const maxSingleStore = storeStats[storeStats.length - 1];
    const savingsVsCheapest = cheapestSingleStore ? cheapestSingleStore.total - mixedTotal : 0;
    const savingsVsMostExpensive = maxSingleStore ? maxSingleStore.total - mixedTotal : 0;

    return {
      mixedTotal,
      itemsCovered,
      breakdown,
      savingsVsCheapest: Math.max(0, savingsVsCheapest),
      savingsVsMostExpensive: Math.max(0, savingsVsMostExpensive),
    };
  }, [pendingItems, storeStats]);

  if (pendingItems.length === 0) return null;

  const totalPricedItems = pendingItems.filter(
    (i) => i.prices && Object.values(i.prices).some((p) => p && p > 0),
  ).length;

  if (storeStats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-sm">
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Saca más partido a tu compra: añade precios a tus productos al editarlos para comparar supermercados y calcular tu ahorro.</span>
        </div>
      </div>
    );
  }

  const winner = storeStats[0];

  return (
    <Card className="overflow-hidden border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-background to-blue-50/30 dark:from-emerald-950/20 dark:via-background dark:to-blue-950/20 shadow-md">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                Comparador & Optimización de Cesta
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Basado en los precios de {totalPricedItems} de {pendingItems.length} productos pendientes
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Mejor opción: {winner.storeName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 space-y-4">
        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Winner Single Store */}
          <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Supermercado más barato (1 sola tienda)</span>
              <span className="text-base">{STORE_BADGE_STYLE[winner.storeName].icon}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">{winner.storeName}</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {winner.total.toFixed(2)}€
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Suma de {winner.itemsWithPriceCount} productos con precio guardado
            </p>
          </div>

          {/* Mixed Store Optimization */}
          {mixedOptimization && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-sm space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Ahorro Máximo (Cesta Mixta)
                </span>
                <span>💡 Multi-tienda</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold">Varias tiendas</span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {mixedOptimization.mixedTotal.toFixed(2)}€
                </span>
              </div>
              {mixedOptimization.savingsVsCheapest > 0 ? (
                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
                  ¡Ahorras <span className="underline font-bold">{mixedOptimization.savingsVsCheapest.toFixed(2)}€</span> comprando cada producto en su mejor tienda!
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {winner.storeName} ya ofrece el mejor precio para todos tus productos.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Detailed Stores Comparison Breakdown */}
        <Collapsible open={openDetails} onOpenChange={setOpenDetails}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <span className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Ver comparativa de las {storeStats.length} tiendas registradas
              </span>
              {openDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {storeStats.map((stat, idx) => {
              const diffVsWinner = stat.total - winner.total;
              const badgeStyle = STORE_BADGE_STYLE[stat.storeName];

              return (
                <div
                  key={stat.storeName}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{badgeStyle.icon}</span>
                    <span className="font-medium text-foreground">{stat.storeName}</span>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Más económico
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="font-bold text-foreground">{stat.total.toFixed(2)}€</span>
                      {diffVsWinner > 0 && (
                        <span className="text-xs text-rose-500 font-medium block">
                          +{diffVsWinner.toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground w-16 text-right">
                      {stat.itemsWithPriceCount}/{pendingItems.length} prod.
                    </span>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
