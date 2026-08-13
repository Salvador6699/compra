const fs = require('fs');
let content = fs.readFileSync('src/components/features/ItemRow.tsx', 'utf8');

content = content.replace('icon={sb.icon ?? "🏪"}', 'icon={(sb as any).icon ?? "🏪"}');

fs.writeFileSync('src/components/features/ItemRow.tsx', content);
console.log("Done TS Fix");
