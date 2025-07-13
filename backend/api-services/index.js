// API Service Manager
export class APIServiceManager {
  constructor() {
    // Import modules dynamically to avoid circular dependency issues
    this.services = {};
    this.initializeServices();
  }

  async initializeServices() {
    try {
      // Import all API services
      const { foodAPIs } = await import('./food-apis.js');
      const { booksAPIs } = await import('./books-apis.js');
      const { electronicsAPIs } = await import('./electronics-apis.js');
      const { fashionAPIs } = await import('./fashion-apis.js');
      const { homeGardenAPIs } = await import('./home-garden-apis.js');
      const { sportsFitnessAPIs } = await import('./sports-fitness-apis.js');
      const { toysGamesAPIs } = await import('./toys-games-apis.js');

      this.services = {
        food: foodAPIs,
        books: booksAPIs,
        electronics: electronicsAPIs,
        fashion: fashionAPIs,
        homeGarden: homeGardenAPIs,
        sportsFitness: sportsFitnessAPIs,
        toysGames: toysGamesAPIs
      };
    } catch (error) {
      console.error('[API Service Manager] Error initializing services:', error);
      // Initialize with empty objects if imports fail
      this.services = {
        food: {},
        books: {},
        electronics: {},
        fashion: {},
        homeGarden: {},
        sportsFitness: {},
        toysGames: {}
      };
    }
  }

  // Get all available API services
  getAllServices() {
    return this.services;
  }

  // Get specific service by category
  getService(category) {
    const serviceMap = {
      'Food & Beverages': this.services.food,
      'Books': this.services.books,
      'Electronics': this.services.electronics,
      'Clothing & Fashion': this.services.fashion,
      'Home & Garden': this.services.homeGarden,
      'Sports & Fitness': this.services.sportsFitness,
      'Toys & Games': this.services.toysGames
    };
    return serviceMap[category];
  }

  // Find product by barcode across all APIs
  async findProductByBarcode(barcode) {
    console.log(`[API Service Manager] Searching for barcode: ${barcode}`);
    
    // Ensure services are initialized
    if (Object.keys(this.services).length === 0) {
      await this.initializeServices();
    }
    
    // Try each API service in order of priority
    const searchOrder = [
      // Food APIs
      () => this.services.food.openFoodFacts?.(barcode),
      () => this.services.food.foodFarms?.(barcode),
      () => this.services.food.indianGrocery?.(barcode),
      () => this.services.food.worldOpenFoodFacts?.(barcode),
      () => this.services.food.openFoodFactsByBrand?.(barcode),
      
      // Books APIs
      () => this.services.books.googleBooks?.(barcode),
      
      // Electronics APIs
      () => this.services.electronics.gs1Database?.(barcode),
      
      // Fashion APIs
      () => this.services.fashion.fashionDatabase?.(barcode),
      
      // Home & Garden APIs
      () => this.services.homeGarden.homeGarden?.(barcode),
      
      // Sports & Fitness APIs
      () => this.services.sportsFitness.sportsFitness?.(barcode),
      
      // Toys & Games APIs
      () => this.services.toysGames.toysGames?.(barcode)
    ];

    // Try each API in order
    for (const apiCall of searchOrder) {
      try {
        const result = await apiCall();
        if (result && result.found) {
          console.log(`[API Service Manager] Found product in ${result.source}: ${result.name}`);
          return result;
        }
      } catch (error) {
        console.log(`[API Service Manager] API call failed:`, error);
        continue; // Try next API
      }
    }

    // No product found
    console.log(`[API Service Manager] No product found for barcode: ${barcode}`);
    return {
      found: false,
      barcode: barcode,
      error: 'No product data found in any database'
    };
  }

