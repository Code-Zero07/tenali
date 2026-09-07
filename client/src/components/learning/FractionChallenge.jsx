import React, { useState, useEffect } from 'react';

/**
 * Step 4: Fraction Challenge
 * 3-question mini-game testing fraction comparison rules (same denominator, same numerator).
 */
const challenges = [
  {
    id: 1,
    question: 'Which fraction is BIGGER?',
    options: [
      { label: '3 / 4', value: '3/4', correct: true },
      { label: '1 / 4', value: '1/4', correct: false, pitfall: 'Both have 4 pieces total. 3 pieces is more than 1 piece!' },
    ],
    explanation: 'When the bottom numbers are the same, the bigger top number wins!',
  },
  {
    id: 2,
    question: 'Which fraction is SMALLER?',
    options: [
      { label: '2 / 5', value: '2/5', correct: true },
      { label: '4 / 5', value: '4/5', correct: false, pitfall: 'Look for the smaller top number!' },
    ],
    explanation: '2 pieces out of 5 is smaller than 4 pieces out of 5.',
  },
  {
    id: 3,
    question: 'Which pizza slice is BIGGER?',
    options: [
      { label: '1 / 2', value: '1/2', correct: true },
      { label: '1 / 8', value: '1/8', correct: false, pitfall: '1/8 means the pizza is cut into 8 tiny slices. 1/2 means it is cut into 2 giant slices!' },
    ],
    explanation: 'When the tops are the same, the SMALLER bottom means BIGGER pieces!',
  }
];

const FractionChallenge = ({ onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const challenge = challenges[currentQ];

  useEffect(() => {
    if (finished && onComplete) {
      onComplete();
    }
  }, [finished, onComplete]);

  const handleSelect = (opt) => {
    if (showFeedback) return;
    setSelected(opt);
    setShowFeedback(true);
    if (opt.correct) setCorrectCount(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= challenges.length) {
      setFinished(true);
    } else {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  if (finished) {
    return (
      <div className="challenge-container" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
          {correctCount === challenges.length ? '🏆' : '👍'}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: 4 }}>
          {correctCount}/{challenges.length} correct
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>
          {correctCount === challenges.length
            ? 'Awesome! You mastered comparing fractions.'
            : 'Good effort! Remember the rules of top and bottom numbers.'}
        </div>
      </div>
    );
  }

  return (
    <div className="challenge-container">
      {/* Progress */}
      <div className="progress-track" style={{ maxWidth: 260 }}>
        <div
          className="progress-fill"
          style={{
            width: `${(currentQ / challenges.length) * 100}%`,
            backgroundColor: '#3182CE',
          }}
        />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', marginBottom: 12, fontWeight: 600 }}>
        Question {currentQ + 1} of {challenges.length}
      </div>

      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--clr-text)', marginBottom: 16, textAlign: 'center' }}>
        {challenge.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 360, justifyContent: 'center' }}>
        {challenge.options.map((opt, i) => {
          let bg = 'white';
          let border = '3px solid #e2e8f0';
          let color = '#3182CE';

          if (showFeedback) {
            if (opt.correct) {
              bg = '#f0fff4';
              border = '3px solid #48BB78';
              color = '#276749';
            } else if (selected === opt && !opt.correct) {
              bg = '#FFF5F5';
              border = '3px solid #FC8181';
              color = '#9B2C2C';
            }
          }

          // Parse fraction label for display
          const [num, den] = opt.label.split(' / ');

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              style={{
                flex: 1, padding: '16px', borderRadius: 16, border, background: bg,
                cursor: showFeedback ? 'default' : 'pointer', transition: 'all 0.2s',
                display: 'flex', justifyContent: 'center'
              }}
            >
              <div className="fraction-display" style={{ fontSize: '2rem', color }}>
                <div className="fraction-numerator" style={{ borderColor: color }}>{num}</div>
                <div className="fraction-denominator" style={{ borderColor: color }}>{den}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="fade-in" style={{
          marginTop: 16, width: '100%', maxWidth: 400, borderRadius: 12, padding: '14px 18px',
          background: selected.correct ? '#f0fff4' : '#FFF5F5',
          border: selected.correct ? '2px solid #C6F6D5' : '2px solid #FED7D7',
          textAlign: 'center'
        }}>
          {!selected.correct && selected.pitfall && (
            <div style={{ fontSize: '0.9rem', color: '#9B2C2C', marginBottom: 8, lineHeight: 1.5, fontWeight: 700 }}>
              Oops! {selected.pitfall}
            </div>
          )}
          <div style={{ fontSize: '0.95rem', color: 'var(--clr-text)', fontWeight: 600, lineHeight: 1.5 }}>
            {challenge.explanation}
          </div>

          <button
            onClick={handleNext}
            style={{
              marginTop: 12, padding: '8px 24px', borderRadius: 20, border: 'none',
              background: '#3182CE', color: 'white', fontWeight: 700,
              fontSize: '1rem', cursor: 'pointer'
            }}
          >
            {currentQ + 1 >= challenges.length ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FractionChallenge;
