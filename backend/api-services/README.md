# API Services Module

This directory contains modular API services for different product categories. Each service is organized by category and provides a clean, maintainable structure.

## 📁 File Structure

```
api-services/
├── index.js              # Main service manager and exports
├── food-apis.js          # Food & Beverages APIs
├── books-apis.js         # Books APIs
├── electronics-apis.js   # Electronics APIs
├── fashion-apis.js       # Clothing & Fashion APIs
├── home-garden-apis.js   # Home & Garden APIs
├── sports-fitness-apis.js # Sports & Fitness APIs
├── toys-games-apis.js    # Toys & Games APIs
└── README.md             # This documentation
```

## 🏗️ Architecture

### APIServiceManager Class
The main service manager that coordinates all API calls and provides a unified interface.

**Key Methods:**
- `findProductByBarcode(barcode)` - Searches across all APIs
- `getService(category)` - Gets specific service by category
- `getAPIInfo()` - Returns API information for documentation

### Individual API Services
Each category has its own service file with specific API implementations:

#### Food & Beverages (`food-apis.js`)
- Open Food Facts
- FoodFarms API (Indian)
- Indian Grocery API
- World Open Food Facts
- Open Food Facts Brand Search

#### Books (`books-apis.js`)
- Google Books API (ISBN lookup)

#### Electronics (`electronics-apis.js`)
- GS1 Database

#### Fashion (`fashion-apis.js`)
- Fashion Database

#### Home & Garden (`home-garden-apis.js`)
- Home & Garden API

#### Sports & Fitness (`sports-fitness-apis.js`)
- Sports & Fitness API

#### Toys & Games (`toys-games-apis.js`)
- Toys & Games API

## 🔧 Usage

### In server.js
```javascript
import { APIServiceManager } from './api-services/index.js';

const apiServiceManager = new APIServiceManager();

// Find product across all APIs
const product = await apiServiceManager.findProductByBarcode('123456789');

// Get API information
const apiInfo = apiServiceManager.getAPIInfo();
```

### Direct Service Usage
```javascript
import { foodAPIs } from './api-services/food-apis.js';

const product = await foodAPIs.openFoodFacts('123456789');
```

## 📊 API Response Format

All APIs return a standardized response format:

```javascript
{
  found: true,
  name: "Product Name",
  price: 0, // Set manually
  barcode: "123456789",
  category: "Food & Beverages",
  stock: 1,
  gst: 18, // 12 for books, 18 for others
  description: "Product description",
  image_url: "https://example.com/image.jpg",
  brand: "Brand Name",
  manufacturer: "Manufacturer Name",
  source: "API Name" // Which API found the product
}
```

## 🎯 Benefits

1. **Modularity**: Each category is in its own file
2. **Maintainability**: Easy to add/remove/modify APIs
3. **Reusability**: Services can be used independently
4. **Error Handling**: Each API has its own error handling
5. **Logging**: Detailed logging for debugging
6. **Free APIs Only**: All APIs are completely free

## 🔄 Adding New APIs

To add a new API:

1. Create a new service file or add to existing category
2. Implement the API function with proper error handling
3. Add to the search order in `APIServiceManager.findProductByBarcode()`
4. Update the API info in `getAPIInfo()`

## 🚀 Performance

- APIs are tried in order of priority
- First successful result is returned
- Failed APIs are logged but don't stop the search
- All APIs are free and don't require authentication 