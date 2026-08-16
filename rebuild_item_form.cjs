const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/components/features/ItemFormDialog.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add BarcodeScanner import
if (!content.includes('BarcodeScanner')) {
  content = content.replace(
    'import { BasketCalculator } from "@/components/basket-calculator";',
    'import { BasketCalculator } from "@/components/basket-calculator";\nimport { BarcodeScanner } from "./BarcodeScanner";'
  );
}

// 2. Update onSave signature
content = content.replace(
  `    prices: Partial<Record<StoreName, number>>,\n    note: string,\n    image?: string | null,\n  ) => void;`,
  `    note: string,\n    formats?: any[],\n  ) => void;`
);

// 3. Add format states
content = content.replace(
  `  const [image, setImage] = useState<string | null>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);`,
  `  const [image, setImage] = useState<string | null>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);\n\n  const [scannerOpen, setScannerOpen] = useState(false);\n  const [formatName, setFormatName] = useState("Genérico");\n  const [formatSize, setFormatSize] = useState<string>("1");\n  const [formatUnit, setFormatUnit] = useState<"u" | "g" | "kg" | "ml" | "L">("u");`
);

// 4. Update useEffect to use formats
const oldUseEffect = `      if (item) {
        setName(item.name);
        setCategory(item.category);
        setPreferredStore(item.preferredStore ?? "NONE");
        setNote(item.note ?? "");
        setImage(item.image ?? null);

        const strPrices: Record<string, string> = {};
        if (item.prices) {
          for (const [k, v] of Object.entries(item.prices)) {
            if (v !== undefined) strPrices[k] = String(v);
          }
        }
        setPrices(strPrices);
      } else {
        setName("");
        setCategory(allCategories[0] || "Despensa");
        setPreferredStore("NONE");
        setPrices({});
        setNote("");
        setImage(null);
      }`;

const newUseEffect = `      if (item) {
        setName(item.name);
        setCategory(item.category);
        setPreferredStore(item.preferredStore ?? "NONE");
        setNote(item.note ?? "");
        const firstFormat = item.formats && item.formats[0];
        setImage(firstFormat?.image ?? null);
        setFormatName(firstFormat?.name ?? "Genérico");
        setFormatSize(firstFormat?.size ? String(firstFormat.size) : "1");
        setFormatUnit(firstFormat?.unit ?? "u");

        const strPrices: Record<string, string> = {};
        if (firstFormat?.prices) {
          for (const [k, v] of Object.entries(firstFormat.prices)) {
            if (v !== undefined) strPrices[k] = String(v);
          }
        }
        setPrices(strPrices);
      } else {
        setName("");
        setCategory(allCategories[0] || "Despensa");
        setPreferredStore("NONE");
        setPrices({});
        setNote("");
        setImage(null);
        setFormatName("Genérico");
        setFormatSize("1");
        setFormatUnit("u");
      }`;
content = content.replace(oldUseEffect, newUseEffect);

// 5. Update handleSave
const oldHandleSave = `    onSave(
      name,
      category as Category,
      preferredStore === "NONE" ? null : (preferredStore as StoreName),
      parsedPrices,
      note.trim(),
      image,
    );`;

const newHandleSave = `    const parsedSize = parseFloat(formatSize.replace(",", "."));
    const format = {
      id: item?.formats?.[0]?.id || Math.random().toString(36).slice(2, 10),
      name: formatName,
      size: isNaN(parsedSize) || parsedSize <= 0 ? 1 : parsedSize,
      unit: formatUnit,
      prices: parsedPrices,
      image: image ?? undefined,
    };

    onSave(
      name,
      category as Category,
      preferredStore === "NONE" ? null : (preferredStore as StoreName),
      note.trim(),
      [format],
    );`;
content = content.replace(oldHandleSave, newHandleSave);

// 6. Wrap return in <> </> and add scanner outside
content = content.replace(
  '  return (\n    <Dialog open={open} onOpenChange={onClose}>',
  '  return (\n    <>\n    <Dialog open={open} onOpenChange={onClose}>'
);

const scannerCode = `      </DialogContent>
    </Dialog>

      <BarcodeScanner 
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={(product) => {
          const qty = product.quantity || "";
          let parsedSize = "1";
          let parsedUnit = "u";
          
          if (qty) {
            const match = qty.match(/([\\d\\.,]+)\\s*([a-zA-Z]+)/);
            if (match) {
              parsedSize = match[1].replace(',', '.');
              const unitRaw = match[2].toLowerCase();
              if (["g", "kg", "ml", "u"].includes(unitRaw)) {
                parsedUnit = unitRaw;
              } else if (unitRaw === "l") {
                parsedUnit = "L";
              }
            }
          }

          setName(product.product_name_es || product.product_name || "");
          setImage(product.image_url || null);
          setFormatSize(parsedSize);
          setFormatUnit(parsedUnit);
          setFormatName(qty ? qty : "Genérico");
          
          const apiCats = (product.categories || "").toLowerCase();
          if (apiCats.includes("bebida")) setCategory("Bebidas");
          else if (apiCats.includes("lácteo") || apiCats.includes("queso")) setCategory("Lácteos y huevos");
          else if (apiCats.includes("carne")) setCategory("Carne y embutidos");
          else if (apiCats.includes("snack") || apiCats.includes("dulce")) setCategory("Snacks y dulces");
          else if (apiCats.includes("pan")) setCategory("Panadería");
        }}
      />
    </>
  );
}`;

content = content.replace(
  '      </DialogContent>\n    </Dialog>\n  );\n}',
  scannerCode
);

// 7. Add Escanear button to UI
const scanButton = `          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                {item ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" /> Editar Producto
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" /> Añadir Producto
                  </>
                )}
              </DialogTitle>
              {!item && (
                <Button 
                  onClick={() => setScannerOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-primary/50 text-primary hover:bg-primary/10 font-bold"
                >
                  <Camera className="h-4 w-4 mr-1.5" /> Escanear
                </Button>
              )}
            </div>
          </DialogHeader>`;

content = content.replace(
  `          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              {item ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" /> Editar Producto
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" /> Añadir Producto
                </>
              )}
            </DialogTitle>
          </DialogHeader>`,
  scanButton
);

// 8. Add form fields for format (name, size, unit) before the image upload section
const formatFields = `          {/* Format Settings */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                Formato
              </Label>
              <Input
                value={formatName}
                onChange={(e) => setFormatName(e.target.value)}
                placeholder="Ej: Botella, Pack 6..."
                className="rounded-xl h-9"
              />
            </div>
            <div className="space-y-1.5 w-16">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                Cant.
              </Label>
              <Input
                value={formatSize}
                onChange={(e) => setFormatSize(e.target.value)}
                placeholder="1"
                className="rounded-xl h-9 text-center"
              />
            </div>
            <div className="space-y-1.5 w-[70px]">
              <Select value={formatUnit} onValueChange={(v: any) => setFormatUnit(v)}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="u">ud</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>\n\n          {/* Image Attachment */}`;

content = content.replace(
  '          {/* Image Attachment */}',
  formatFields
);

fs.writeFileSync(p, content, 'utf8');
console.log('ItemFormDialog rebuilt successfully');