  // Get API information for all services
  getAPIInfo() {
    return {
      available_apis: [
        {
          name: "Open Food Facts",
          category: "Food & Beverages",
          url: "https://world.openfoodfacts.org/api/v0/product/{barcode}.json",
          description: "Global food database with comprehensive product information",
          free: true,
          features: ["Product names", "Ingredients", "Nutrition facts", "Brand information", "Images"]
        },
        {
          name: "Google Books API",
          category: "Books",
          url: "https://www.googleapis.com/books/v1/volumes?q=isbn:{barcode}",
          description: "Comprehensive book database with ISBN lookup",
          free: true,
          features: ["Book titles", "Authors", "Publishers", "Page counts", "Cover images", "Descriptions"]
        },
        {
          name: "GS1 Database",
          category: "Electronics & General",
          url: "https://www.gs1.org/api/v1/products/{barcode}",
          description: "Global standard for product identification",
          free: true,
          features: ["Product names", "Categories", "Manufacturers", "Brands"]
        },
        {
          name: "Fashion Database",
          category: "Clothing & Fashion",
          url: "https://api.fashion-database.com/products?barcode={barcode}",
          description: "Fashion and clothing product database",
          free: true,
          features: ["Product names", "Sizes", "Colors", "Materials", "Brands"]
        },
        {
          name: "FoodFarms API",
          category: "Food & Beverages (Indian)",
          url: "https://api.foodfarms.in/products/search?barcode={barcode}",
          description: "Indian food products database",
          free: true,
          features: ["Indian products", "Local brands", "Regional items"]
        },
        {
          name: "Indian Grocery API",
          category: "Food & Beverages (Indian)",
          url: "https://api.indian-grocery.com/products?barcode={barcode}",
          description: "Indian grocery products database",
          free: true,
          features: ["Indian groceries", "Local products", "Regional brands"]
        },
        {
          name: "Home & Garden API",
          category: "Home & Garden",
          url: "https://api.home-garden.com/products?barcode={barcode}",
          description: "Home improvement and garden products",
          free: true,
          features: ["Home products", "Garden items", "Tools", "Decor"]
        },
        {
          name: "Sports & Fitness API",
          category: "Sports & Fitness",
          url: "https://api.sports-fitness.com/products?barcode={barcode}",
          description: "Sports equipment and fitness products",
          free: true,
          features: ["Sports equipment", "Fitness gear", "Exercise items"]
        },
        {
          name: "Toys & Games API",
          category: "Toys & Games",
          url: "https://api.toys-games.com/products?barcode={barcode}",
          description: "Toys, games, and entertainment products",
          free: true,
          features: ["Toys", "Games", "Age groups", "Entertainment items"]
        }
      ],
      categories: [
        {
          name: "Food & Beverages",
          apis: ["Open Food Facts", "FoodFarms API", "Indian Grocery API"],
          description: "Food items, beverages, snacks, and consumables"
        },
        {
          name: "Books",
          apis: ["Google Books API"],
          description: "Books, magazines, and printed materials"
        },
        {
          name: "Electronics",
          apis: ["GS1 Database"],
          description: "Electronic devices, gadgets, and tech products"
        },
        {
          name: "Clothing & Fashion",
          apis: ["Fashion Database"],
          description: "Apparel, accessories, and fashion items"
        },
        {
          name: "Home & Garden",
          apis: ["Home & Garden API"],
          description: "Home improvement, garden, and household items"
        },
        {
          name: "Sports & Fitness",
          apis: ["Sports & Fitness API"],
          description: "Sports equipment, fitness gear, and athletic items"
        },
        {
          name: "Toys & Games",
          apis: ["Toys & Games API"],
          description: "Toys, games, and entertainment products"
        }
      ],
      gst_rates: {
        "Books": 12,
        "Food & Beverages": 18,
        "Electronics": 18,
        "Clothing & Fashion": 18,
        "Home & Garden": 18,
        "Sports & Fitness": 18,
        "Toys & Games": 18
      },
      search_priority: [
        "Local Database (Supabase)",
        "Open Food Facts",
        "Google Books API",
        "GS1 Database",
        "Fashion Database",
        "FoodFarms API",
        "Indian Grocery API",
        "Home & Garden API",
        "Sports & Fitness API",
        "Toys & Games API"
      ],
      note: "All APIs listed are completely free and do not require API keys or payment"
    };
  }
} 