// Books APIs
export const booksAPIs = {
  // Google Books API - ISBN lookup for books
  async googleBooks(barcode) {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${barcode}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        console.log(`[Books APIs] Found book in Google Books: ${book.title}`);
        
        return {
          found: true,
          name: book.title || 'Unknown Book',
          price: 0,
          barcode: barcode,
          category: 'Books',
          stock: 1,
          gst: 12, // Books have lower GST
          description: book.description || book.title || '',
          image_url: book.imageLinks?.thumbnail || '',
          brand: book.publisher,
          author: book.authors?.join(', '),
          isbn: barcode,
          pages: book.pageCount,
          language: book.language,
          manufacturer: book.publisher,
          source: 'Google Books API'
        };
      }
    } catch (error) {
      console.log('[Books APIs] Google Books API fetch failed:', error);
    }
    return null;
  }
}; 