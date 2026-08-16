const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { BarcodeScanner } from "@/components/features/BarcodeScanner";',
  'import { BarcodeScanner } from "@/components/features/BarcodeScanner";\nimport { toast } from "sonner";'
);

content = content.replace(
  'function Index() {',
  'function normalizeText(text: string) {\n  return text.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();\n}\n\nfunction Index() {'
);

const targetSearch = `  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = store.items;

    if (selectedStores.size > 0) {
      items = items.filter(
        (i) => i.preferredStore && selectedStores.has(i.preferredStore),
      );
    }

    if (q) {
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }`;

const replaceSearch = `  const filteredCatalog = useMemo(() => {
    const q = normalizeText(search.trim());
    let items = store.items;

    if (selectedStores.size > 0) {
      items = items.filter(
        (i) => i.preferredStore && selectedStores.has(i.preferredStore),
      );
    }

    if (q) {
      items = items.filter((i) => normalizeText(i.name).includes(q));
    }`;
content = content.replace(targetSearch, replaceSearch);

const targetCatAlert = `                            if (count > 0) {
                              alert(
                                \`No se puede eliminar la categoría "\${cat}" porque tiene \${count} producto(s) vinculado(s) en el catálogo.\`,
                              );
                            } else if (confirm(\`¿Eliminar la categoría "\${cat}"?\`)) {`;

const replaceCatAlert = `                            if (count > 0) {
                              toast.error(
                                \`No se puede eliminar la categoría "\${cat}" porque tiene \${count} producto(s) vinculado(s) en el catálogo.\`
                              );
                            } else if (confirm(\`¿Eliminar la categoría "\${cat}"?\`)) {`;
content = content.replace(targetCatAlert, replaceCatAlert);

const targetStoreAlert = `                            if (count > 0) {
                              alert(
                                \`No se puede eliminar la tienda "\${st}" porque tiene \${count} producto(s) vinculado(s) en el catálogo.\`,
                              );
                            } else if (confirm(\`¿Eliminar la tienda "\${st}"?\`)) {`;

const replaceStoreAlert = `                            if (count > 0) {
                              toast.error(
                                \`No se puede eliminar la tienda "\${st}" porque tiene \${count} producto(s) vinculado(s) en el catálogo.\`
                              );
                            } else if (confirm(\`¿Eliminar la tienda "\${st}"?\`)) {`;
content = content.replace(targetStoreAlert, replaceStoreAlert);

const targetSyncUI = `            {/* Sincronización con Servidor Central (PHP/MySQL) */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <HardDrive className="h-4 w-4 text-primary" />
                Sincronización de Precios
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conecta con tu servidor central (PHP/MySQL) para descargar los últimos precios del catálogo. 
                Si eres el administrador, sube aquí tus precios extraídos (scraping).
              </p>
              
              <div className="space-y-2 pt-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">URL del Servidor</Label>
                <div className="flex gap-2">
                  <Input 
                    type="url" 
                    placeholder="https://tuhosting.com/backend/api.php" 
                    value={store.syncUrl || ""} 
                    onChange={(e) => setSyncUrl(e.target.value)}
                    className="flex-1 rounded-xl text-xs bg-muted/30"
                  />
                  <Button 
                    type="button"
                    onClick={() => syncCatalogPrices(false)}
                    disabled={isSyncing || !store.syncUrl}
                    className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {isSyncing ? (
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isSyncing ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                </div>
                {syncError && (
                  <p className="text-[11px] text-destructive font-medium mt-1">Error: {syncError}</p>
                )}
                {store.lastSyncDate && !syncError && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    Última sincronización: {new Date(store.lastSyncDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>`;
content = content.replace(targetSyncUI, "");

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
