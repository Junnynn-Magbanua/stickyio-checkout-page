import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Main webhook handler - handles all Sticky.io webhook events
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-sticky-signature') || 
                     request.headers.get('x-webhook-signature');
    
    console.log('🎯 Webhook received:', {
      signature: signature ? 'Present' : 'Missing',
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    // Verify webhook signature (optional but recommended for production)
    if (process.env.STICKY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.STICKY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature && signature !== `sha256=${expectedSignature}`) {
        console.error('❌ Webhook signature verification failed');
        console.error('Expected:', expectedSignature);
        console.error('Received:', signature);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified');
    }

    // Parse the webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
      console.log('📥 Parsed JSON webhook data:', webhookData);
    } catch (e) {
      // Handle form-encoded data if JSON parsing fails
      console.log('📥 Parsing as form data...');
      const params = new URLSearchParams(body);
      webhookData = Object.fromEntries(params);
      console.log('📥 Parsed form webhook data:', webhookData);
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

    console.log(`🎯 Processing webhook event: ${eventType} for order: ${orderId}`);

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
        console.log(`⚠️ Unhandled webhook event: ${eventType}`, webhookData);
        await handleUnknownEvent(webhookData);
    }

    // Log webhook event to your system
    await logWebhookEvent({
      eventType,
      orderId,
      customerId,
      data: webhookData,
      processedAt: new Date().toISOString()
    });

    console.log(`✅ Webhook ${eventType} processed successfully`);

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${eventType} processed successfully`,
      orderId,
      customerId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Stack trace:', error.stack);
    
    // Return success to prevent Sticky.io from retrying on our internal errors
    // Change to status: 500 if you want Sticky.io to retry failed webhooks
    return NextResponse.json({ 
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Use 500 if you want retries
  }
}

// Handle successful order creation
async function handleOrderCreated(data) {
  console.log('🆕 Processing order created:', data.order_id || data.id);
  
  try {
    // Your business logic here:
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

    // Send order confirmation email
    if (orderData.email) {
      await sendConfirmationEmail(orderData);
    }
    
    // Update order status in your system
    await updateOrderStatus(orderData.orderId, 'created', data);
    
    console.log(`✅ Order created webhook processed: ${orderData.orderId}`);
  } catch (error) {
    console.error('❌ Error processing order created:', error);
    throw error;
  }
}

// Handle successful payment
async function handleOrderSuccess(data) {
  console.log('💰 Processing successful order:', data.order_id || data.id);
  
  try {
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
    
    console.log(`✅ Order success webhook processed: ${orderData.orderId}`);
  } catch (error) {
    console.error('❌ Error processing order success:', error);
    throw error;
  }
}

// Handle declined order
async function handleOrderDeclined(data) {
  console.log('❌ Processing declined order:', data.order_id || data.id);
  
  try {
    const orderData = {
      orderId: data.order_id || data.id,
      customerId: data.customer_id || data.customerId,
      email: data.email_address || data.email,
      firstName: data.first_name || data.firstName,
      lastName: data.last_name || data.lastName,
      declineReason: data.decline_reason || data.reason || 'Payment failed',
      status: 'declined'
    };

    // Send payment failed email
    if (orderData.email) {
      await sendPaymentFailedEmail(orderData);
    }
    
    // Update order status
    await updateOrderStatus(orderData.orderId, 'declined', data);
    
    console.log(`✅ Order declined webhook processed: ${orderData.orderId}`);
  } catch (error) {
    console.error('❌ Error processing order declined:', error);
    throw error;
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(data) {
  console.log('🔄 Processing subscription created:', data.subscription_id);
  
  try {
    await createSubscriptionRecord({
      subscriptionId: data.subscription_id,
      customerId: data.customer_id,
      productId: data.product_id,
      billingCycle: data.billing_cycle,
      nextBillDate: data.next_bill_date
    });
    
    console.log(`✅ Subscription created webhook processed: ${data.subscription_id}`);
  } catch (error) {
    console.error('❌ Error processing subscription created:', error);
    throw error;
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(data) {
  console.log('🚫 Processing subscription cancelled:', data.subscription_id);
  
  try {
    await cancelSubscriptionAccess(data.subscription_id, data.customer_id);
    
    if (data.email_address) {
      await sendCancellationEmail({
        email: data.email_address,
        subscriptionId: data.subscription_id,
        customerName: `${data.first_name} ${data.last_name}`,
        endDate: data.cancellation_date
      });
    }
    
    console.log(`✅ Subscription cancelled webhook processed: ${data.subscription_id}`);
  } catch (error) {
    console.error('❌ Error processing subscription cancellation:', error);
    throw error;
  }
}

// Handle subscription renewal
async function handleSubscriptionRenewed(data) {
  console.log('🔄 Processing subscription renewal:', data.subscription_id);
  
  try {
    await renewSubscriptionAccess(data.subscription_id, data.customer_id);
    console.log(`✅ Subscription renewed webhook processed: ${data.subscription_id}`);
  } catch (error) {
    console.error('❌ Error processing subscription renewal:', error);
    throw error;
  }
}

// Handle refund
async function handleRefundIssued(data) {
  console.log('💸 Processing refund:', data.order_id);
  
  try {
    await processRefund({
      orderId: data.order_id,
      customerId: data.customer_id,
      refundAmount: data.refund_amount,
      refundReason: data.refund_reason
    });
    
    console.log(`✅ Refund webhook processed: ${data.order_id}`);
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    throw error;
  }
}

// Handle chargeback
async function handleChargeback(data) {
  console.log('⚠️ Processing chargeback:', data.order_id);
  
  try {
    await handleChargebackEvent({
      orderId: data.order_id,
      customerId: data.customer_id,
      chargebackAmount: data.chargeback_amount,
      chargebackReason: data.chargeback_reason
    });
    
    // Send alert to your team
    await sendChargebackAlert(data);
    
    console.log(`✅ Chargeback webhook processed: ${data.order_id}`);
  } catch (error) {
    console.error('❌ Error processing chargeback:', error);
    throw error;
  }
}

// Handle void
async function handleVoid(data) {
  console.log('🚫 Processing void:', data.order_id);
  await updateOrderStatus(data.order_id, 'voided', data);
}

// Handle cancel
async function handleCancel(data) {
  console.log('❌ Processing cancel:', data.order_id);
  await updateOrderStatus(data.order_id, 'cancelled', data);
}

// Handle unknown events
async function handleUnknownEvent(data) {
  console.log('❓ Processing unknown webhook event:', data);
  await logUnknownWebhookEvent(data);
}

// ========== HELPER FUNCTIONS ==========

// Simple file-based storage (replace with your database)
async function updateOrderStatus(orderId, status, data) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'orders.json');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let orders = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      orders = JSON.parse(fileContent);
    }
    
    // Update or add order
    const existingIndex = orders.findIndex(order => order.orderId === orderId);
    const orderUpdate = {
      orderId,
      status,
      updatedAt: new Date().toISOString(),
      customerEmail: data.email_address || data.email,
      customerName: `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim(),
      total: data.total_amount || data.amount || data.total,
      products: data.products || [],
      rawData: data
    };
    
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...orderUpdate };
    } else {
      orders.push(orderUpdate);
    }
    
    fs.writeFileSync(logFile, JSON.stringify(orders, null, 2));
    console.log(`📝 Order ${orderId} status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
  }
}

// Email functions (basic console logging - replace with real email service)
async function sendConfirmationEmail(orderData) {
  console.log('📧 [EMAIL] Order Confirmation sent to:', orderData.email);
  console.log('   Order ID:', orderData.orderId);
  console.log('   Total:', orderData.total);
  // TODO: Implement real email sending (SendGrid, AWS SES, etc.)
}

async function sendWelcomeEmail(orderData) {
  console.log('📧 [EMAIL] Welcome email sent to:', orderData.email);
  console.log('   Customer:', `${orderData.firstName} ${orderData.lastName}`);
  console.log('   Order ID:', orderData.orderId);
  // TODO: Implement real email sending
}

async function sendPaymentFailedEmail(orderData) {
  console.log('📧 [EMAIL] Payment failed email sent to:', orderData.email);
  console.log('   Reason:', orderData.declineReason);
  // TODO: Implement real email sending
}

async function sendCancellationEmail(emailData) {
  console.log('📧 [EMAIL] Cancellation email sent to:', emailData.email);
  // TODO: Implement real email sending
}

async function sendChargebackAlert(data) {
  console.log('🚨 [ALERT] Chargeback alert for order:', data.order_id);
  // TODO: Send alert to admin/team
}

// Customer access management
async function activateCustomerAccess(customerId, products) {
  console.log(`🔓 Activating access for customer ${customerId}`);
  console.log('   Products:', products);
  // TODO: Implement customer access activation
}

async function cancelSubscriptionAccess(subscriptionId, customerId) {
  console.log(`🔒 Cancelling subscription ${subscriptionId} for customer ${customerId}`);
  // TODO: Implement subscription cancellation
}

async function renewSubscriptionAccess(subscriptionId, customerId) {
  console.log(`🔄 Renewing subscription ${subscriptionId} for customer ${customerId}`);
  // TODO: Implement subscription renewal
}

// Subscription management
async function createSubscriptionRecord(subscriptionData) {
  console.log('📝 Creating subscription record:', subscriptionData.subscriptionId);
  // TODO: Store subscription in database
}

// Financial event handling
async function processRefund(refundData) {
  console.log('💸 Processing refund for order:', refundData.orderId);
  console.log('   Amount:', refundData.refundAmount);
  // TODO: Handle refund processing
}

async function handleChargebackEvent(chargebackData) {
  console.log('⚠️ Handling chargeback for order:', chargebackData.orderId);
  // TODO: Handle chargeback processing
}

// Logging functions
async function logWebhookEvent(eventData) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'webhook-events.json');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let events = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      events = JSON.parse(fileContent);
    }
    
    events.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventData
    });
    
    // Keep only last 1000 events
    if (events.length > 1000) {
      events = events.slice(-1000);
    }
    
    fs.writeFileSync(logFile, JSON.stringify(events, null, 2));
    console.log('📝 Webhook event logged:', eventData.eventType);
  } catch (error) {
    console.error('❌ Error logging webhook event:', error);
  }
}

async function logUnknownWebhookEvent(data) {
  console.log('❓ Logging unknown webhook event:', data);
  // TODO: Log unknown events for investigation.
}

// GET method for webhook health check
export async function GET(request) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get('challenge');
  
  // Handle verification challenges from webhook providers
  if (challenge) {
    return new Response(challenge);
  }
  
  return NextResponse.json({ 
    status: '✅ Webhook endpoint is active and ready',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/sticky'
  });
}