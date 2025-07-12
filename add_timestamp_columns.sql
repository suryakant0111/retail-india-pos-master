-- Add timestamp columns to products table for better tracking
-- Run this script in your Supabase SQL editor if you want to enable date filtering

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have timestamps
UPDATE products 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL; 