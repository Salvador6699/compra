const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'components', 'features');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    content = content.replace(/import \{ BasketCalculator \} from "@\/components\/basket-calculator";[\s\S]*?export function/, 'import { BasketCalculator } from "@/components/basket-calculator";\n\nexport function');
    fs.writeFileSync(path.join(dir, file), content);
    console.log(`Fixed ${file}`);
  }
}
