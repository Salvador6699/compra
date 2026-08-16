const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(p, 'utf8');

// Normalize line endings for replacement
content = content.replace(/\r\n/g, '\n');

// 1. Extract setCurrentLocation
content = content.replace(
  '    syncError,\n  } = useShoppingStore();',
  '    syncError,\n    setCurrentLocation,\n  } = useShoppingStore();'
);

// 2. Remove scanner Open state
content = content.replace(
  '  // Barcode Scanner Modal\n  const [scannerOpen, setScannerOpen] = useState(false);\n\n',
  ''
);

// 3. Add Location Selector in header
const locSelector = `        {/* Global Location Bar */}
        <div className="bg-primary/5 border-b border-border/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
            <MapPin className="h-3 w-3" />
            <span>UBICACIÓN ACTUAL</span>
          </div>
          <Select
            value={store.currentLocation || "Casa"}
            onValueChange={setCurrentLocation}
          >
            <SelectTrigger className="w-auto h-8 text-xs font-bold bg-background border-border/60 shadow-sm gap-2 border-0">
              <SelectValue placeholder="Selecciona ubicación" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Casa">
                <div className="flex items-center gap-2">
                  <span>🏠</span>
                  <span>Casa</span>
                </div>
              </SelectItem>
              {allStores.map(st => (
                <SelectItem key={st} value={st}>
                  <div className="flex items-center gap-2">
                    <DynamicIcon icon={getStoreIcon(st)} fallback="🏪" className="h-4 w-4 object-contain rounded-sm" />
                    <span>{st}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>\n`;

content = content.replace(
  '      <header className="sticky top-0 z-30 glass border-b border-border/40 shadow-sm pt-safe">\n        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">',
  '      <header className="sticky top-0 z-30 glass border-b border-border/40 shadow-sm pt-safe">\n' + locSelector + '        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">'
);

// 4. Import MapPin if not present
if (!content.includes('MapPin,')) {
  content = content.replace(
    '  Moon,\n',
    '  Moon,\n  MapPin,\n'
  );
}

// 5. Remove BarcodeScanner component render
const barcodeBlock = `      <BarcodeScanner \n        open={scannerOpen} \n        onOpenChange={setScannerOpen} \n      />\n\n`;
content = content.replace(barcodeBlock, '');

// 6. Remove BarcodeScanner import
content = content.replace(
  'import { BarcodeScanner } from "@/components/features/BarcodeScanner";\n',
  ''
);

fs.writeFileSync(p, content, 'utf8');
console.log('index.tsx patched successfully');
