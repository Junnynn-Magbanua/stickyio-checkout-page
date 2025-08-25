// This file is now optional since we're handling the API directly in the route
// You can delete this file to reduce the project files further

import axios from 'axios';

const STICKY_API_URL = process.env.STICKY_API_URL || 'https://boostninja.sticky.io/api/v1';
const API_USERNAME = process.env.STICKY_API_USERNAME;
const API_PASSWORD = process.env.STICKY_API_PASSWORD;

export async function createOrder(orderData) {
  try {
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
    const response = await fetch(`${STICKY_API_URL}/new_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error_message || result.message || 'Order creation failed');
    }
    
    return {
      success: true,
      orderId: result.order_id,
      customerId: result.customer_id,
      status: result.response_code,
      message: result.message,
      data: result
    };
    
  } catch (error) {
    console.error('Sticky.io API Error:', error);
    throw error;
  }
}