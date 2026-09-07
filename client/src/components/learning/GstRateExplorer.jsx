import React, { useState } from 'react';

/**
 * Step 3: "Calculating GST Amount"
 * Interactive rate explorer — learner picks a product and a GST rate,
 * then sees a step-by-step animated breakdown: base → GST → CGST/SGST → total.
 */
const products = [
  { name: 'Notebook', emoji: '📓', price: 100 },
  { name: 'Shoes', emoji: '👟', price: 2000 },
  { name: 'Laptop', emoji: '💻', price: 50000 },
  { name: 'AC', emoji: '❄️', price: 35000 },
];

const rates = [5, 12, 18, 28];

const GstRateExplorer = ({ onComplete }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  const product = products[selectedProduct];
  const showCalc = product && selectedRate !== null;

  const gstAmount = showCalc ? Math.round(product.price * selectedRate / 100) : 0;
  const cgst = showCalc ? gstAmount / 2 : 0;
  const sgst = showCalc ? gstAmount / 2 : 0;
  const total = showCalc ? product.price + gstAmount : 0;

  const handleRateSelect = (rate) => {
    setSelectedRate(rate);
    if (!hasCompleted && selectedProduct !== null) {
      setHasCompleted(true);
      if (onComplete) setTimeout(onComplete, 800);
    }
  };

  const handleProductSelect = (idx) => {
    setSelectedProduct(idx);
    setSelectedRate(null);
    setHasCompleted(false);
  };

  return (
    <div className="interactive-container" style={{ gap: 16 }}>
      {/* Product selection */}
      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--clr-text)' }}>Pick a product:</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {products.map((p, i) => (
          <button
            key={i}
            onClick={() => handleProductSelect(i)}
            style={{
              padding: '12px 18px', borderRadius: 14, border: selectedProduct === i ? '3px solid #3182CE' : '2px solid #e2e8f0',
              background: selectedProduct === i ? '#ebf8ff' : 'white', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s', minWidth: 90
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>{p.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-text)' }}>{p.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>₹{p.price.toLocaleString('en-IN')}</span>
          </button>
        ))}
      </div>

      {/* Rate selection */}
      {selectedProduct !== null && (
        <div className="fade-in" style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: 8, textAlign: 'center' }}>
            Choose GST rate:
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {rates.map(r => (
              <button
                key={r}
                onClick={() => handleRateSelect(r)}
                style={{
                  padding: '10px 20px', borderRadius: 30, fontWeight: 800, fontSize: '1.1rem',
                  border: selectedRate === r ? '3px solid #FF7E67' : '2px solid #e2e8f0',
                  background: selectedRate === r ? '#FFF5F5' : 'white', color: selectedRate === r ? '#FF7E67' : 'var(--clr-text)',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: 56
                }}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-step calculation */}
      {showCalc && (
        <div className="fade-in" style={{
          marginTop: 12, background: 'white', borderRadius: 16, padding: '20px 24px',
          border: '2px solid #e2e8f0', width: '100%', maxWidth: 400
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: 'var(--clr-text)', textAlign: 'center' }}>
            {product.emoji} {product.name} — GST Calculation
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Base Price" value={`₹${product.price.toLocaleString('en-IN')}`} />
            <Row label={`GST (${selectedRate}%)`} value={`₹${gstAmount.toLocaleString('en-IN')}`} highlight />
            <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />
            <Row label="CGST (half)" value={`₹${cgst.toLocaleString('en-IN')}`} sub />
            <Row label="SGST (half)" value={`₹${sgst.toLocaleString('en-IN')}`} sub />
            <div style={{ borderTop: '2px solid #e2e8f0', margin: '4px 0' }} />
            <Row label="Total Price" value={`₹${total.toLocaleString('en-IN')}`} bold />
          </div>

          {/* Formula reminder */}
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: '#f7fafc', fontSize: '0.85rem', color: 'var(--clr-text-soft)',
            textAlign: 'center', fontWeight: 600
          }}>
            GST = Base Price × Rate ÷ 100
          </div>
        </div>
      )}
    </div>
  );
};

/** Small presentational row */
const Row = ({ label, value, highlight, bold, sub }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingLeft: sub ? 16 : 0
  }}>
    <span style={{
      fontSize: sub ? '0.85rem' : '0.95rem',
      fontWeight: bold ? 800 : 600,
      color: highlight ? '#FF7E67' : sub ? 'var(--clr-text-soft)' : 'var(--clr-text)'
    }}>
      {label}
    </span>
    <span style={{
      fontSize: sub ? '0.85rem' : bold ? '1.2rem' : '0.95rem',
      fontWeight: bold ? 800 : 700,
      color: highlight ? '#FF7E67' : bold ? '#2ea043' : 'var(--clr-text)'
    }}>
      {value}
    </span>
  </div>
);

export default GstRateExplorer;
