const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Import toast and Toaster from sonner
if (!content.includes('import { toast, Toaster } from "sonner";')) {
  content = content.replace(
    'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";\n',
    'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";\nimport { toast, Toaster } from "sonner";\n'
  );
}

// 2. Add Toaster component to the bottom of the return statement
if (!content.includes('<Toaster position=')) {
  content = content.replace(
    '      <IconPickerDialog',
    '      <Toaster position="top-center" />\n      <IconPickerDialog'
  );
}

// 3. Update handleSaveItem with business logic
const oldHandleSaveItem = `  function handleSaveItem(
    name: string,
    category: Category,
    preferredStore: StoreName | null,
    note: string,
    formats?: any[],
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore,
        note,
        formats,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore ?? undefined,
        formats,
        note,
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
  ) {
    if (editingItem) {
      updateItem(editingItem.id, {
        name,
        category,
        preferredStore,
        note,
        formats,
      });
    } else {
      addItem(
        name,
        category,
        preferredStore ?? undefined,
        formats,
        note,
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
  console.error("Could not find old handleSaveItem block. Try to find an alternative.");
}

fs.writeFileSync(p, content, 'utf8');
console.log('Business logic injected successfully');
