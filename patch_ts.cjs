const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/\r\n/g, '\n');

const oldHandleSaveItem = `  function handleSaveItem(
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
    }`;

if (content.includes(oldHandleSaveItem)) {
  content = content.replace(oldHandleSaveItem, newHandleSaveItem);
}

fs.writeFileSync(p, content, 'utf8');
console.log('TS errors fixed');
