-- Update products table schema to match TypeScript interface
-- Run this SQL in your Supabase SQL editor

-- Add tax column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tax DECIMAL(5,2) DEFAULT 0;

-- Add taxRate column (for backward compatibility)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) DEFAULT 0;

-- Add costPrice column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,2) DEFAULT 0;

-- Add hsn column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hsn VARCHAR(50);

-- Add minStock column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "minStock" INTEGER DEFAULT 0;

-- Add image column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add image_url column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- Add isActive column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add unitType column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "unitType" VARCHAR(20) DEFAULT 'unit';

-- Add unitLabel column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "unitLabel" VARCHAR(10) DEFAULT 'pcs';

-- Update existing products to have default values
UPDATE products 
SET 
  tax = 0,
  "taxRate" = 0,
  "costPrice" = 0,
  "minStock" = 0,
  "isActive" = true,
  "unitType" = 'unit',
  "unitLabel" = 'pcs'
WHERE tax IS NULL OR "taxRate" IS NULL OR "costPrice" IS NULL OR "minStock" IS NULL OR "isActive" IS NULL OR "unitType" IS NULL OR "unitLabel" IS NULL;

-- Make important columns NOT NULL
ALTER TABLE products 
ALTER COLUMN tax SET NOT NULL,
ALTER COLUMN "taxRate" SET NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL,
ALTER COLUMN "unitType" SET NOT NULL,
ALTER COLUMN "unitLabel" SET NOT NULL;

-- Add constraints
ALTER TABLE products 
ADD CONSTRAINT check_tax_range CHECK (tax >= 0 AND tax <= 100),
ADD CONSTRAINT check_taxRate_range CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
ADD CONSTRAINT check_unitType CHECK ("unitType" IN ('unit', 'weight', 'volume'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode); 