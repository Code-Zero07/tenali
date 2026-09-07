import React, { useState } from 'react';

/**
 * Step 1: "What is GST?"
 * Interactive price tag — learner drags a slider to change the GST rate
 * and watches a product price + GST = Final price update in real time.
 */
const GstPriceTag = ({ onComplete }) => {
  const [rate, setRate] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const basePrice = 1000;

  const gstAmount = Math.round(basePrice * rate / 100);
  const finalPrice = basePrice + gstAmount;

  const handleChange = (e) => {
    const val = Number(e.target.value);
    setRate(val);
    if (!hasInteracted && val > 0) {
      setHasInteracted(true);
      if (onComplete) setTimeout(onComplete, 600);
    }
  };

  // Visual bar proportions
  const maxTotal = basePrice + basePrice * 0.28; // max at 28%
  const basePct = (basePrice / maxTotal) * 100;
  const gstPct = (gstAmount / maxTotal) * 100;

  return (
    <div className="interactive-container">
      <div className="instruction-badge">
        {!hasInteracted ? '👆 Slide to add GST!' : '✨ You added tax to the price!'}
      </div>

      {/* Visual price bar */}
      <div style={{ width: '100%', maxWidth: 420, margin: '20px auto' }}>
        {/* Product info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
          <span style={{ fontSize: '2.2rem' }}>📱</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--clr-text)' }}>Smartphone</span>
        </div>

        {/* Stacked bar */}
        <div style={{ 
          width: '100%', height: 48, borderRadius: 12, overflow: 'hidden', 
          display: 'flex', border: '2px solid #e2e8f0', background: '#f7fafc' 
        }}>
          <div style={{ 
            width: `${basePct}%`, background: '#48BB78', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: 'white', 
            fontWeight: 700, fontSize: '0.85rem', transition: 'width 0.3s',
            minWidth: 60
          }}>
            ₹{basePrice.toLocaleString('en-IN')}
          </div>
          {gstAmount > 0 && (
            <div style={{ 
              width: `${gstPct}%`, background: '#FF7E67', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'white', 
              fontWeight: 700, fontSize: '0.85rem', transition: 'width 0.3s',
              minWidth: gstPct > 3 ? 50 : 0
            }}>
              {gstPct > 5 ? `₹${gstAmount.toLocaleString('en-IN')}` : ''}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, fontSize: '0.85rem' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#48BB78', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} /> Base Price</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#FF7E67', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} /> GST</span>
        </div>

        {/* Slider */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <label style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-text)' }}>
            GST Rate: <span style={{ color: '#FF7E67' }}>{rate}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={rate}
            onChange={handleChange}
            style={{ width: '100%', marginTop: 8, accentColor: '#FF7E67', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>
            <span>0%</span><span>5%</span><span>12%</span><span>18%</span><span>28%</span>
          </div>
        </div>

        {/* Result readout */}
        <div style={{ 
          marginTop: 20, background: 'white', borderRadius: 14, padding: '16px 20px',
          border: '2px solid #e2e8f0', textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)', marginBottom: 4 }}>You pay</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--clr-text)' }}>
            ₹{finalPrice.toLocaleString('en-IN')}
          </div>
          {gstAmount > 0 && (
            <div style={{ fontSize: '0.9rem', color: '#FF7E67', fontWeight: 600, marginTop: 2 }}>
              includes ₹{gstAmount.toLocaleString('en-IN')} GST
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GstPriceTag;
