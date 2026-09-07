import React, { useState, useEffect } from 'react';

/**
 * Step 2: Numerator & Denominator
 * Learner is asked to "Build 3/5" by shading 3 out of 5 blocks.
 * Demonstrates explicitly what numerator and denominator represent.
 */
const FractionPartsInteractive = ({ onComplete }) => {
  const [shadedBlocks, setShadedBlocks] = useState([false, false, false, false, false]);
  const [success, setSuccess] = useState(false);
  
  const targetNumerator = 3;
  const totalDenominator = 5;

  const currentShaded = shadedBlocks.filter(Boolean).length;

  useEffect(() => {
    if (currentShaded === targetNumerator && !success) {
      setSuccess(true);
      if (onComplete) setTimeout(onComplete, 1000);
    }
  }, [currentShaded, success, onComplete]);

  const toggleBlock = (index) => {
    if (success) return; // lock after success
    const newBlocks = [...shadedBlocks];
    newBlocks[index] = !newBlocks[index];
    setShadedBlocks(newBlocks);
  };

  return (
    <div className={`challenge-container ${success ? 'success-pulse' : ''}`} style={{ gap: 20 }}>
      <div className="challenge-header" style={{ color: success ? 'var(--clr-correct, #48BB78)' : 'var(--clr-text)' }}>
        {success ? '🎉 Perfect! You built 3/5' : 'Can you build the fraction 3/5?'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Target display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--clr-text-soft)' }}>
            Target:
          </div>
          <div className="fraction-display" style={{ fontSize: '2.5rem' }}>
            <div className="fraction-numerator" style={{ color: currentShaded === targetNumerator ? '#48BB78' : '#3182CE' }}>
              3
            </div>
            <div className="fraction-denominator">
              5
            </div>
          </div>
        </div>

        {/* Interactive blocks */}
        <div style={{ 
          display: 'flex', border: '3px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          {shadedBlocks.map((isShaded, i) => (
            <div
              key={i}
              onClick={() => toggleBlock(i)}
              style={{
                width: 60, height: 60, cursor: success ? 'default' : 'pointer',
                background: isShaded ? (success ? '#48BB78' : '#3182CE') : 'white',
                borderRight: i < 4 ? '2px solid #e2e8f0' : 'none',
                transition: 'background 0.2s'
              }}
            />
          ))}
        </div>

        {/* Live explanation */}
        <div style={{ 
          background: 'white', padding: '16px 24px', borderRadius: 16, border: '2px solid #e2e8f0',
          width: '100%', maxWidth: 400, marginTop: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>Numerator (Top):</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: currentShaded === targetNumerator ? '#48BB78' : '#3182CE' }}>
              {currentShaded} shaded
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>Denominator (Bottom):</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#718096' }}>
              {totalDenominator} total parts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractionPartsInteractive;
