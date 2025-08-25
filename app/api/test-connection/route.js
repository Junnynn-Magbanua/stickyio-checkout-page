import { NextResponse } from 'next/server';

export async function POST() {
  const API_USERNAME = process.env.STICKY_API_USERNAME;
  const API_PASSWORD = process.env.STICKY_API_PASSWORD;
  
  if (!API_USERNAME || !API_PASSWORD) {
    return NextResponse.json({
      error: 'API credentials not found in environment variables',
      username: API_USERNAME ? 'Found' : 'Missing',
      password: API_PASSWORD ? 'Found' : 'Missing'
    });
  }
  
  const tests = [];
  
  // Test different API endpoints
  const endpoints = [
    'https://boostninja.sticky.io/api/v1/campaign_find',
    'https://boostninja.sticky.io/api/v1/product_index',
    'https://api.sticky.io/api/v1/campaign_find',
    'https://boostninja.stickystage.io/api/v1/campaign_find'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ start_date: '2025-01-01', end_date: '2025-12-31' })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      
      tests.push({
        endpoint,
        status: response.status,
        success: response.ok,
        response: data
      });
    } catch (error) {
      tests.push({
        endpoint,
        error: error.message
      });
    }
  }
  
  return NextResponse.json({
    credentials: {
      username: API_USERNAME,
      passwordLength: API_PASSWORD.length
    },
    tests
  });
}
