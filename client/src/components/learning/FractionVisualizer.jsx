import React, { useState } from 'react';

/**
 * Step 1: What is a Fraction?
 * Interactive pizza/circle divided into 4 parts.
 * Learner clicks to shade parts and sees the fraction change dynamically.
 */
const FractionVisualizer = ({ onComplete }) => {
  const [shadedParts, setShadedParts] = useState([false, false, false, false]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleSliceClick = (index) => {
    const newShaded = [...shadedParts];
    newShaded[index] = !newShaded[index];
    setShadedParts(newShaded);

    if (!hasInteracted && newShaded.some(Boolean)) {
      setHasInteracted(true);
      if (onComplete) setTimeout(onComplete, 800);
    }
  };

  const shadedCount = shadedParts.filter(Boolean).length;
  const totalParts = 4;

  return (
    <div className="interactive-container" style={{ gap: 20 }}>
      <div className="instruction-badge">
        {!hasInteracted ? '👆 Tap the pizza slices to shade them!' : '✨ You made a fraction!'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SVG Pizza */}
        <svg viewBox="0 0 200 200" width="180" height="180" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}>
          {shadedParts.map((isShaded, i) => {
            // Each slice is 90 degrees (1/4 of circle)
            const angleStart = i * 90;
            const angleEnd = (i + 1) * 90;
            
            // Convert to radians for SVG path
            const radStart = (angleStart - 90) * Math.PI / 180;
            const radEnd = (angleEnd - 90) * Math.PI / 180;
            
            const x1 = 100 + 90 * Math.cos(radStart);
            const y1 = 100 + 90 * Math.sin(radStart);
            const x2 = 100 + 90 * Math.cos(radEnd);
            const y2 = 100 + 90 * Math.sin(radEnd);

            const pathData = `M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`;

            return (
              <path
                key={i}
                d={pathData}
                fill={isShaded ? '#FF7E67' : '#FFF5F5'}
                stroke="#fff"
                strokeWidth="4"
                style={{ cursor: 'pointer', transition: 'fill 0.3s' }}
                onClick={() => handleSliceClick(i)}
                onMouseEnter={(e) => {
                  if (!isShaded) e.target.style.fill = '#FFE5E0';
                }}
                onMouseLeave={(e) => {
                  if (!isShaded) e.target.style.fill = '#FFF5F5';
                }}
              />
            );
          })}
          {/* Pizza crust border */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#FF7E67" strokeWidth="6" pointerEvents="none" />
        </svg>

        {/* Fraction Display */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'white', padding: '20px 30px', borderRadius: 20,
          border: '3px solid #e2e8f0', minWidth: 160
        }}>
          <div className="fraction-display">
            <div className="fraction-numerator" style={{ color: shadedCount > 0 ? '#FF7E67' : '#CBD5E0' }}>
              {shadedCount}
            </div>
            <div className="fraction-denominator">
              {totalParts}
            </div>
          </div>
          
          <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--clr-text-soft)', textAlign: 'center', fontWeight: 600 }}>
            {shadedCount === 0 ? '0 parts shaded' : `${shadedCount} out of ${totalParts} parts shaded`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractionVisualizer;
