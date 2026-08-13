const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'src', 'routes', 'index.tsx');
let content = fs.readFileSync(indexFile, 'utf-8');
const lines = content.split('\n');

// Extraer imports del inicio
let imports = [];
for (let i = 0; i < 110; i++) {
  if (lines[i] && !lines[i].startsWith('export const Route')) {
    imports.push(lines[i]);
  }
}
const importHeader = imports.join('\n') + '\n\n';

const componentsToExtract = [
  { name: 'EditCategoryOrStoreDialog', startStr: 'function EditCategoryOrStoreDialog', endStr: '/* ──' },
  { name: 'StoreFilterDialog', startStr: 'function StoreFilterDialog', endStr: '/* ──' },
  { name: 'ItemFormDialog', startStr: 'function ItemFormDialog', endStr: '/* ──' },
  { name: 'ItemRow', startStr: 'function ItemRow', endStr: '/* ──' },
  { name: 'CategoryTitle', startStr: 'function CategoryTitle', endStr: '/* ──' },
  { name: 'EmptyState', startStr: 'function EmptyState', endStr: '/* ──' },
  { name: 'BackupDialog', startStr: 'function BackupDialog', endStr: '/* ──' },
  { name: 'FinishTripDialog', startStr: 'function FinishTripDialog', endStr: '/* ──' },
  { name: 'ReceiptViewerDialog', startStr: 'function ReceiptViewerDialog', endStr: '' } // Last one has no comment after
];

if (!fs.existsSync(path.join(__dirname, 'src', 'components', 'features'))) {
  fs.mkdirSync(path.join(__dirname, 'src', 'components', 'features'), { recursive: true });
}

let newIndexLines = [];
let insideExtracted = false;
let currentComponent = null;

let extractedCode = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!insideExtracted) {
    const comp = componentsToExtract.find(c => line.startsWith(c.startStr));
    if (comp) {
      insideExtracted = true;
      currentComponent = comp;
      extractedCode[comp.name] = [line];
    } else {
      newIndexLines.push(line);
    }
  } else {
    // Check if we hit the end
    // Si estamos en el último (ReceiptViewerDialog), termina al final del archivo
    if (currentComponent.endStr !== '' && line.startsWith(currentComponent.endStr)) {
      insideExtracted = false;
      newIndexLines.push(line);
      currentComponent = null;
    } else {
      extractedCode[currentComponent.name].push(line);
    }
  }
}

// Write the new component files
for (const comp of componentsToExtract) {
  if (extractedCode[comp.name]) {
    const code = extractedCode[comp.name].join('\n');
    let finalCode = importHeader + `export ${code}\n`;
    fs.writeFileSync(path.join(__dirname, 'src', 'components', 'features', `${comp.name}.tsx`), finalCode);
    console.log(`Extracted ${comp.name}.tsx`);
  }
}

// Write the modified index.tsx
// Add imports for the new components
const newImports = componentsToExtract.map(c => `import { ${c.name} } from "@/components/features/${c.name}";`).join('\n');

// Find the spot to inject new imports (after the last import in newIndexLines)
let lastImportIdx = 0;
for (let i = 0; i < newIndexLines.length; i++) {
  if (newIndexLines[i].startsWith('import ')) {
    lastImportIdx = i;
  }
}

newIndexLines.splice(lastImportIdx + 1, 0, newImports);

fs.writeFileSync(indexFile, newIndexLines.join('\n'));
console.log('Updated index.tsx');
