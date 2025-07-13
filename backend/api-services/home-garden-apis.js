// Home & Garden APIs
export const homeGardenAPIs = {
  // Home & Garden API - Home improvement and garden products
  async homeGarden(barcode) {
    try {
      const response = await fetch(`https://api.home-garden.com/products?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Home & Garden APIs] Found product in Home & Garden: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Home & Garden',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            weight: product.weight,
            manufacturer: product.manufacturer,
            source: 'Home & Garden API'
          };
        }
      }
    } catch (error) {
      console.log('[Home & Garden APIs] Home & Garden API fetch failed:', error);
    }
    return null;
  }
}; 