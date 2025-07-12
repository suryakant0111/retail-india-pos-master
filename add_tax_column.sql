-- Add tax column to products table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tax DECIMAL(5,2) DEFAULT 0;

-- Update existing products to have a default tax rate of 0%
UPDATE products 
SET tax = 0 
WHERE tax IS NULL;

-- Make sure the column is not null after setting defaults
ALTER TABLE products 
ALTER COLUMN tax SET NOT NULL; 