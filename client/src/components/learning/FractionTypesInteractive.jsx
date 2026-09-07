import React, { useState, useEffect } from 'react';

/**
 * Step 3: Types of Fractions
 * Interactive discovery — learner taps cards to discover what Proper, Improper, 
 * Mixed, and Equivalent fractions look like visually.
 */
const fractionTypes = [
  {
    id: 'proper',
    title: 'Proper Fraction',
    fraction: { n: 1, d: 2 },
    description: 'Top is smaller than bottom.',
    visual: '🍕 (Half a pizza)',
    color: '#3182CE',
    bg: '#ebf8ff'
  },
  {
    id: 'improper',
    title: 'Improper Fraction',
    fraction: { n: 5, d: 4 },
    description: 'Top is bigger than bottom.',
    visual: '🍕🍕 (More than 1 whole!)',
    color: '#FF7E67',
    bg: '#FFF5F5'
  },
  {
    id: 'mixed',
    title: 'Mixed Number',
    fraction: { whole: 1, n: 1, d: 4 },
    description: 'Whole number + a fraction.',
    visual: '📦 + 🍕 (1 whole and a quarter)',
    color: '#48BB78',
    bg: '#f0fff4'
  },
  {
    id: 'equivalent',
    title: 'Equivalent',
    fraction: { n: 2, d: 4 },
    description: 'Looks different, same amount as 1/2.',
    visual: '🤝 (They are equal!)',
    color: '#805AD5',
    bg: '#faf5ff'
  }
];

const FractionTypesInteractive = ({ onComplete }) => {
  const [revealed, setRevealed] = useState({});

  const allRevealed = Object.keys(revealed).length === fractionTypes.length;

  useEffect(() => {
    if (allRevealed && onComplete) {
      onComplete();
    }
  }, [allRevealed, onComplete]);

  const handleTap = (id) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="detective-container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, width: '100%' }}>
        {fractionTypes.map(type => {
          const isRevealed = revealed[type.id];
          return (
            <div
              key={type.id}
              className={`detective-card ${isRevealed ? 'revealed' : ''}`}
              onClick={() => handleTap(type.id)}
              style={{
                borderColor: isRevealed ? type.color : '#e2e8f0',
                background: isRevealed ? type.bg : 'white',
                cursor: isRevealed ? 'default' : 'pointer'
              }}
            >
              <div className="detective-name" style={{ fontSize: '1.1rem', color: isRevealed ? type.color : 'var(--clr-text)' }}>
                {type.title}
              </div>

              {!isRevealed ? (
                <div style={{ fontSize: '2.5rem', margin: '20px 0', opacity: 0.5 }}>❓</div>
              ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 0' }}>
                    {type.fraction.whole && (
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: type.color }}>{type.fraction.whole}</span>
                    )}
                    <div className="fraction-display" style={{ fontSize: '1.8rem', color: type.color }}>
                      <div className="fraction-numerator" style={{ borderColor: type.color }}>{type.fraction.n}</div>
                      <div className="fraction-denominator" style={{ borderColor: type.color }}>{type.fraction.d}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--clr-text)', textAlign: 'center', marginBottom: 8 }}>
                    {type.description}
                  </div>
                  <div style={{ fontSize: '1.2rem' }}>
                    {type.visual}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div className="detective-success fade-in" style={{ marginTop: 20 }}>
          You've discovered the Fraction Family!
        </div>
      )}
    </div>
  );
};

export default FractionTypesInteractive;
