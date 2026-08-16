const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/\r\n/g, '\n');

// Update handleSaveItem signature and body
const oldHandleSaveItem = `  function handleSaveItem(
    name: string,
    category: Category,
    preferredStore: StoreName | null,
    prices: Partial<Record<StoreName, number>>,
    note: string,
    image?: string | null,
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore,
        prices,
        note,
        image,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore ?? undefined,
        prices,
        note,
        image ?? undefined,
      );
    }

    setItemDialogOpen(false);
    setEditingItem(null);
  }`;

const newHandleSaveItem = `  function handleSaveItem(
    name: string,
    category: Category,
    preferredStore: StoreName | null,
    note: string,
    formats?: any[],
    image?: string | null,
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore,
        note,
        formats,
        image,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore ?? undefined,
        formats,
        note,
        image ?? undefined,
      );
    }

    // Business Logic: Smart Price Comparison
    if (formats && store.currentLocation) {
      for (const format of formats) {
        if (format.prices && format.prices[store.currentLocation] !== undefined) {
          const currentPrice = format.prices[store.currentLocation];
          let cheaperStore = null;
          let cheaperPrice = currentPrice;
          
          for (const [st, p] of Object.entries(format.prices)) {
             if (st !== store.currentLocation && p !== undefined && typeof p === "number" && p < cheaperPrice) {
                 cheaperPrice = p;
                 cheaperStore = st;
             }
          }
          
          if (cheaperStore) {
             toast(\`💡 Recuerda: Este formato está más barato en \${cheaperStore} (\${cheaperPrice.toFixed(2)}€) que en \${store.currentLocation} (\${currentPrice.toFixed(2)}€)\`, {
               duration: 6000,
               style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' },
             });
          }
        }
      }
    }

    setItemDialogOpen(false);
    setEditingItem(null);
  }`;

if (content.includes(oldHandleSaveItem)) {
  content = content.replace(oldHandleSaveItem, newHandleSaveItem);
} else {
  console.log('Failed to find oldHandleSaveItem string in index.tsx');
}

// Ensure sonner import and Toaster
if (!content.includes('import { toast, Toaster } from "sonner";')) {
  content = content.replace(
    'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";',
    'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";\nimport { toast, Toaster } from "sonner";'
  );
}

if (!content.includes('<Toaster position=')) {
  content = content.replace(
    '      <IconPickerDialog',
    '      <Toaster position="top-center" />\n      <IconPickerDialog'
  );
}

// We need to update ItemFormDialog call in index.tsx
const oldCall = `        <ItemFormDialog
          open={itemDialogOpen}
          item={editingItem}
          allCategories={allCategories}
          allStores={allStores}
          getCategoryIcon={getCategoryIcon}
          getStoreIcon={getStoreIcon}
          onAddCategory={addCustomCategory}
          onAddStore={addCustomStore}
          onClose={() => {
            setItemDialogOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />`;

// handleSaveItem signature mismatch with ItemFormDialog
// ItemFormDialog sends: onSave(name, category, preferredStore, note, formats)
// Our new handleSaveItem expects: handleSaveItem(name, category, preferredStore, note, formats, image)
// But ItemFormDialog might send image inside formats or not send it at all to onSave.
// Let's check ItemFormDialog.tsx onSave call to see what it sends.

fs.writeFileSync(p, content, 'utf8');
console.log('patch_save applied');
