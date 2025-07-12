import { supabase } from '@/integrations/supabase/client';

// Simple encryption/decryption without external dependencies
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long';

interface ShopPaymentSettings {
  shop_id: string;
  payment_gateway: 'cashfree' | 'razorpay' | 'phonepe';
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
  merchant_id?: string;
  cashfree_app_id?: string;
  cashfree_secret_key?: string;
  cashfree_environment?: 'TEST' | 'PROD';
  is_active: boolean;
}

interface PaymentTransaction {
  id?: string;
  shop_id: string;
  invoice_id: string;
  gateway_transaction_id?: string;
  payment_gateway: string;
  amount: number;
  currency: string;
  payment_method?: string;
  status: 'pending' | 'success' | 'failed';
  gateway_response?: any;
}

export class PaymentGatewayService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = ENCRYPTION_KEY;
  }

  // Simple encryption (for demo - use proper encryption in production)
  private encrypt(text: string): string {
    // Simple base64 encoding for demo - use proper encryption in production
    return btoa(text);
  }

  // Simple decryption (for demo - use proper decryption in production)
  private decrypt(encryptedText: string): string {
    // Simple base64 decoding for demo - use proper decryption in production
    return atob(encryptedText);
  }

  // Get shop payment settings
  async getShopPaymentSettings(shopId: string): Promise<ShopPaymentSettings | null> {
    const { data, error } = await supabase
      .from('shop_payment_settings')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    // Decrypt sensitive data
    return {
      ...data,
      api_key: this.decrypt(data.api_key),
      api_secret: this.decrypt(data.api_secret),
      webhook_secret: data.webhook_secret ? this.decrypt(data.webhook_secret) : undefined
    };
  }

  // Save shop payment settings
  async saveShopPaymentSettings(settings: Omit<ShopPaymentSettings, 'is_active'>): Promise<void> {
    const encryptedSettings = {
      ...settings,
      api_key: this.encrypt(settings.api_key),
      api_secret: this.encrypt(settings.api_secret),
      webhook_secret: settings.webhook_secret ? this.encrypt(settings.webhook_secret) : null,
      is_active: true
    };

    const { error } = await supabase
      .from('shop_payment_settings')
      .upsert(encryptedSettings, { onConflict: 'shop_id,payment_gateway' });

    if (error) throw new Error(`Failed to save payment settings: ${error.message}`);
  }

  // Create payment transaction
  async createPaymentTransaction(transaction: PaymentTransaction): Promise<string> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(transaction)
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create payment transaction: ${error.message}`);
    return data.id;
  }

  // Update payment status
  async updatePaymentStatus(
    transactionId: string, 
    status: 'pending' | 'success' | 'failed',
    gatewayResponse?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('payment_transactions')
      .update({ 
        status, 
        gateway_response: gatewayResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) throw new Error(`Failed to update payment status: ${error.message}`);
  }

  // Get payment transaction by gateway ID
  async getPaymentByGatewayId(gatewayTransactionId: string): Promise<PaymentTransaction | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', gatewayTransactionId)
      .single();

    if (error || !data) return null;
    return data;
  }

  // Process webhook event
  async processWebhookEvent(
    shopId: string,
    paymentGateway: string,
    eventType: string,
    gatewayTransactionId: string,
    payload: any
  ): Promise<void> {
    // Store webhook event
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        shop_id: shopId,
        payment_gateway: paymentGateway,
        event_type: eventType,
        gateway_transaction_id: gatewayTransactionId,
        payload
      });

    if (webhookError) {
      console.error('Failed to store webhook event:', webhookError);
      return;
    }

    // Update payment status based on event type
    const transaction = await this.getPaymentByGatewayId(gatewayTransactionId);
    if (transaction) {
      let newStatus: 'pending' | 'success' | 'failed' = 'pending';
      
      switch (eventType) {
        case 'payment.success':
        case 'payment.captured':
          newStatus = 'success';
          break;
        case 'payment.failed':
        case 'payment.declined':
          newStatus = 'failed';
          break;
        default:
          return; // Don't update for other events
      }

      await this.updatePaymentStatus(transaction.id, newStatus, payload);
    }
  }

  // Generate UPI QR code for shop
  async generateUPIQR(shopId: string, amount: number, invoiceId: string): Promise<{
    qrCode: string;
    transactionId: string;
    upiId: string;
  }> {
    const settings = await this.getShopPaymentSettings(shopId);
    if (!settings) {
      throw new Error('Payment gateway not configured for this shop');
    }

    // Create payment transaction
    const transactionId = await this.createPaymentTransaction({
      shop_id: shopId,
      invoice_id: invoiceId,
      payment_gateway: settings.payment_gateway,
      amount,
      currency: 'INR',
      payment_method: 'upi',
      status: 'pending'
    });

    // Generate QR code based on gateway
    switch (settings.payment_gateway) {
      case 'cashfree':
        return this.generateCashfreeQR(settings, amount, transactionId);
      case 'razorpay':
        return this.generateRazorpayQR(settings, amount, transactionId);
      case 'phonepe':
        return this.generatePhonePeQR(settings, amount, transactionId);
      default:
        throw new Error(`Unsupported payment gateway: ${settings.payment_gateway}`);
    }
  }

  private async generateCashfreeQR(
    settings: ShopPaymentSettings, 
    amount: number, 
    transactionId: string
  ) {
    // Implement Cashfree QR generation
    // This would call Cashfree API
    return {
      qrCode: `upi://pay?pa=${settings.merchant_id}&pn=Shop&am=${amount}&tn=Invoice-${transactionId}`,
      transactionId,
      upiId: settings.merchant_id || ''
    };
  }

  private async generateRazorpayQR(
    settings: ShopPaymentSettings, 
    amount: number, 
    transactionId: string
  ) {
    // Implement Razorpay QR generation
    return {
      qrCode: `upi://pay?pa=${settings.merchant_id}&pn=Shop&am=${amount}&tn=Invoice-${transactionId}`,
      transactionId,
      upiId: settings.merchant_id || ''
    };
  }

  private async generatePhonePeQR(
    settings: ShopPaymentSettings, 
    amount: number, 
    transactionId: string
  ) {
    // Implement PhonePe QR generation
    return {
      qrCode: `upi://pay?pa=${settings.merchant_id}&pn=Shop&am=${amount}&tn=Invoice-${transactionId}`,
      transactionId,
      upiId: settings.merchant_id || ''
    };
  }
} 