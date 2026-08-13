import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function BarcodeScanner({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (open && !scannedCode) {
      // Necesita un pequeño delay para que el Dialog renderice el div #reader
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 150 } },
            false
          );
          scannerRef.current = scanner;

          scanner.render(
            (decodedText) => {
              // Éxito al leer código
              scanner.clear();
              setScannedCode(decodedText);
              fetchProductData(decodedText);
            },
            (error) => {
              // Silenciar errores continuos de lectura fallida (normales al enfocar)
            }
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
  }, [open, scannedCode]);

  // Cuando se cierra el modal, limpiamos todo
  useEffect(() => {
    if (!open) {
      setScannedCode(null);
      setProductData(null);
      setError(null);
    }
  }, [open]);

  const fetchProductData = async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      // Open Food Facts API (JSON)
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1 && data.product) {
        setProductData(data.product);
      } else {
        setError("Producto no encontrado en la base de datos libre (Open Food Facts).");
      }
    } catch (e) {
      setError("Error de conexión al consultar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl border-border/40 p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> 
            Prototipo de Escáner
          </DialogTitle>
          <DialogDescription>
            Escanea un código de barras de cualquier producto.
          </DialogDescription>
        </DialogHeader>

        {!scannedCode && (
          <div className="relative overflow-hidden rounded-xl bg-black min-h-[300px]">
            <div id="reader" className="w-full border-none"></div>
          </div>
        )}

        {scannedCode && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 pt-2">
            <div className="bg-muted p-3 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Código Leído:</p>
              <p className="font-mono text-lg font-medium">{scannedCode}</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-6 gap-3 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Buscando en Open Food Facts...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 text-sm font-medium">
                {error}
              </div>
            ) : productData ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  {productData.image_url ? (
                    <img 
                      src={productData.image_url} 
                      alt="Product" 
                      className="w-24 h-24 object-contain rounded-lg border border-border bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-xs text-center p-2 text-muted-foreground border border-border">
                      Sin imagen
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">{productData.product_name_es || productData.product_name || "Nombre desconocido"}</h3>
                    <p className="text-sm text-muted-foreground truncate">{productData.brands || "Marca desconocida"}</p>
                    <p className="text-xs mt-1 text-muted-foreground truncate">{productData.quantity || ""}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-xl space-y-2 text-sm border border-border/50 max-h-48 overflow-y-auto">
                  <p><strong>Categorías API:</strong> {productData.categories}</p>
                  <p><strong>Nutri-Score:</strong> {productData.nutriscore_grade ? productData.nutriscore_grade.toUpperCase() : "Desconocido"}</p>
                  <p><strong>Ingredientes:</strong> {productData.ingredients_text_es || productData.ingredients_text || "No declarados"}</p>
                </div>
              </div>
            ) : null}

            <Button 
              className="w-full rounded-xl h-11 font-semibold"
              onClick={() => {
                setScannedCode(null);
                setProductData(null);
                setError(null);
              }}
            >
              Escanear otro producto
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
