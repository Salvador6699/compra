const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/features/FinishTripDialog.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `      totals[store] = (totals[store] ?? 0) + itemPrice;
      grand += itemPrice;

      items.push({
        name: it.name,
        category: it.category,
        preferredStore: it.preferredStore,
        price: itemPrice > 0 ? itemPrice : undefined,
      });
    }`;

const replace = `      const qty = it.quantity || 1;
      totals[store] = (totals[store] ?? 0) + (itemPrice * qty);
      grand += (itemPrice * qty);

      items.push({
        name: it.name,
        category: it.category,
        preferredStore: it.preferredStore,
        price: itemPrice > 0 ? itemPrice : undefined,
        quantity: qty,
      });
    }`;

content = content.replace(target, replace);
fs.writeFileSync(file, content, 'utf8');
console.log("Done");
