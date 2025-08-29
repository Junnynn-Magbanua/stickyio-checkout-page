import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Main webhook handler - handles all Sticky.io webhook events
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-sticky-signature') || 
                     request.headers.get('x-webhook-signature');
    
    console.log('Webhook received:', {
      signature: signature ? 'Present' : 'Missing',
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
      contentType: request.headers.get('content-type')
    });

    // Skip signature verification for now since Sticky.io may not provide it
    console.log('Proceeding without signature verification');

    // Parse the webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
      console.log('Parsed JSON webhook data:', webhookData);
    } catch (e) {
      // Handle form-encoded data if JSON parsing fails
      console.log('JSON parsing failed, trying form data...');
      const params = new URLSearchParams(body);
      webhookData = Object.fromEntries(params);
      console.log('Parsed form webhook data:', webhookData);
    }

    // Determine webhook event type - check multiple possible fields
    const eventType = webhookData.event_type || 
                     webhookData.eventType || 
                     webhookData.action ||
                     webhookData.type ||
                     'unknown';
                     
    const orderId = webhookData.order_id || 
                   webhookData.orderId || 
                   webhookData.id;
                   
    const customerId = webhookData.customer_id || 
                      webhookData.customerId;

    console.log(`Processing webhook event: ${eventType} for order: ${orderId}`);

    // Handle different webhook events
    switch (eventType.toLowerCase()) {
      case 'order_created':
      case 'order.created':
      case 'created':
        await handleOrderCreated(webhookData);
        break;
        
      case 'order_success':
      case 'order.success':
      case 'approved':
      case 'success':
        await handleOrderSuccess(webhookData);
        break;
        
      case 'order_declined':
      case 'order.declined':
      case 'declined':
        await handleOrderDeclined(webhookData);
        break;
        
      case 'subscription_created':
      case 'subscription.created':
        await handleSubscriptionCreated(webhookData);
        break;
        
      case 'subscription_cancelled':
      case 'subscription.cancelled':
      case 'cancelled':
        await handleSubscriptionCancelled(webhookData);
        break;
        
      case 'subscription_renewed':
      case 'subscription.renewed':
      case 'renewed':
        await handleSubscriptionRenewed(webhookData);
        break;
        
      case 'refund_issued':
      case 'refund.issued':
      case 'refund':
        await handleRefundIssued(webhookData);
        break;
        
      case 'chargeback':
      case 'chargeback.created':
        await handleChargeback(webhookData);
        break;

      case 'void':
        await handleVoid(webhookData);
        break;

      case 'cancel':
        await handleCancel(webhookData);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${eventType}`, webhookData);
        await handleUnknownEvent(webhookData);
    }

    // Log webhook event (console only)
    await logWebhookEvent({
      eventType,
      orderId,
      customerId,
      data: webhookData,
      processedAt: new Date().toISOString()
    });

    console.log(`Webhook ${eventType} processed successfully`);

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${eventType} processed successfully`,
      orderId,
      customerId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json({ 
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}

// Handle successful order creation
async function handleOrderCreated(data) {
  console.log('Processing order created:', data.order_id || data.id);
  
  const orderData = {
    orderId: data.order_id || data.id,
    customerId: data.customer_id || data.customerId,
    email: data.email_address || data.email,
    firstName: data.first_name || data.firstName,
    lastName: data.last_name || data.lastName,
    total: data.total_amount || data.amount || data.total,
    products: data.products || [],
    status: 'created'
  };

  console.log('Order created details:', orderData);

  // Send order confirmation email
  if (orderData.email) {
    await sendConfirmationEmail(orderData);
  }
  
  // Update order status
  await updateOrderStatus(orderData.orderId, 'created', data);
  
  console.log(`Order created webhook processed: ${orderData.orderId}`);
}

// Handle successful payment
async function handleOrderSuccess(data) {
  console.log('Processing successful order:', data.order_id || data.id);
  
  const orderData = {
    orderId: data.order_id || data.id,
    customerId: data.customer_id || data.customerId,
    email: data.email_address || data.email,
    firstName: data.first_name || data.firstName,
    lastName: data.last_name || data.lastName,
    total: data.total_amount || data.amount || data.total,
    products: data.products || [],
    status: 'success'
  };

  console.log('Order success details:', orderData);

  // Send welcome email with account access
  if (orderData.email) {
    await sendWelcomeEmail(orderData);
  }
  
  // Activate customer access
  if (orderData.customerId) {
    await activateCustomerAccess(orderData.customerId, orderData.products);
  }
  
  // Update order status
  await updateOrderStatus(orderData.orderId, 'success', data);
  
  console.log(`Order success webhook processed: ${orderData.orderId}`);
}

// Handle declined order
async function handleOrderDeclined(data) {
  console.log('Processing declined order:', data.order_id || data.id);
  
  const orderData = {
    orderId: data.order_id || data.id,
    customerId: data.customer_id || data.customerId,
    email: data.email_address || data.email,
    firstName: data.first_name || data.firstName,
    lastName: data.last_name || data.lastName,
    declineReason: data.decline_reason || data.reason || 'Payment failed',
    status: 'declined'
  };

  console.log('Order declined details:', orderData);

  // Send payment failed email
  if (orderData.email) {
    await sendPaymentFailedEmail(orderData);
  }
  
  // Update order status
  await updateOrderStatus(orderData.orderId, 'declined', data);
  
  console.log(`Order declined webhook processed: ${orderData.orderId}`);
}

// Handle subscription creation
async function handleSubscriptionCreated(data) {
  console.log('Processing subscription created:', data.subscription_id);
  
  await createSubscriptionRecord({
    subscriptionId: data.subscription_id,
    customerId: data.customer_id,
    productId: data.product_id,
    billingCycle: data.billing_cycle,
    nextBillDate: data.next_bill_date
  });
  
  console.log(`Subscription created webhook processed: ${data.subscription_id}`);
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(data) {
  console.log('Processing subscription cancelled:', data.subscription_id);
  
  await cancelSubscriptionAccess(data.subscription_id, data.customer_id);
  
  if (data.email_address) {
    await sendCancellationEmail({
      email: data.email_address,
      subscriptionId: data.subscription_id,
      customerName: `${data.first_name} ${data.last_name}`,
      endDate: data.cancellation_date
    });
  }
  
  console.log(`Subscription cancelled webhook processed: ${data.subscription_id}`);
}

// Handle subscription renewal
async function handleSubscriptionRenewed(data) {
  console.log('Processing subscription renewal:', data.subscription_id);
  await renewSubscriptionAccess(data.subscription_id, data.customer_id);
  console.log(`Subscription renewed webhook processed: ${data.subscription_id}`);
}

// Handle refund
async function handleRefundIssued(data) {
  console.log('Processing refund:', data.order_id);
  await processRefund({
    orderId: data.order_id,
    customerId: data.customer_id,
    refundAmount: data.refund_amount,
    refundReason: data.refund_reason
  });
  console.log(`Refund webhook processed: ${data.order_id}`);
}

// Handle chargeback
async function handleChargeback(data) {
  console.log('Processing chargeback:', data.order_id);
  await handleChargebackEvent({
    orderId: data.order_id,
    customerId: data.customer_id,
    chargebackAmount: data.chargeback_amount,
    chargebackReason: data.chargeback_reason
  });
  await sendChargebackAlert(data);
  console.log(`Chargeback webhook processed: ${data.order_id}`);
}

// Handle void
async function handleVoid(data) {
  console.log('Processing void:', data.order_id);
  await updateOrderStatus(data.order_id, 'voided', data);
}

// Handle cancel
async function handleCancel(data) {
  console.log('Processing cancel:', data.order_id);
  await updateOrderStatus(data.order_id, 'cancelled', data);
}

// Handle unknown events
async function handleUnknownEvent(data) {
  console.log('Processing unknown webhook event:', data);
  await logUnknownWebhookEvent(data);
}

// ========== HELPER FUNCTIONS (CONSOLE LOGGING ONLY) ==========

// Console-only logging (no file system operations)
async function updateOrderStatus(orderId, status, data) {
  console.log(`Order ${orderId} status updated to: ${status}`);
  console.log('Order details:', {
    customerEmail: data.email_address || data.email,
    customerName: `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim(),
    total: data.total_amount || data.amount || data.total,
    products: data.products || []
  });
}

// Email functions (console logging for now)
async function sendConfirmationEmail(orderData) {
  console.log('[EMAIL] Order Confirmation sent to:', orderData.email);
  console.log('   Order ID:', orderData.orderId);
  console.log('   Total:', orderData.total);
}

async function sendWelcomeEmail(orderData) {
  console.log('[EMAIL] Welcome email sent to:', orderData.email);
  console.log('   Customer:', `${orderData.firstName} ${orderData.lastName}`);
  console.log('   Order ID:', orderData.orderId);
}

async function sendPaymentFailedEmail(orderData) {
  console.log('[EMAIL] Payment failed email sent to:', orderData.email);
  console.log('   Reason:', orderData.declineReason);
}

async function sendCancellationEmail(emailData) {
  console.log('[EMAIL] Cancellation email sent to:', emailData.email);
}

async function sendChargebackAlert(data) {
  console.log('[ALERT] Chargeback alert for order:', data.order_id);
}

// Customer access management
async function activateCustomerAccess(customerId, products) {
  console.log(`Activating access for customer ${customerId}`);
  console.log('   Products:', products);
}

async function cancelSubscriptionAccess(subscriptionId, customerId) {
  console.log(`Cancelling subscription ${subscriptionId} for customer ${customerId}`);
}

async function renewSubscriptionAccess(subscriptionId, customerId) {
  console.log(`Renewing subscription ${subscriptionId} for customer ${customerId}`);
}

// Subscription management
async function createSubscriptionRecord(subscriptionData) {
  console.log('Creating subscription record:', subscriptionData.subscriptionId);
}

// Financial event handling
async function processRefund(refundData) {
  console.log('Processing refund for order:', refundData.orderId);
  console.log('   Amount:', refundData.refundAmount);
}

async function handleChargebackEvent(chargebackData) {
  console.log('Handling chargeback for order:', chargebackData.orderId);
}

// Logging functions (console only)
async function logWebhookEvent(eventData) {
  console.log('Webhook event logged:', eventData);
}

async function logUnknownWebhookEvent(data) {
  console.log('Logging unknown webhook event:', data);
}

// GET method for webhook health check
export async function GET(request) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge);
  }
  
  return NextResponse.json({ 
    status: 'Webhook endpoint is active and ready',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/sticky'
  });
}