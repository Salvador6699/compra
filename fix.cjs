const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Imports
content = content.replace(
  'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";',
  'import { ReceiptViewerDialog } from "@/components/features/ReceiptViewerDialog";\nimport { BarcodeScanner } from "@/components/features/BarcodeScanner";'
);

// 2. State
content = content.replace(
  'const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);',
  'const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);\n\n  // Barcode Scanner Modal\n  const [scannerOpen, setScannerOpen] = useState(false);'
);

// 3. UI
content = content.replace(
  '<div className="relative flex-1 w-full">\n                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />\n                  <Input\n                    value={search}\n                    onChange={(e) => setSearch(e.target.value)}\n                    placeholder="Buscar producto por nombre..."\n                    className="pl-9 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30"\n                  />\n                </div>\n                <Button\n                  onClick={handleOpenAddModal}',
  '<div className="relative flex-1 w-full flex gap-2">\n                  <div className="relative flex-1">\n                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />\n                    <Input\n                      value={search}\n                      onChange={(e) => setSearch(e.target.value)}\n                      placeholder="Buscar producto por nombre..."\n                      className="pl-9 rounded-xl border-border/60 bg-background/60 focus-visible:ring-primary/30"\n                    />\n                  </div>\n                  <Button\n                    variant="outline"\n                    onClick={() => setScannerOpen(true)}\n                    className="shrink-0 rounded-xl px-3 border-border/60 text-primary hover:text-primary/80 transition-colors shadow-xs"\n                    title="Escanear Código de Barras"\n                  >\n                    <Camera className="h-4 w-4" />\n                  </Button>\n                </div>\n                <Button\n                  onClick={handleOpenAddModal}'
);

// 4. Modal placement
content = content.replace(
  '      <IconPickerDialog\n        open={iconPickerOpen}',
  '      <BarcodeScanner \n        open={scannerOpen} \n        onOpenChange={setScannerOpen} \n      />\n\n      <IconPickerDialog\n        open={iconPickerOpen}'
);

fs.writeFileSync('src/routes/index.tsx', content);
console.log("Done");
