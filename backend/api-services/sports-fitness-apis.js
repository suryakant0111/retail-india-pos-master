// Sports & Fitness APIs
export const sportsFitnessAPIs = {
  // Sports & Fitness API - Sports equipment and fitness products
  async sportsFitness(barcode) {
    try {
      const response = await fetch(`https://api.sports-fitness.com/products?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Sports & Fitness APIs] Found product in Sports & Fitness: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Sports & Fitness',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            weight: product.weight,
            manufacturer: product.manufacturer,
            source: 'Sports & Fitness API'
          };
        }
      }
    } catch (error) {
      console.log('[Sports & Fitness APIs] Sports & Fitness API fetch failed:', error);
    }
    return null;
  }
}; 