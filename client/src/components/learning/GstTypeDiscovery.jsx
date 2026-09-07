import React, { useState, useEffect } from 'react';

/**
 * Step 2: "CGST, SGST & IGST"
 * Interactive transaction-type discovery — learner taps scenario cards
 * to discover which GST components apply for intra-state vs inter-state.
 */
const scenarios = [
  {
    id: 'intra1',
    label: 'Delhi → Delhi',
    icon: '🏪',
    description: 'A shop in Delhi sells to a customer in Delhi',
    type: 'intra',
    feedback: 'Same state! CGST goes to the Centre, SGST goes to the State.',
    components: ['CGST', 'SGST'],
  },
  {
    id: 'inter1',
    label: 'Mumbai → Kolkata',
    icon: '🚚',
    description: 'A factory in Mumbai ships goods to Kolkata',
    type: 'inter',
    feedback: 'Different states! Only IGST applies — shared between Centre and State later.',
    components: ['IGST'],
  },
  {
    id: 'intra2',
    label: 'Chennai → Chennai',
    icon: '🛒',
    description: 'A Chennai store sells to a Chennai buyer',
    type: 'intra',
    feedback: 'Same state again! CGST + SGST — each is half the total GST rate.',
    components: ['CGST', 'SGST'],
  },
  {
    id: 'inter2',
    label: 'Pune → Bangalore',
    icon: '✈️',
    description: 'A Pune company provides services to Bangalore',
    type: 'inter',
    feedback: 'Inter-state transaction! IGST = full GST rate applies.',
    components: ['IGST'],
  },
];

const GstTypeDiscovery = ({ onComplete }) => {
  const [revealed, setRevealed] = useState({});

  const allRevealed = Object.keys(revealed).length === scenarios.length;

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 15, width: '100%', maxWidth: 560 }}>
        {scenarios.map(s => {
          const isRevealed = revealed[s.id];
          const borderColor = isRevealed
            ? (s.type === 'intra' ? '#48BB78' : '#3182CE')
            : '#e2e8f0';
          const bgColor = isRevealed
            ? (s.type === 'intra' ? '#f0fff4' : '#ebf8ff')
            : 'white';

          return (
            <div
              key={s.id}
              className={`detective-card ${isRevealed ? 'revealed' : ''}`}
              onClick={() => handleTap(s.id)}
              style={{ borderColor, background: bgColor, cursor: isRevealed ? 'default' : 'pointer' }}
            >
              <div className="detective-icon">{s.icon}</div>
              <div className="detective-name" style={{ fontSize: '1rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textAlign: 'center', marginBottom: 8 }}>
                {s.description}
              </div>

              {isRevealed && (
                <div className="detective-feedback" style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {/* Component badges */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {s.components.map(c => (
                      <span key={c} style={{
                        padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
                        background: s.type === 'intra' ? '#c6f6d5' : '#bee3f8',
                        color: s.type === 'intra' ? '#276749' : '#2a4365',
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="detective-message" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {s.feedback}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div className="detective-success fade-in" style={{ marginTop: 20 }}>
          You've discovered how GST splits across states!
        </div>
      )}
    </div>
  );
};

export default GstTypeDiscovery;
