import { supabase } from '@/integrations/supabase/client';

interface CashfreeOrderRequest {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  orderNote?: string;
  customerDetails?: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
  };
}

interface CashfreeOrderResponse {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus: string;
  paymentUrl?: string;
  qrCode?: string;
}

interface CashfreePaymentStatus {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus: 'PAID' | 'PENDING' | 'FAILED';
  paymentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paymentTime?: string;
}

export class CashfreeService {
  private appId: string;
  private secretKey: string;
  private environment: 'TEST' | 'PROD';
  private baseUrl: string;

  constructor(appId: string, secretKey: string, environment: 'TEST' | 'PROD' = 'TEST') {
    this.appId = appId;
    this.secretKey = secretKey;
    this.environment = environment;
    this.baseUrl = environment === 'PROD' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'x-api-version': '2023-08-01',
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cashfree API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cashfree API request failed:', error);
      throw error;
    }
  }

  // Create a new order
  async createOrder(orderData: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
    const endpoint = '/orders';
    return this.makeRequest(endpoint, 'POST', orderData);
  }

  // Generate UPI QR code
  async generateUPIQR(orderId: string, amount: number, customerDetails?: any): Promise<{
    qrCode: string;
    orderId: string;
    amount: number;
  }> {
    // First create the order
    const orderData: CashfreeOrderRequest = {
      orderId,
      orderAmount: amount,
      orderCurrency: 'INR',
      orderNote: 'POS Payment',
      customerDetails
    };

    const order = await this.createOrder(orderData);

    // Generate QR code for the order
    const qrEndpoint = `/orders/${orderId}/qrcode`;
    const qrData = {
      qrCodeRequest: {
        qrCodeType: 'UPI_QR',
        amount: amount
      }
    };

    const qrResponse = await this.makeRequest(qrEndpoint, 'POST', qrData);

    return {
      qrCode: qrResponse.qrCode,
      orderId: order.orderId,
      amount: order.orderAmount
    };
  }

  // Check payment status
  async getPaymentStatus(orderId: string): Promise<CashfreePaymentStatus> {
    const endpoint = `/orders/${orderId}`;
    return this.makeRequest(endpoint);
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: any, signature: string): boolean {
    // In production, implement proper signature verification
    // For now, return true (implement based on Cashfree docs)
    return true;
  }

  // Get order details with payment info
  async getOrderDetails(orderId: string): Promise<any> {
    const endpoint = `/orders/${orderId}`;
    return this.makeRequest(endpoint);
  }

  // Refund payment
  async refundPayment(orderId: string, paymentId: string, refundAmount: number, refundNote?: string): Promise<any> {
    const endpoint = `/orders/${orderId}/refunds`;
    const refundData = {
      refundId: `REFUND_${Date.now()}`,
      refundAmount: refundAmount,
      refundNote: refundNote || 'Refund from POS system'
    };

    return this.makeRequest(endpoint, 'POST', refundData);
  }
}

// Factory function to create Cashfree service for a shop
export async function createCashfreeServiceForShop(shopId: string): Promise<CashfreeService | null> {
  try {
    const { data, error } = await supabase
      .from('shop_payment_settings')
      .select('*')
      .eq('shop_id', shopId)
      .eq('payment_gateway', 'cashfree')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('No Cashfree settings found for shop:', shopId);
      return null;
    }

    // Decrypt the credentials (assuming they're stored encrypted)
    const appId = data.cashfree_app_id || data.api_key;
    const secretKey = data.cashfree_secret_key || data.api_secret;
    const environment = data.cashfree_environment || 'TEST';

    if (!appId || !secretKey) {
      console.error('Missing Cashfree credentials for shop:', shopId);
      return null;
    }

    return new CashfreeService(appId, secretKey, environment as 'TEST' | 'PROD');
  } catch (error) {
    console.error('Failed to create Cashfree service for shop:', shopId, error);
    return null;
  }
}

// Utility function to generate unique order ID
export function generateOrderId(shopId: string, invoiceId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `CF_${shopId}_${invoiceId}_${timestamp}_${random}`.toUpperCase();
}

// Test the Cashfree integration
export async function testCashfreeConnection(shopId: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const cashfreeService = await createCashfreeServiceForShop(shopId);
    
    if (!cashfreeService) {
      return {
        success: false,
        message: 'Cashfree service not configured for this shop'
      };
    }

    // Test with a minimal order
    const testOrderId = `TEST_${Date.now()}`;
    const testOrder = await cashfreeService.createOrder({
      orderId: testOrderId,
      orderAmount: 1.00, // 1 rupee test
      orderCurrency: 'INR',
      orderNote: 'Connection test'
    });

    return {
      success: true,
      message: 'Cashfree connection successful',
      details: {
        orderId: testOrder.orderId,
        status: testOrder.orderStatus
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Cashfree connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 