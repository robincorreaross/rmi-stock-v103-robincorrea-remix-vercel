-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_items table
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_products_description ON public.products(description);
CREATE INDEX idx_stock_items_barcode ON public.stock_items(barcode);
CREATE INDEX idx_stock_items_timestamp ON public.stock_items(timestamp DESC);

-- Enable Row Level Security (currently allowing all access since no auth is implemented)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (will need to be updated when auth is added)
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all access to stock_items" ON public.stock_items FOR ALL USING (true);