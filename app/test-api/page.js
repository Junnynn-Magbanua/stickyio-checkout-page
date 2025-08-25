'use client';
import { useState } from 'react';

export default function TestAPI() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testCredentials = async () => {
    setLoading(true);
    setResults({});
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST'
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error.message });
    }
    setLoading(false);
  };

  const testMinimalOrder = async () => {
    setLoading(true);
    setResults({});
    
    const minimalData = {
      // Absolute minimum required fields
      campaignId: '1',
      shippingId: '2',
      productId: '1',
      
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '5555551234',
      
      billingAddress1: '123 Test St',
      billingCity: 'Los Angeles',
      billingState: 'CA',
      billingZip: '90001',
      billingCountry: 'US',
      
      creditCardNumber: '4111111111111111', // Standard Visa test card
      expirationDate: '1225',
      CVV: '123'
    };
    
    try {
      const response = await fetch('/api/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalData)
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Sticky.io API Debug Tests</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testCredentials}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test API Connection
        </button>
        
        <button 
          onClick={testMinimalOrder}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Minimal Order
        </button>
      </div>
      
      {loading && <p>Testing...</p>}
      
      {Object.keys(results).length > 0 && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          overflow: 'auto'
        }}>
          <h3>Results:</h3>
          <code>{JSON.stringify(results, null, 2)}</code>
        </div>
      )}
    </div>
  );
}