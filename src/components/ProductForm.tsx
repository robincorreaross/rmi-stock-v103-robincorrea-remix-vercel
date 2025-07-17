import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, ProductFormData } from '@/types/product';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    code: product?.code || '',
    description: product?.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        description: product.description
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);

    if (success) {
      if (!isEditing) {
        setFormData({ code: '', description: '' });
      }
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'description' ? value.toUpperCase() : value.toUpperCase()
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Produto' : 'Cadastrar Produto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              type="text"
              placeholder="Digite o código do produto"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição * 
              <span className="text-muted-foreground text-sm ml-1">
                ({formData.description.length}/200)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Digite a descrição do produto"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.code.trim() || !formData.description.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}