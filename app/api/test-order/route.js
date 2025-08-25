import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const API_USERNAME = process.env.STICKY_API_USERNAME;
    const API_PASSWORD = process.env.STICKY_API_PASSWORD;
    
    // Build proper form data
    const formData = new URLSearchParams();
    formData.append('method', 'NewOrder');
    formData.append('campaignId', '1');
    formData.append('shippingId', '2');
    formData.append('productId', '1');
    formData.append('firstName', 'Test');
    formData.append('lastName', 'User');
    formData.append('email', 'test@example.com');  // FIXED: email_address
    formData.append('phone_number', '5555551234');
    formData.append('billing_first_name', 'Test');
    formData.append('billing_last_name', 'User');
    formData.append('billing_address_1', '123 Test St');  // FIXED: billing_address_1
    formData.append('billing_city', 'Los Angeles');
    formData.append('billing_state', 'CA');
    formData.append('billing_zip', '90001');
    formData.append('billing_country', 'US');
    formData.append('shipping_first_name', 'Test');
    formData.append('shipping_last_name', 'User');
    formData.append('shipping_address_1', '123 Test St');  // FIXED: shipping_address_1
    formData.append('shipping_city', 'Los Angeles');
    formData.append('shipping_state', 'CA');
    formData.append('shipping_zip', '90001');
    formData.append('shippingCountry', 'US');
    formData.append('creditCardNumber', '4111111111111111');
    formData.append('expirationDate', '1225');  // MMYY format
    formData.append('cvv', '123');
    formData.append('creditCardType', 'visa');
    formData.append('ipAddress', '127.0.0.1');
    formData.append('tranType', 'Sale');
    formData.append('test_mode', '1');
    
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
    const response = await fetch('https://boostninja.sticky.io/api/v1/new_order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: formData.toString()
    });
    
    const result = await response.text();
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      parsedResult = result;
    }
    
    return NextResponse.json({
      formDataSent: Object.fromEntries(formData),
      response: parsedResult,
      status: response.status
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}