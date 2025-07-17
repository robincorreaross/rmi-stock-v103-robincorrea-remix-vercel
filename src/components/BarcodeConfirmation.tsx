
import { Check, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BarcodeConfirmationProps {
  barcode: string;
  productDescription?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BarcodeConfirmation({ barcode, productDescription, onConfirm, onCancel }: BarcodeConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-2 border-primary/20 shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Código Escaneado
            </h3>
            <p className="text-muted-foreground text-sm mb-2">
              Confirme se o código está correto:
            </p>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="font-mono text-lg font-medium text-foreground">
                {barcode}
              </p>
              {productDescription && (
                <p className="text-sm text-muted-foreground">
                  {productDescription}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={onConfirm}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
