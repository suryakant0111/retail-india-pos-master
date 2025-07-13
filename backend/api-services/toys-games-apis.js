// Toys & Games APIs
export const toysGamesAPIs = {
  // Toys & Games API - Toys, games, and entertainment products
  async toysGames(barcode) {
    try {
      const response = await fetch(`https://api.toys-games.com/products?barcode=${barcode}`, {
        headers: {
          'User-Agent': 'Retail-India-POS/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          console.log(`[Toys & Games APIs] Found product in Toys & Games: ${product.name}`);
          
          return {
            found: true,
            name: product.name || 'Unknown Product',
            price: 0,
            barcode: barcode,
            category: 'Toys & Games',
            stock: 1,
            gst: 18,
            description: product.description || product.name || '',
            image_url: product.image_url || '',
            brand: product.brand,
            age_group: product.age_group,
            manufacturer: product.manufacturer,
            source: 'Toys & Games API'
          };
        }
      }
    } catch (error) {
      console.log('[Toys & Games APIs] Toys & Games API fetch failed:', error);
    }
    return null;
  }
}; 