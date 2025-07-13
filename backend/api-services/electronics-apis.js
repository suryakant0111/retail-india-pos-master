// Electronics APIs
export const electronicsAPIs = {
  // GS1 Database - Global standard for product identification
  async gs1Database(barcode) {
    try {
      const response = await fetch(`https://www.gs1.org/api/v1/products/${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.product) {
          console.log(`[Electronics APIs] Found product in GS1: ${data.product.name}`);
          
          return {
            found: true,
            name: data.product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: data.product.category || 'Electronics',
            stock: 1,
            gst: 18,
            description: data.product.description || data.product.name || '',
            image_url: data.product.image_url || '',
            brand: data.product.brand,
            weight: data.product.weight,
            manufacturer: data.product.manufacturer,
            source: 'GS1 Database'
          };
        }
      }
    } catch (error) {
      console.log('[Electronics APIs] GS1 API fetch failed:', error);
    }
    return null;
  }
}; 