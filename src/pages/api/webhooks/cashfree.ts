// Webhook handler for Cashfree payment notifications
interface WebhookRequest {
  method: string;
  body: any;
  headers: Record<string, string>;
}

interface WebhookResponse {
  status: (code: number) => WebhookResponse;
  json: (data: any) => void;
}
import { supabase } from '@/integrations/supabase/client';
import { createCashfreeServiceForShop } from '@/services/cashfree-service';

export default async function handler(req: WebhookRequest, res: WebhookResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      orderId,
      paymentId,
      orderAmount,
      orderCurrency,
      orderStatus,
      paymentStatus,
      paymentAmount,
      paymentTime,
      customerDetails
    } = req.body;

    console.log('Cashfree webhook received:', {
      orderId,
      paymentId,
      orderStatus,
      paymentStatus,
      amount: orderAmount
    });

    // Extract shop ID from order ID (format: CF_SHOPID_INVOICEID_TIMESTAMP_RANDOM)
    const orderIdParts = orderId.split('_');
    if (orderIdParts.length < 3) {
      console.error('Invalid order ID format:', orderId);
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const shopId = orderIdParts[1];
    const invoiceId = orderIdParts[2];

    // Verify webhook signature (implement based on Cashfree docs)
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifyWebhookSignature(req.body, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Update payment transaction status
    await updatePaymentStatus(shopId, orderId, paymentId, orderStatus, req.body);

    // Update invoice status if payment is successful
    if (orderStatus === 'PAID' && paymentStatus === 'SUCCESS') {
      await updateInvoiceStatus(invoiceId, 'paid');
    }

    // Log webhook event
    await logWebhookEvent(shopId, 'cashfree', 'payment.webhook', orderId, req.body);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePaymentStatus(
  shopId: string,
  orderId: string,
  paymentId: string,
  status: string,
  webhookData: any
) {
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: status === 'PAID' ? 'success' : status === 'FAILED' ? 'failed' : 'pending',
      gateway_transaction_id: paymentId,
      cashfree_order_id: orderId,
      cashfree_payment_id: paymentId,
      gateway_response: webhookData,
      updated_at: new Date().toISOString()
    })
    .eq('shop_id', shopId)
    .eq('cashfree_order_id', orderId);

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }
}

async function updateInvoiceStatus(invoiceId: string, status: string) {
  const { error } = await supabase
    .from('invoices')
    .update({
      paymentStatus: status,
      updatedAt: new Date().toISOString()
    })
    .eq('id', invoiceId);

  if (error) {
    console.error('Failed to update invoice status:', error);
    throw error;
  }
}

async function logWebhookEvent(
  shopId: string,
  paymentGateway: string,
  eventType: string,
  gatewayTransactionId: string,
  payload: any
) {
  const { error } = await supabase
    .from('webhook_events')
    .insert({
      shop_id: shopId,
      payment_gateway: paymentGateway,
      event_type: eventType,
      gateway_transaction_id: gatewayTransactionId,
      payload,
      processed: true
    });

  if (error) {
    console.error('Failed to log webhook event:', error);
  }
}

function verifyWebhookSignature(payload: any, signature: string): boolean {
  // TODO: Implement proper signature verification based on Cashfree documentation
  // For now, return true (implement in production)
  return true;
} 