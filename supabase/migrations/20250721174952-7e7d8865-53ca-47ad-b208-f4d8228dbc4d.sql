-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period TEXT NOT NULL, -- 'monthly', 'yearly', 'free'
  product_limit INTEGER,
  stock_count_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the three plans
INSERT INTO public.plans (name, price, period, product_limit, stock_count_limit) VALUES
('Free', 0.00, 'free', 10, 10),
('Premium Mensal', 49.90, 'monthly', NULL, NULL),
('Premium Anual', 499.90, 'yearly', NULL, NULL);

-- Create user_plans table to track current user plan
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock_counts table to organize multiple counts
CREATE TABLE public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  counter_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update stock_items to reference a stock_count
ALTER TABLE public.stock_items ADD COLUMN stock_count_id UUID REFERENCES public.stock_counts(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for plans (readable by all authenticated users)
CREATE POLICY "Authenticated users can view plans" 
ON public.plans 
FOR SELECT 
TO authenticated
USING (true);

-- Create RLS policies for user_plans
CREATE POLICY "Users can view their own plans" 
ON public.user_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" 
ON public.user_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
ON public.user_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for stock_counts
CREATE POLICY "Users can view their own stock counts" 
ON public.stock_counts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock counts" 
ON public.stock_counts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock counts" 
ON public.stock_counts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock counts" 
ON public.stock_counts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update stock_items RLS to include stock_count relationship
DROP POLICY IF EXISTS "Allow all access to stock_items" ON public.stock_items;

CREATE POLICY "Users can view stock items from their counts" 
ON public.stock_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stock_counts 
    WHERE id = stock_items.stock_count_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert stock items to their counts" 
ON public.stock_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stock_counts 
    WHERE id = stock_items.stock_count_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update stock items from their counts" 
ON public.stock_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.stock_counts 
    WHERE id = stock_items.stock_count_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete stock items from their counts" 
ON public.stock_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.stock_counts 
    WHERE id = stock_items.stock_count_id 
    AND user_id = auth.uid()
  )
);

-- Update products RLS to be user-specific
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;

-- For products, we'll make them user-specific as well
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the Free plan ID
  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Assign Free plan to new user
  INSERT INTO public.user_plans (user_id, plan_id)
  VALUES (NEW.id, free_plan_id);
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_counts_updated_at
  BEFORE UPDATE ON public.stock_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();