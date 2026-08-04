import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react";

const SYSTEM_ICONS = [
  "Apple", "Baby", "Banana", "Bed", "Beef", "Beer", "Bone", "Box", "Briefcase", 
  "Building", "Cake", "Candy", "Carrot", "Cat", "Cherry", "Citrus", "Coffee", 
  "Cookie", "Croissant", "CupSoda", "Dog", "Droplet", "Drumstick", "Egg", "Fish", 
  "Grape", "Hammer", "Heart", "IceCream", "Lollipop", "Martini", "Milk", "Nut", 
  "Package", "Pill", "Pizza", "Popcorn", "Salad", "Sandwich", "Scissors", 
  "ShoppingBag", "ShoppingCart", "Sofa", "Soup", "Sparkles", "SprayCan", "Store", 
  "Tag", "Trash", "Tv", "Wand", "Wine", "Wrench"
];

const POPULAR_STORES = [
  { name: "Mercadona", domain: "mercadona.es" },
  { name: "Carrefour", domain: "carrefour.es" },
  { name: "Lidl", domain: "lidl.es" },
  { name: "Aldi", domain: "aldi.es" },
  { name: "Consum", domain: "consum.es" },
  { name: "Alcampo", domain: "alcampo.es" },
  { name: "Dia", domain: "dia.es" },
  { name: "Family Cash", domain: "familycash.es" },
  { name: "AhorraMas", domain: "ahorramas.com" },
  { name: "Eroski", domain: "eroski.es" },
  { name: "Hipercor", domain: "hipercor.es" }
];

export function IconPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
}) {
  const [tab, setTab] = useState<"system" | "stores">("system");
  const [search, setSearch] = useState("");

  const filteredIcons = SYSTEM_ICONS.filter(i => i.toLowerCase().includes(search.toLowerCase()));
  const filteredStores = POPULAR_STORES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] flex flex-col p-4">
        <DialogHeader className="mb-2 shrink-0">
          <DialogTitle className="text-base font-bold text-center">
            Elegir Icono
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-3 shrink-0">
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="stores">Tiendas</TabsTrigger>
          </TabsList>

          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 rounded-xl h-9 text-xs"
            />
          </div>

          <TabsContent value="system" className="flex-1 overflow-y-auto mt-0 min-h-[300px]">
            <div className="grid grid-cols-5 gap-2 pr-1 pb-4">
              {filteredIcons.map((iconName) => {
                // @ts-ignore
                const IconComp = LucideIcons[iconName];
                return (
                  <Button
                    key={iconName}
                    variant="outline"
                    title={iconName}
                    onClick={() => {
                      onSelect(`lucide:${iconName}`);
                      onClose();
                    }}
                    className="h-12 w-12 rounded-xl p-0 flex items-center justify-center border-border/50 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    {IconComp && <IconComp className="h-6 w-6 text-foreground" />}
                  </Button>
                );
              })}
              {filteredIcons.length === 0 && (
                <p className="col-span-5 text-center text-xs text-muted-foreground py-8">
                  No se encontraron iconos.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stores" className="flex-1 overflow-y-auto mt-0 min-h-[300px]">
            <div className="grid grid-cols-4 gap-3 pr-1 pb-4">
              {filteredStores.map((store) => {
                const url = `https://www.google.com/s2/favicons?domain=${store.domain}&sz=128`;
                return (
                  <button
                    key={store.name}
                    type="button"
                    title={store.name}
                    onClick={() => {
                      onSelect(url);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-colors bg-card"
                  >
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                      <img src={url} alt={store.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="text-[9px] font-semibold text-center truncate w-full text-foreground">
                      {store.name}
                    </span>
                  </button>
                );
              })}
              {filteredStores.length === 0 && (
                <p className="col-span-4 text-center text-xs text-muted-foreground py-8">
                  No se encontraron tiendas.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
