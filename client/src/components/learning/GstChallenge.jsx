import React, { useState, useEffect } from 'react';

/**
 * Step 5: "Common Mistakes" — GST Challenge
 * A series of 4 mini-questions that test common GST pitfalls.
 * The learner must answer all correctly (with feedback on mistakes)
 * before advancing. Each question targets a specific common mistake
 * from the existing GST theory.
 */
const challenges = [
  {
    id: 1,
    scenario: 'A shirt costs ₹800 (before tax). GST is 12%.',
    question: 'How much is the GST?',
    options: [
      { label: '₹96', value: 96, correct: true },
      { label: '₹85.71', value: 85.71, correct: false, pitfall: 'You calculated GST on the final price (₹800 as inclusive). GST is on the base price!' },
      { label: '₹192', value: 192, correct: false, pitfall: 'You applied 12% twice (CGST + SGST each at 12%). The total GST rate is 12%, split as 6% + 6%.' },
    ],
    explanation: 'GST = ₹800 × 12 ÷ 100 = ₹96. CGST = ₹48, SGST = ₹48.',
  },
  {
    id: 2,
    scenario: 'Total GST on a TV is 18% (intra-state sale).',
    question: 'What is the CGST rate?',
    options: [
      { label: '18%', value: 18, correct: false, pitfall: '18% is the total GST. For intra-state, CGST = half of total GST.' },
      { label: '9%', value: 9, correct: true },
      { label: '36%', value: 36, correct: false, pitfall: 'CGST is half the total GST, not double!' },
    ],
    explanation: 'For intra-state: CGST = 18% ÷ 2 = 9%, SGST = 9%.',
  },
  {
    id: 3,
    scenario: 'A trader buys raw materials for ₹5,000 + 18% GST (input). He sells finished goods for ₹8,000 + 18% GST (output).',
    question: 'GST payable to the government?',
    options: [
      { label: '₹1,440', value: 1440, correct: false, pitfall: 'That is the full output GST. You forgot to subtract the input GST (ITC)!' },
      { label: '₹540', value: 540, correct: true },
      { label: '₹900', value: 900, correct: false, pitfall: 'Check: Input GST = ₹900, Output GST = ₹1,440. Payable = 1,440 − 900 = ₹540.' },
    ],
    explanation: 'Input GST = ₹900, Output GST = ₹1,440. GST payable = ₹1,440 − ₹900 = ₹540.',
  },
  {
    id: 4,
    scenario: 'A product is shipped from Gujarat to Tamil Nadu. GST rate is 12%.',
    question: 'Which tax components apply?',
    options: [
      { label: 'CGST 6% + SGST 6%', value: 'cs', correct: false, pitfall: 'CGST + SGST apply only for intra-state (same state). This is inter-state!' },
      { label: 'IGST 12%', value: 'i', correct: true },
      { label: 'CGST 12% + SGST 12%', value: 'cs2', correct: false, pitfall: 'The total GST is 12%, not 24%. And for inter-state, only IGST applies.' },
    ],
    explanation: 'Gujarat → Tamil Nadu = inter-state. Only IGST at the full 12% rate applies.',
  },
];

const GstChallenge = ({ onComplete }) => {
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

  const handleSelect = (option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    if (option.correct) {
      setCorrectCount(prev => prev + 1);
    }
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
          {correctCount === challenges.length ? '🎉' : '👍'}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: 4 }}>
          {correctCount}/{challenges.length} correct
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>
          {correctCount === challenges.length
            ? 'Perfect! You avoided every common GST mistake.'
            : 'Good effort! Review the explanations above if needed.'}
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
            backgroundColor: 'var(--clr-accent, #FF7E67)',
          }}
        />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', marginBottom: 12, fontWeight: 600 }}>
        Question {currentQ + 1} of {challenges.length}
      </div>

      {/* Scenario */}
      <div style={{
        background: 'white', borderRadius: 14, padding: '16px 20px',
        border: '2px solid #e2e8f0', width: '100%', maxWidth: 440, marginBottom: 12
      }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--clr-text)', lineHeight: 1.5, marginBottom: 10 }}>
          {challenge.scenario}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--clr-text)' }}>
          {challenge.question}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 440 }}>
        {challenge.options.map((opt, i) => {
          let bg = 'white';
          let border = '2px solid #e2e8f0';
          let color = 'var(--clr-text)';

          if (showFeedback) {
            if (opt.correct) {
              bg = '#f0fff4';
              border = '2px solid #48BB78';
              color = '#276749';
            } else if (selected === opt && !opt.correct) {
              bg = '#FFF5F5';
              border = '2px solid #FC8181';
              color = '#9B2C2C';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              style={{
                padding: '12px 18px', borderRadius: 12, border, background: bg,
                color, fontWeight: 700, fontSize: '1rem', cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="fade-in" style={{
          marginTop: 12, width: '100%', maxWidth: 440, borderRadius: 12,
          padding: '14px 18px',
          background: selected.correct ? '#f0fff4' : '#FFF5F5',
          border: selected.correct ? '2px solid #C6F6D5' : '2px solid #FED7D7'
        }}>
          {!selected.correct && selected.pitfall && (
            <div style={{ fontSize: '0.9rem', color: '#9B2C2C', marginBottom: 8, lineHeight: 1.5 }}>
              {selected.pitfall}
            </div>
          )}
          <div style={{ fontSize: '0.9rem', color: 'var(--clr-text)', fontWeight: 600, lineHeight: 1.5 }}>
            {challenge.explanation}
          </div>

          <button
            onClick={handleNext}
            style={{
              marginTop: 10, padding: '8px 24px', borderRadius: 20, border: 'none',
              background: 'var(--clr-accent, #FF7E67)', color: 'white', fontWeight: 700,
              fontSize: '0.95rem', cursor: 'pointer'
            }}
          >
            {currentQ + 1 >= challenges.length ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GstChallenge;
