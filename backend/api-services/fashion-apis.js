// Fashion & Clothing APIs
export const fashionAPIs = {
  // Fashion Database - Fashion and clothing products
  async fashionDatabase(barcode) {
    try {
      const response = await fetch(`https://api.fashion-database.com/products?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Fashion APIs] Found product in Fashion Database: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Clothing & Fashion',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            size: product.size,
            color: product.color,
            material: product.material,
            manufacturer: product.manufacturer,
            source: 'Fashion Database'
          };
        }
      }
    } catch (error) {
      console.log('[Fashion APIs] Fashion Database API fetch failed:', error);
    }
    return null;
  }
}; 