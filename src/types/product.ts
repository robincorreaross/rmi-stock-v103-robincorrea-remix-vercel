export interface Product {
  id: string;
  code: string; // Código de barras
  description: string; // Até 200 caracteres
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  code: string;
  description: string;
}

export interface ImportLine {
  internalCode: string;
  barcode: string;
  description: string;
  price: string;
  stock: string;
}