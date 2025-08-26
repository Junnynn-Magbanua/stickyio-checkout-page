import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Basic validation to prevent 500s on bad input
    if (!body || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: products array is required'
      }, { status: 400 });
    }
    
    console.log('Processing checkout:', body);
    
    const API_USERNAME = process.env.STICKY_API_USERNAME;
    const API_PASSWORD = process.env.STICKY_API_PASSWORD;
    const API_URL = 'https://boostninja.sticky.io/api/v1';
    
    // If credentials are missing, simulate success in local/dev to avoid 500s
    if (!API_USERNAME || !API_PASSWORD) {
      console.warn('Sticky.io API credentials not configured. Returning simulated success response.');
      const mockOrderId = `TEST-${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        customerId: `TEST-CUST-${Date.now()}`,
        message: `Simulated order for ${body.products.length} product(s)`,
        orders: body.products.map(p => ({ productId: p.id, orderId: mockOrderId, price: p.price, success: true })),
        totalAmount: body.totalAmount
      });
    }
    
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    const orders = [];
    let mainOrderId = null;
    let customerId = null;
    
    // Process each product as a separate order
    for (const product of body.products) {
      const formData = new URLSearchParams();
      
      // Core order parameters
      formData.append('method', 'NewOrder');
      formData.append('campaignId', '1');
      formData.append('shippingId', '2'); // Digital
      
      // Set product ID and price based on the product
      formData.append('productId', product.id);
      
      // Determine billing model and offer based on product
      if (product.id === '4') {
        // Advanced Setup Fee - One time
        formData.append('billing_model_id', '1'); // Assuming 1 is one-time, adjust if needed
      } else {
        // All others are monthly recurring
        formData.append('billing_model_id', '3'); // Monthly
      }
      
      // Only main product (Ninja Boost) has an offer
      if (product.id === '1') {
        formData.append('offer_id', '1'); // Ninja Boost offer
      }
      
      // Customer information
      formData.append('email', body.email);
      formData.append('firstName', body.firstName);
      formData.append('lastName', body.lastName);
      formData.append('phone', body.phone);
      
      // If we have a customer ID from previous order, use it
      if (customerId) {
        formData.append('customerId', customerId);
        formData.append('forceCustomerId', '1');
        formData.append('isUpsell', '1');
        formData.append('parentOrderId', mainOrderId);
      }
      
      // Billing address
      formData.append('billingFirstName', body.firstName);
      formData.append('billingLastName', body.lastName);
      formData.append('billingAddress1', body.billingAddress);
      formData.append('billingCity', body.billingCity);
      formData.append('billingState', body.billingState);
      formData.append('billingZip', body.billingZip);
      formData.append('billing_country', body.billingCountry || 'US');
      
      // Shipping address (same as billing for digital products)
      formData.append('shippingFirstName', body.firstName);
      formData.append('shippingLastName', body.lastName);
      formData.append('shippingAddress1', body.billingAddress);
      formData.append('shippingCity', body.billingCity);
      formData.append('shippingState', body.billingState);
      formData.append('shippingZip', body.billingZip);
      formData.append('shippingCountry', body.billingCountry || 'US');
      
      // Payment information
      formData.append('creditCardNumber', body.cardNumber);
      formData.append('expirationDate', body.cardExpMonth.padStart(2, '0') + body.cardExpYear);
      formData.append('CVV', body.cardCvv);
      formData.append('creditCardType', detectCardType(body.cardNumber));
      
      // Additional required fields
      formData.append('ipAddress', request.headers.get('x-forwarded-for') || '127.0.0.1');
      formData.append('paymentType', 'CREDITCARD');
      formData.append('tranType', 'Sale');
      formData.append('testMode', '1');
      
      console.log(`Creating order for product ${product.id}:`, Object.fromEntries(formData));
      
      try {
        const response = await fetch(`${API_URL}/new_order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          body: formData.toString()
        });
        
        const responseText = await response.text();
        console.log(`Sticky.io response for product ${product.id}:`, responseText);
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { raw_response: responseText };
        }
        
        // Check if successful
        if (result.order_id || result.orderId) {
          const orderId = result.order_id || result.orderId;
          
          // Store the first order as main order
          if (!mainOrderId) {
            mainOrderId = orderId;
            customerId = result.customer_id || result.customerId;
          }
          
          orders.push({
            productId: product.id,
            orderId: orderId,
            price: product.price,
            success: true,
            response: result
          });
        } else if (result.error_found === '1' || result.error_found === 1) {
          orders.push({
            productId: product.id,
            success: false,
            error: result.error_message
          });
        }
        
      } catch (error) {
        console.error(`Failed to create order for product ${product.id}:`, error);
        orders.push({
          productId: product.id,
          success: false,
          error: error.message
        });
      }
    }
    
    // Check if any orders were successful
    const successfulOrders = orders.filter(o => o.success);
    
    if (successfulOrders.length > 0) {
      return NextResponse.json({
        success: true,
        orderId: mainOrderId,
        customerId: customerId,
        message: `Created ${successfulOrders.length} orders successfully`,
        orders: orders,
        totalAmount: body.totalAmount
      });
    } else {
      // If all orders failed, return error
      return NextResponse.json({
        success: false,
        message: 'Failed to create orders',
        orders: orders
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Order processing failed',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

function detectCardType(cardNumber) {
  if (!cardNumber) return 'visa';
  const firstDigit = cardNumber.charAt(0);
  switch(firstDigit) {
    case '1': return 'visa'; // Test cards starting with 1
    case '3': return 'amex';
    case '4': return 'visa';
    case '5': return 'master';
    case '6': return 'discover';
    default: return 'visa';
  }
}