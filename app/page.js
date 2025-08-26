'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState('checkout'); // 'checkout' or 'upsells'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const [selectedUpsells, setSelectedUpsells] = useState([]);
  
  const [formData, setFormData] = useState({
    // Customer Information
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
    phone: '5555551234',
    
    // Billing Address
    billingAddress: '123 Test St',
    billingCity: 'Los Angeles',
    billingState: 'CA',
    billingZip: '90001',
    billingCountry: 'US',
    
    // Payment Information
    cardNumber: '1444444444444440', // Test Success Card
    cardExpMonth: '12',
    cardExpYear: '25',
    cardCvv: '123'
  });

  // Your exact Sticky.io products
  const mainProduct = {
    id: '1',
    name: 'Ninja Boost',
    price: 69.00,
    description: 'Core marketing automation solution'
  };

  const upsellProducts = [
    {
      id: '4',
      name: 'Advanced Setup Fee',
      price: 199.00,
      type: 'one-time',
      description: 'Professional setup and configuration service'
    },
    {
      id: '2',
      name: 'Ninja Power Directories',
      price: 79.00,
      type: 'monthly',
      description: 'Directory listing management across 500+ platforms'
    },
    {
      id: '3',
      name: 'Ninja AI Power Post',
      price: 49.00,
      type: 'monthly',
      description: 'AI-powered content generation and posting'
    }
  ];

  const testCards = [
    { number: '1444444444444440', desc: 'Success' },
    { number: '1444444444444441', desc: 'Decline' },
    { number: '5488549999999804', desc: 'Gateway Decline' },
    { number: '5500000000000004', desc: 'Gateway Decline' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setStep('upsells');
  };

  const toggleUpsell = (productId) => {
    setSelectedUpsells(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const calculateTotal = () => {
    let total = mainProduct.price;
    selectedUpsells.forEach(id => {
      const product = upsellProducts.find(p => p.id === id);
      if (product) total += product.price;
    });
    return total;
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare all products for single order
      const products = [
        { id: mainProduct.id, price: mainProduct.price.toFixed(2) }
      ];
      
      selectedUpsells.forEach(id => {
        const product = upsellProducts.find(p => p.id === id);
        if (product) {
          products.push({ id: product.id, price: product.price.toFixed(2) });
        }
      });

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          products: products,
          totalAmount: calculateTotal().toFixed(2)
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Checkout failed');
      }

      setOrderResponse(data);
      setSuccess(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success && orderResponse) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', maxWidth: '600px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#4CAF50', marginBottom: '20px' }}>Order Successful!</h1>
          <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px' }}>
            Thank you for your purchase!
          </p>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'left' }}>
            <p><strong>Order ID:</strong> {orderResponse.orderId}</p>
            <p><strong>Total:</strong> ${calculateTotal().toFixed(2)}</p>
            <p><strong>Products:</strong></p>
            <ul>
              <li>{mainProduct.name} - ${mainProduct.price.toFixed(2)}</li>
              {selectedUpsells.map(id => {
                const product = upsellProducts.find(p => p.id === id);
                return product ? <li key={id}>{product.name} - ${product.price.toFixed(2)}</li> : null;
              })}
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Upsells
  if (step === 'upsells') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Success Banner */}
          <div style={{ backgroundColor: '#4CAF50', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>🎉 Great Choice!</h2>
            <p style={{ margin: '10px 0 0 0' }}>Your Ninja Boost order is ready. Add these powerful upgrades:</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
              🚀 Maximize Your Results
            </h2>

            {/* Upsell Products */}
            <div style={{ marginBottom: '30px' }}>
              {upsellProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => toggleUpsell(product.id)}
                  style={{
                    padding: '20px',
                    marginBottom: '15px',
                    border: '2px solid',
                    borderColor: selectedUpsells.includes(product.id) ? '#667eea' : '#e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedUpsells.includes(product.id) ? '#f0f4ff' : 'white',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUpsells.includes(product.id)}
                        onChange={() => toggleUpsell(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{product.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{product.description}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                        ${product.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {product.type === 'one-time' ? 'one-time' : '/month'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Order Summary:</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Ninja Boost (Main Product)</span>
                <span>${mainProduct.price.toFixed(2)}</span>
              </div>
              {selectedUpsells.map(id => {
                const product = upsellProducts.find(p => p.id === id);
                return product ? (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>{product.name}</span>
                    <span>${product.price.toFixed(2)}</span>
                  </div>
                ) : null;
              })}
              <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '18px',
                  backgroundColor: loading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : `Complete Order - $${calculateTotal().toFixed(2)}`}
              </button>
              
              {!loading && (
                <button
                  onClick={handleFinalSubmit}
                  style={{
                    padding: '15px 30px',
                    fontSize: '16px',
                    backgroundColor: 'transparent',
                    color: '#666',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Skip Upgrades
                </button>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '6px' }}>
                <strong style={{ color: '#c62828' }}>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Main Checkout
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#333', marginBottom: '30px' }}>Secure Checkout</h1>
          
          <form onSubmit={handleCheckoutSubmit}>
            {/* Product Display */}
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%)', borderRadius: '8px', marginBottom: '25px', border: '2px solid #667eea' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{mainProduct.name}</h2>
              <p style={{ margin: '0 0 15px 0', color: '#666' }}>{mainProduct.description}</p>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                ${mainProduct.price.toFixed(2)}<span style={{ fontSize: '16px', color: '#666' }}>/month</span>
              </div>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Customer Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Billing Address</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="text"
                  name="billingAddress"
                  placeholder="Street Address"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                  <input
                    type="text"
                    name="billingCity"
                    placeholder="City"
                    value={formData.billingCity}
                    onChange={handleInputChange}
                    required
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    name="billingState"
                    placeholder="State"
                    value={formData.billingState}
                    onChange={handleInputChange}
                    required
                    maxLength="2"
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    name="billingZip"
                    placeholder="ZIP"
                    value={formData.billingZip}
                    onChange={handleInputChange}
                    required
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Payment Information</h3>
              
              {/* Test Card Selector */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#856404' }}>
                  Test Card Selection:
                </label>
                <select
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #ffc107', borderRadius: '4px' }}
                >
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
                  style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
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
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    name="cardExpYear"
                    placeholder="YY"
                    value={formData.cardExpYear}
                    onChange={handleInputChange}
                    required
                    maxLength="2"
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    name="cardCvv"
                    placeholder="CVV"
                    value={formData.cardCvv}
                    onChange={handleInputChange}
                    required
                    maxLength="4"
                    style={{ padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '18px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Continue to Special Offers →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}