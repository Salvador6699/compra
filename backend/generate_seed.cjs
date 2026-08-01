const fs = require('fs');

const tsContent = fs.readFileSync('../src/lib/base-catalog-prices.ts', 'utf-8');
const arrayStr = tsContent.substring(tsContent.indexOf('['), tsContent.lastIndexOf(']') + 1);
const items = eval(arrayStr);

let sql = '';
const categories = new Set();
const stores = new Set(['Mercadona', 'Consum', 'Eroski', 'Dia', 'Carrefour', 'Alcampo']);

items.forEach(i => {
    if (i.category) categories.add(i.category);
    if (i.preferredStore) stores.add(i.preferredStore);
});

stores.forEach(s => {
    sql += `INSERT IGNORE INTO stores (name) VALUES ('${s.replace(/'/g, "''")}');\n`;
});
categories.forEach(c => {
    sql += `INSERT IGNORE INTO categories (name) VALUES ('${c.replace(/'/g, "''")}');\n`;
});
items.forEach(i => {
    const cat = i.category ? i.category.replace(/'/g, "''") : '';
    const prefStore = i.preferredStore ? i.preferredStore.replace(/'/g, "''") : '';
    const name = i.name.replace(/'/g, "''");
    sql += `INSERT IGNORE INTO products (name, category_name, preferred_store) VALUES ('${name}', '${cat}', '${prefStore}');\n`;
});

fs.writeFileSync('seed.sql', sql);
console.log('seed.sql generated');
