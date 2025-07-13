// Food & Beverages APIs
export const foodAPIs = {
  // Open Food Facts - Global food database
  async openFoodFacts(barcode) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        console.log(`[Food APIs] Found product in Open Food Facts: ${product.product_name}`);
        
        return {
          found: true,
          name: product.product_name || product.product_name_en || product.generic_name || 'Unknown Product',
          price: 0,
          barcode: barcode,
          category: 'Food & Beverages',
          stock: 1,
          gst: 18,
          description: product.generic_name || product.brands || product.product_name || '',
          image_url: product.image_front_url || product.image_url || '',
          brand: product.brands,
          ingredients: product.ingredients_text,
          weight: product.quantity,
          country: product.countries_tags?.[0],
          manufacturer: product.manufacturing_places,
          source: 'Open Food Facts'
        };
      }
    } catch (error) {
      console.log('[Food APIs] Open Food Facts API fetch failed:', error);
    }
    return null;
  },

  // FoodFarms API - Indian food products
  async foodFarms(barcode) {
    try {
      const response = await fetch(`https://api.foodfarms.in/products/search?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Food APIs] Found product in FoodFarms: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Food & Beverages',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            weight: product.weight,
            manufacturer: product.manufacturer,
            source: 'FoodFarms API'
          };
        }
      }
    } catch (error) {
      console.log('[Food APIs] FoodFarms API fetch failed:', error);
    }
    return null;
  },

  // Indian Grocery API
  async indianGrocery(barcode) {
    try {
      const response = await fetch(`https://api.indian-grocery.com/products?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Food APIs] Found product in Indian Grocery API: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Food & Beverages',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            weight: product.weight,
            manufacturer: product.manufacturer,
            source: 'Indian Grocery API'
          };
        }
      }
    } catch (error) {
      console.log('[Food APIs] Indian Grocery API fetch failed:', error);
    }
    return null;
  },

  // World Open Food Facts (additional search)
  async worldOpenFoodFacts(barcode) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${barcode}&search_simple=1&action=process&json=1`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        console.log(`[Food APIs] Found product in World Open Food Facts: ${product.product_name}`);
        
        return {
          found: true,
          name: product.product_name || product.product_name_en || product.generic_name || 'Unknown Product',
          price: 0,
          barcode: barcode,
          category: 'Food & Beverages',
          stock: 1,
          gst: 18,
          description: product.generic_name || product.brands || product.product_name || '',
          image_url: product.image_front_url || product.image_url || '',
          brand: product.brands,
          ingredients: product.ingredients_text,
          weight: product.quantity,
          country: product.countries_tags?.[0],
          manufacturer: product.manufacturing_places,
          source: 'World Open Food Facts'
        };
      }
    } catch (error) {
      console.log('[Food APIs] World Open Food Facts search failed:', error);
    }
    return null;
  },

  // Open Food Facts by brand search
  async openFoodFactsByBrand(barcode) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/brand/${barcode}.json`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        console.log(`[Food APIs] Found product in Open Food Facts by brand: ${product.product_name}`);
        
        return {
          found: true,
          name: product.product_name || product.product_name_en || product.generic_name || 'Unknown Product',
          price: 0,
          barcode: barcode,
          category: 'Food & Beverages',
          stock: 1,
          gst: 18,
          description: product.generic_name || product.brands || product.product_name || '',
          image_url: product.image_front_url || product.image_url || '',
          brand: product.brands,
          ingredients: product.ingredients_text,
          weight: product.quantity,
          country: product.countries_tags?.[0],
          manufacturer: product.manufacturing_places,
          source: 'Open Food Facts Brand Search'
        };
      }
    } catch (error) {
      console.log('[Food APIs] Open Food Facts brand search failed:', error);
    }
    return null;
  }
}; 