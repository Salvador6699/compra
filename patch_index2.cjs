const fs = require('fs');
let code = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. MapPin Import
code = code.replace(
  'Image as ImageIcon,\n  Pencil,',
  'Image as ImageIcon,\n  MapPin,\n  Pencil,'
);

// 2. setCurrentLocation
code = code.replace(
  'syncCatalogPrices,\n    isSyncing,',
  'syncCatalogPrices,\n    setCurrentLocation,\n    isSyncing,'
);

// 3. handleSaveItem signature
code = code.replace(
  /function handleSaveItem\(\s*name: string,\s*category: Category,\s*preferredStore: StoreName \| null,\s*prices: Partial<Record<StoreName, number>>,\s*note: string,\s*image\?: string \| null,\s*\) {/s,
  `function handleSaveItem(
    name: string,
    category: Category,
    preferredStore: StoreName | null,
    note: string,
    formats?: any[],
  ) {`
);

// 4. handleSaveItem editingItem
code = code.replace(
  /preferredStore,\s*prices,\s*note,\s*image,\s*}\);/s,
  `preferredStore,
        note,
        formats,
      });`
);

// 5. handleSaveItem else
code = code.replace(
  /category,\s*preferredStore \?\? undefined,\s*prices,\s*note,\s*image \?\? undefined,\s*\);/s,
  `category,
        preferredStore ?? undefined,
        formats,
        note,
      );`
);

// 6. Header Bar
code = code.replace(
  /\{\/\* Header \*\/\}\s*<header className="sticky top-0 z-30 glass border-b border-border\/40 shadow-sm pt-safe">\s*<div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">/s,
  `{/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/40 shadow-sm pt-safe">
        {/* Global Location Bar */}
        <div className="bg-primary/5 border-b border-border/30 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
            <MapPin className="h-3 w-3" />
            <span>UBICACIÓN ACTUAL</span>
          </div>
          <select
            value={store.currentLocation || "Casa"}
            onChange={(e) => setCurrentLocation(e.target.value)}
            className="text-xs font-bold bg-transparent border-none outline-none text-foreground cursor-pointer focus:ring-0 text-right appearance-none flex-1 max-w-[150px]"
          >
            <option value="Casa">🏠 Casa</option>
            {allStores.map(st => (
              <option key={st} value={st}>{getStoreIcon(st)} {st}</option>
            ))}
          </select>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">`
);

// 7. Image fix listItems
code = code.replace(
  /\{it\.image && \(\s*<img\s*src=\{it\.image\}/s,
  `{it.formats[0]?.image && (
                              <img
                                src={it.formats[0].image}`
);

// 8. Prices filter groupedByStore
code = code.replace(
  /\(i\.prices &&\s*i\.prices\[st as StoreName\] !== undefined &&\s*i\.prices\[st as StoreName\]! > 0\)/s,
  `(i.formats.some(f => f.prices[st as StoreName] !== undefined && f.prices[st as StoreName]! > 0))`
);

// 9. ItemFormDialog onSave prop
code = code.replace(
  /onSave=\{\(\s*name: string,\s*category: Category,\s*preferredStore: StoreName \| null,\s*prices: Partial<Record<StoreName, number>>,\s*note: string,\s*image\?: string \| null,\s*\) => \{/s,
  `onSave={(
                            name: string,
                            category: Category,
                            preferredStore: StoreName | null,
                            note: string,
                            formats?: any[],
                          ) => {`
);

// 10. ItemFormDialog handleSaveItem call
code = code.replace(
  /preferredStore,\s*prices,\s*note,\s*image,\s*\);/s,
  `preferredStore,
                              note,
                              formats,
                            );`
);

fs.writeFileSync('src/routes/index.tsx', code);
console.log("Patch applied!");
