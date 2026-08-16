import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { STORES, type StoreName } from "@/lib/shopping-data";
import type { Item } from "@/lib/use-shopping-store";
import { ChevronDown, ChevronUp, Lightbulb, Sparkles, Store, TrendingDown } from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";

interface BasketCalculatorProps {
  items: Item[];
  allStores: string[];
  getStoreIcon: (st: string) => string;
}

export function BasketCalculator({ items, allStores, getStoreIcon }: BasketCalculatorProps) {
  const [openDetails, setOpenDetails] = useState(false);

  // Filter only items in list that are pending (not bought)
  const pendingItems = useMemo(() => items.filter((i) => !i.bought), [items]);

  // Calculate totals per store
  const storeStats = useMemo(() => {
    if (pendingItems.length === 0) return [];

    return allStores.map((storeName) => {
      let total = 0;
      let itemsWithPriceCount = 0;
      const itemDetails: { name: string; price: number }[] = [];

      for (const item of pendingItems) {
        const activeFormat = item.formats.find(f => f.id === item.selectedFormatId) || item.formats[0];
        const price = activeFormat?.prices?.[storeName as StoreName];
        if (price !== undefined && price > 0) {
          const qty = item.quantity || 1;
          total += price * qty;
          itemsWithPriceCount++;
          itemDetails.push({ name: item.name, price: price * qty });
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
      const activeFormat = item.formats.find(f => f.id === item.selectedFormatId) || item.formats[0];
      if (!activeFormat || !activeFormat.prices) continue;

      let minPrice: number | null = null;
      let bestStore: StoreName | null = null;

      for (const storeName of allStores) {
        const p = activeFormat.prices[storeName as StoreName];
        if (p !== undefined && p > 0) {
          if (minPrice === null || p < minPrice) {
            minPrice = p;
            bestStore = storeName as StoreName;
          }
        }
      }

      if (minPrice !== null && bestStore !== null) {
        const qty = item.quantity || 1;
        mixedTotal += minPrice * qty;
        itemsCovered++;
        breakdown.push({ itemName: item.name, bestStore, bestPrice: minPrice * qty });
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
    (i) => {
      const activeFormat = i.formats.find(f => f.id === i.selectedFormatId) || i.formats[0];
      return activeFormat && Object.values(activeFormat.prices).some((p) => p !== undefined && p > 0);
    }
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
    <Card className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-lg backdrop-blur-md">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-sm">
              <TrendingDown className="h-6 w-6" />
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

          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Mejor opción: {winner.storeName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 sm:px-6 space-y-4">
        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Winner Single Store */}
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span>Tienda más barata</span>
              <DynamicIcon icon={getStoreIcon(winner.storeName)} fallback="🏪" className="h-5 w-5" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">{winner.storeName}</span>
              <span className="text-2xl font-extrabold text-primary">
                {winner.total.toFixed(2)}€
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {winner.itemsWithPriceCount} productos con precio
            </p>
          </div>

          {/* Mixed Store Optimization */}
          {mixedOptimization && (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-primary font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Ahorro Máximo
                </span>
                <span className="bg-primary/20 px-2 py-0.5 rounded-md">Multi-tienda</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-foreground">Varias tiendas</span>
                <span className="text-2xl font-extrabold text-primary">
                  {mixedOptimization.mixedTotal.toFixed(2)}€
                </span>
              </div>
              {mixedOptimization.savingsVsCheapest > 0 ? (
                <p className="text-[11px] font-medium text-foreground">
                  Ahorras <span className="underline font-bold text-primary">{mixedOptimization.savingsVsCheapest.toFixed(2)}€</span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {winner.storeName} es la mejor.
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
              const icon = getStoreIcon(stat.storeName);

              return (
                <div
                  key={stat.storeName}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <DynamicIcon icon={icon} fallback="🏪" className="h-4 w-4" />
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
