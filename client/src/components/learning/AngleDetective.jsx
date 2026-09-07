import React, { useState, useEffect } from 'react';
import './angles-learn.css';

const objectsData = [
  {
    id: 'door',
    icon: '🚪',
    name: 'Door',
    hasAngle: true,
    message: 'Yes! The corners of a door make Right Angles (90°).',
  },
  {
    id: 'clock',
    icon: '🕒',
    name: 'Clock',
    hasAngle: true,
    message: 'Yes! The hands of a clock make different angles as time passes.',
  },
  {
    id: 'scissors',
    icon: '✂️',
    name: 'Scissors',
    hasAngle: true,
    message: 'Yes! The blades of scissors make an angle when you open them.',
  },
  {
    id: 'ball',
    icon: '⚽',
    name: 'Ball',
    hasAngle: false,
    message: 'Nope! A ball has no corners or straight lines, so it has no angles!',
  }
];

const AngleDetective = ({ onComplete }) => {
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
      <div className="detective-grid">
        {objectsData.map(obj => {
          const isRevealed = discovered[obj.id];
          return (
            <div 
              key={obj.id}
              className={`detective-card ${isRevealed ? 'revealed' : ''} ${isRevealed && obj.hasAngle ? 'has-angle' : ''} ${isRevealed && !obj.hasAngle ? 'no-angle' : ''}`}
              onClick={() => handleTap(obj.id)}
            >
              <div className="detective-icon">{obj.icon}</div>
              <div className="detective-name">{obj.name}</div>
              
              {isRevealed && (
                <div className="detective-feedback">
                  <div className="detective-result-icon">
                    {obj.hasAngle ? '✓' : '✕'}
                  </div>
                  <div className="detective-message">{obj.message}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDiscovered && (
        <div className="detective-success fade-in">
          🎉 Great detective work! You found the angles!
        </div>
      )}
    </div>
  );
};

export default AngleDetective;
