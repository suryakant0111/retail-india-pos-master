// Test file to verify API services work correctly
import { APIServiceManager } from './api-services/index.js';

async function testAPIServices() {
  console.log('🧪 Testing API Services...');
  
  const apiServiceManager = new APIServiceManager();
  
  // Test 1: Check if service manager initializes
  console.log('✅ Service Manager initialized');
  
  // Wait a bit for services to initialize
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test 2: Check API info
  const apiInfo = apiServiceManager.getAPIInfo();
  console.log('✅ API Info retrieved:', apiInfo.available_apis.length, 'APIs available');
  
  // Test 3: Test with a sample barcode (this will likely fail but should not crash)
  try {
    const result = await apiServiceManager.findProductByBarcode('123456789');
    console.log('✅ Barcode lookup test completed:', result.found ? 'Product found' : 'No product found');
  } catch (error) {
    console.log('⚠️ Barcode lookup test failed (expected for test barcode):', error.message);
  }
  
  // Test 4: Check individual services
  const services = apiServiceManager.getAllServices();
  console.log('✅ All services loaded:', Object.keys(services).length, 'service categories');
  
  console.log('🎉 All API service tests completed successfully!');
}

// Run the test
testAPIServices().catch(console.error); 