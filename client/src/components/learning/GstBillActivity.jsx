import React, { useState } from 'react';

/**
 * Step 4: "Input Tax Credit (ITC)"
 * Interactive ITC scenario — learner sets a buy price and sell price,
 * then sees input GST, output GST, and GST payable calculated live.
 * Demonstrates why ITC avoids the cascading effect.
 */
const GstBillActivity = ({ onComplete }) => {
  const [buyPrice, setBuyPrice] = useState(1000);
  const [sellPrice, setSellPrice] = useState(1500);
  const [hasInteracted, setHasInteracted] = useState(false);
  const gstRate = 18;

  const inputGst = Math.round(buyPrice * gstRate / 100);
  const outputGst = Math.round(sellPrice * gstRate / 100);
  const gstPayable = outputGst - inputGst;

  const handleBuyChange = (e) => {
    setBuyPrice(Number(e.target.value));
    markInteracted();
  };

  const handleSellChange = (e) => {
    setSellPrice(Number(e.target.value));
    markInteracted();
  };

  const markInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (onComplete) setTimeout(onComplete, 600);
    }
  };

  return (
    <div className="interactive-container" style={{ gap: 16 }}>
      <div className="instruction-badge">
        {!hasInteracted ? '👆 Adjust buy and sell prices!' : '✨ You discovered Input Tax Credit!'}
      </div>

      {/* Scenario header */}
      <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--clr-text-soft)', maxWidth: 420, lineHeight: 1.5 }}>
        A shopkeeper buys goods and sells them at a higher price. Both transactions have <strong style={{ color: '#FF7E67' }}>18% GST</strong>. How much GST does the shopkeeper owe?
      </div>

      {/* Sliders */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        {/* Buy price slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>🛒 Buy Price</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#3182CE' }}>₹{buyPrice.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range" min={500} max={5000} step={100}
            value={buyPrice} onChange={handleBuyChange}
            style={{ width: '100%', accentColor: '#3182CE', cursor: 'pointer' }}
          />
        </div>

        {/* Sell price slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>💰 Sell Price</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2ea043' }}>₹{sellPrice.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range" min={500} max={10000} step={100}
            value={sellPrice} onChange={handleSellChange}
            style={{ width: '100%', accentColor: '#2ea043', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* ITC Calculation visual */}
      <div style={{
        width: '100%', maxWidth: 420, background: 'white', borderRadius: 16,
        padding: '18px 22px', border: '2px solid #e2e8f0', marginTop: 4
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Input GST */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3182CE' }}>
              Input GST (paid on buy)
            </span>
            <span style={{ fontWeight: 700, color: '#3182CE' }}>
              ₹{inputGst.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '1.4rem', color: 'var(--clr-text-soft)', fontWeight: 800 }}>−</div>

          {/* Output GST */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2ea043' }}>
              Output GST (collected on sell)
            </span>
            <span style={{ fontWeight: 700, color: '#2ea043' }}>
              ₹{outputGst.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ borderTop: '2px solid #e2e8f0', margin: '4px 0' }} />

          {/* GST Payable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--clr-text)' }}>
              GST Payable
            </span>
            <span style={{ 
              fontWeight: 800, fontSize: '1.3rem',
              color: gstPayable >= 0 ? '#FF7E67' : '#E53E3E'
            }}>
              ₹{gstPayable.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 10,
          background: '#f7fafc', fontSize: '0.85rem', color: 'var(--clr-text-soft)',
          textAlign: 'center', fontWeight: 600, lineHeight: 1.5
        }}>
          GST Payable = Output GST − Input GST
          <br />
          {gstPayable >= 0
            ? `The shopkeeper pays only ₹${gstPayable.toLocaleString('en-IN')} to the government — not the full ₹${outputGst.toLocaleString('en-IN')}.`
            : 'Sell price is lower than buy price — the shopkeeper gets a GST refund!'
          }
        </div>
      </div>
    </div>
  );
};

export default GstBillActivity;
