import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('Received checkout request:', body);
    
    const API_USERNAME = process.env.STICKY_API_USERNAME;
    const API_PASSWORD = process.env.STICKY_API_PASSWORD;
    const API_URL = 'https://boostninja.sticky.io/api/v1';
    
    if (!API_USERNAME || !API_PASSWORD) {
      throw new Error('API credentials not configured');
    }
    
    // Build form data with CORRECT field names for Sticky.io v1
    const formData = new URLSearchParams();
    
    // CRITICAL: Use exact field names that Sticky.io expects
    formData.append('method', 'NewOrder');
    formData.append('campaignId', body.campaignId || '1');
    formData.append('shippingId', body.shippingId || '2');
    formData.append('productId', body.productId || '1');
    
    // Customer information - note the exact field names
    formData.append('firstName', body.firstName);
    formData.append('lastName', body.lastName);
    formData.append('email', body.email);  // Note: email_address not emailAddress
    formData.append('phone_number', body.phone);
    
    // Billing address
    formData.append('billing_first_name', body.firstName);
    formData.append('billing_last_name', body.lastName);
    formData.append('billing_address_1', body.billingAddress);
    formData.append('billing_city', body.billingCity);
    formData.append('billing_state', body.billingState);
    formData.append('billing_zip', body.billingZip);
    formData.append('billing_country', body.billingCountry || 'US');
    
    // Shipping address (same as billing for digital)
    formData.append('shipping_first_name', body.firstName);
    formData.append('shipping_last_name', body.lastName);
    formData.append('shipping_address_1', body.billingAddress);
    formData.append('shipping_city', body.billingCity);
    formData.append('shipping_state', body.billingState);
    formData.append('shipping_zip', body.billingZip);
    formData.append('shippingCountry', body.billingCountry || 'US');
    
    // Payment information
    formData.append('creditCardNumber', body.cardNumber);
    formData.append('expirationDate', `${body.cardExpMonth.padStart(2, '0')}${body.cardExpYear.slice(-2)}`);
    formData.append('cvv', body.cardCvv);
    formData.append('CVV', body.cardCvv); // Try alternative field name
    formData.append('creditCardType', detectCardType(body.cardNumber));
    
    // Additional required fields
    formData.append('ipAddress', request.headers.get('x-forwarded-for') || '127.0.0.1');
    formData.append('tranType', 'Sale');
    
    // Optional but useful fields
    formData.append('offer_id', body.offerId || '1');
    formData.append('billing_model_id', body.billingModelId || '3');
    formData.append('test_mode', '1');  // Enable test mode
    
    console.log('Sending to Sticky.io with form data:', Object.fromEntries(formData));
    
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
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
    console.log('Sticky.io raw response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error(`Invalid response from Sticky.io: ${responseText}`);
    }
    
    // Check for Sticky.io specific error codes
    if (result.error_found === '1' || result.error_found === 1) {
      throw new Error(result.error_message || 'Order creation failed');
    }
    
    // Success response
    if (result.response_code === '100' || result.response_code === 100) {
      return NextResponse.json({
        success: true,
        orderId: result.order_id,
        customerId: result.customer_id,
        status: 'approved',
        message: 'Order processed successfully',
        data: result
      });
    }
    
    // Handle other response codes
    return NextResponse.json({
      success: false,
      message: result.response_message || result.error_message || 'Unknown response',
      data: result
    });
    
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
  const firstDigit = cardNumber.charAt(0);
  switch(firstDigit) {
    case '3': return 'amex';
    case '4': return 'visa';
    case '5': return 'master';
    case '6': return 'discover';
    default: return 'visa';
  }
}
