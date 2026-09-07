import React, { useState, useEffect } from 'react';

/**
 * Step 5: Real-World Fraction Detective
 * Learner taps real-world objects to see how fractions are used every day.
 */
const objectsData = [
  {
    id: 'pizza',
    icon: '🍕',
    name: 'Food',
    message: 'When you share a pizza with 3 friends, you each get 1/4 of the pizza!',
    color: '#FF7E67'
  },
  {
    id: 'clock',
    icon: '🕒',
    name: 'Time',
    message: '15 minutes is exactly 1/4 of an hour. 30 minutes is 1/2 of an hour!',
    color: '#3182CE'
  },
  {
    id: 'baking',
    icon: '🥄',
    name: 'Baking',
    message: 'Recipes often ask for 1/2 a cup of sugar or 3/4 teaspoon of salt.',
    color: '#D69E2E'
  },
  {
    id: 'money',
    icon: '🪙',
    name: 'Money',
    message: '25 paise is 1/4 of a Rupee, because 4 of them make a whole 100 paise!',
    color: '#48BB78'
  }
];

const FractionDetective = ({ onComplete }) => {
  const [discovered, setDiscovered] = useState({});

  const allDiscovered = Object.keys(discovered).length === objectsData.length;

  useEffect(() => {
    if (allDiscovered && onComplete) {
      onComplete();
    }
  }, [allDiscovered, onComplete]);

  const handleTap = (id) => {
    setDiscovered(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div className="detective-container">
      <div className="instruction-badge" style={{ marginBottom: 16 }}>
        Where do we see fractions? Tap to find out!
      </div>
      
      <div className="detective-grid" style={{ maxWidth: 600 }}>
        {objectsData.map(obj => {
          const isRevealed = discovered[obj.id];
          return (
            <div 
              key={obj.id}
              className={`detective-card ${isRevealed ? 'revealed' : ''}`}
              onClick={() => handleTap(obj.id)}
              style={{
                borderColor: isRevealed ? obj.color : '#e2e8f0',
                background: isRevealed ? '#f7fafc' : 'white'
              }}
            >
              <div className="detective-icon">{obj.icon}</div>
              <div className="detective-name">{obj.name}</div>
              
              {isRevealed && (
                <div className="detective-feedback" style={{ background: 'transparent' }}>
                  <div className="detective-message" style={{ textAlign: 'center', color: obj.color, fontWeight: 700 }}>
                    {obj.message}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDiscovered && (
        <div className="detective-success fade-in" style={{ marginTop: 20, background: '#48BB78' }}>
          Great job! Fractions are everywhere!
        </div>
      )}
    </div>
  );
};

export default FractionDetective;
