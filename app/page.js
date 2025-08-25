'use client';
import { useState } from 'react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    // Product Selection
    productId: '1', // Ninja Boost
    
    // Customer Information
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
    phone: '5555551234',
    
    // Billing Address
    billingAddress: '123 Test St',
    billingCity: 'Test City',
    billingState: 'CA',
    billingZip: '90001',
    billingCountry: 'US',
    
    // Payment Information
    cardNumber: '1444444444444440', // Test Success Card
    cardExpMonth: '12',
    cardExpYear: '2025',
    cardCvv: '123',
    
    // Order Details
    shippingId: '2', // Digital
    offerId: '1', // Ninja Boost Standard
    billingModelId: '3', // Monthly
    campaignId: '1',
    tranType: 'Sale'
  });

  const products = [
    { id: '1', name: 'Ninja Boost', price: 69.00 },
    { id: '2', name: 'Ninja Power Directories', price: 79.00 },
    { id: '3', name: 'Ninja AI Power Post', price: 49.00 },
    { id: '4', name: 'Advanced Setup Fee', price: 199.00 }
  ];

  const testCards = [
    { number: '1444444444444440', desc: 'Success' },
    { number: '1444444444444441', desc: 'Decline' },
    { number: '5488549999999804', desc: 'Gateway Decline' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Sticky.io Test Checkout</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Product Selection */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Product Selection</h2>
          <select
            name="productId"
            value={formData.productId}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Information */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Customer Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Billing Address</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              name="billingAddress"
              placeholder="Street Address"
              value={formData.billingAddress}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
              <input
                type="text"
                name="billingCity"
                placeholder="City"
                value={formData.billingCity}
                onChange={handleInputChange}
                required
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="text"
                name="billingState"
                placeholder="State"
                value={formData.billingState}
                onChange={handleInputChange}
                required
                maxLength="2"
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="text"
                name="billingZip"
                placeholder="ZIP"
                value={formData.billingZip}
                onChange={handleInputChange}
                required
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Payment Information</h2>
          
          {/* Test Card Quick Select */}
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
              Quick Test Card Selection:
            </label>
            <select
              onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Select a test card...</option>
              {testCards.map(card => (
                <option key={card.number} value={card.number}>
                  {card.number} - {card.desc}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={handleInputChange}
              required
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <input
                type="text"
                name="cardExpMonth"
                placeholder="MM"
                value={formData.cardExpMonth}
                onChange={handleInputChange}
                required
                maxLength="2"
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="text"
                name="cardExpYear"
                placeholder="YYYY"
                value={formData.cardExpYear}
                onChange={handleInputChange}
                required
                maxLength="4"
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                type="text"
                name="cardCvv"
                placeholder="CVV"
                value={formData.cardCvv}
                onChange={handleInputChange}
                required
                maxLength="4"
                style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Processing...' : 'Process Test Order'}
        </button>
      </form>

      {/* Response Display */}
      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', border: '1px solid #ef5350', borderRadius: '4px' }}>
          <h3 style={{ color: '#c62828', margin: '0 0 10px 0' }}>Error:</h3>
          <pre style={{ color: '#c62828', margin: 0 }}>{error}</pre>
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', border: '1px solid #66bb6a', borderRadius: '4px' }}>
          <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Success!</h3>
          <pre style={{ color: '#2e7d32', margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}