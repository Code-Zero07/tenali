/**
 * DETECTIVE BOARD APP — BoardCasePlay presentation shell
 *
 * Renders a board-based crime-scene case (`type: 'board'`) for the Math
 * Detective Agency: a 12×12 chalkboard scene the learner walks a detective
 * around, objects that pin evidence tags onto the scene, a notebook overlay
 * (drag / tap-tap elimination), a suspect poster with a red ELIMINATED stamp,
 * an owl assistant bar, a math index-card interaction, and a confession scene.
 *
 * Investigation + Learning logic lives in `detective-board-engine.js` (pure);
 * case data lives in `detective-board-cases.js`. This file is a thin shell.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './detective-board.css';

import { saveInProgressCase } from './detective-app';
import {
  createInitialState,
  movePlayer,
  isBlocked,
  objectAt,
  getMathFor,
  registerAnswer,
  handleWrong,
  collectObservation,
  applyElimination,
  onlyCulpritRemains,
  accusedSuspect,
  getPosterSuspects,
  getCollectedEvidence,
  getNotebookLines,
  getLatestThought,
  getThoughtsForEvidence,
  CATEGORY_TAGS,
} from './detective-board-engine';

// ─── Tiny local sound helpers (Web Audio, failure-safe) ────────────────
let boardAudio = null;
function boardTone(freq, duration, type = 'sine', volume = 0.22) {
  try {
    if (!boardAudio) boardAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (boardAudio.state === 'suspended') boardAudio.resume();
    const ctx = boardAudio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* audio unavailable — skip the sound */ }
}

const SFX = {
  step: () => boardTone(170, 0.05, 'triangle', 0.1),
  correct: () => { boardTone(660, 0.15, 'sine', 0.18); setTimeout(() => boardTone(880, 0.2, 'sine', 0.18), 100); },
  wrong: () => boardTone(200, 0.25, 'sine', 0.16),
  stamp: () => boardTone(120, 0.16, 'square', 0.14),
  confetti: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => boardTone(f, 0.28, 'sine', 0.16), i * 140)),
};

// ─── Assistant moods (the owl on the desk edge) ─────────────────────────
const BOARD_MOODS = {
  neutral: { emoji: '🦉', label: 'Hoot' },
  thinking: { emoji: '🤔', label: 'Hmm...' },
  correct: { emoji: '😎', label: 'Nice!' },
  wrong: { emoji: '🧐', label: 'Try again' },
  hint: { emoji: '💡', label: "Here's a clue" },
  solved: { emoji: '🥳', label: 'Case cracked!' },
  party: { emoji: '🎉', label: 'Brilliant!' },
};

const PROFILE_LABELS = {
  favouriteFood: 'Favourite Food',
  footprint: 'Footprint',
  colour: 'Colour',
  timing: 'Timing',
};

// Short rotated nudges for pure-observation clues (no math). The long
// observation sentence is replaced by one of these to cut cognitive load.
const OBSERVATION_ENCOURAGEMENTS = [
  'Nice deduction, Detective!',
  'Sharp eyes, Detective!',
  'Good catch!',
  "You're on the trail!",
];

function catTag(category) {
  const t = CATEGORY_TAGS[category] || { emoji: '🔎', label: 'Clue' };
  return `${t.emoji} ${t.label}`;
}

function padCaseNumber(n) {
  return String(n || 1).padStart(3, '0');
}

// ─── Intro briefing scene ───────────────────────────────────────────────

function BoardIntro({ story, onStart }) {
  return (
    <div className="dbc-root">
      <div className="dbc-scene">
        <div className="dbc-paper-scene">
          <div className="dbc-case-tab" style={{ color: 'rgba(42,46,51,0.9)', borderColor: 'rgba(42,46,51,0.45)' }}>
            Case {padCaseNumber(story.caseNumber)} · Greenleaf Animal School
          </div>
          <h1 className="dbc-paper-scene-title">{story.title}</h1>
          <p className="dbc-paper-scene-body">{story.briefing}</p>
          <div className="dbc-section-label" style={{ textAlign: 'center' }}>
            In class today
          </div>
          <div className="dbc-suspect-row">
            {story.suspects.map(s => (
              <div key={s.id} className="dbc-suspect-chip">
                <div className="dbc-suspect-emoji" aria-hidden="true">{s.animalEmoji}</div>
                <div className="dbc-suspect-name">{s.name}</div>
                <div className="dbc-suspect-hint">{s.hint}</div>
              </div>
            ))}
          </div>
          <button className="dbc-primary-btn" onClick={onStart}>
            Start the Investigation 🔍
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confession scene (the case is solved) ──────────────────────────────

function BoardConfession({ story, stats, onBack }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const culprit = story.suspects.find(s => s.id === story.culprit);
  const full = (story.confession && story.confession.mrBNote) || '';
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch { return false; }
  }, []);
  const [revealed, setRevealed] = useState(() => (prefersReducedMotion ? full.length : 0));

  useEffect(() => {
    if (!noteOpen) return;
    if (revealed >= full.length) return;
    const t = setTimeout(() => setRevealed(v => v + 1), 30);
    return () => clearTimeout(t);
  }, [noteOpen, revealed, full.length]);

  const stars = stats.totalHintsUsed === 0 ? 3 : stats.totalHintsUsed <= 2 ? 2 : 1;
  const xp = Math.round(story.xpReward * (stars === 3 ? 1 : stars === 2 ? 0.7 : 0.4));

  return (
    <div className="dbc-root">
      <div className="dbc-scene">
        <div className="dbc-paper-scene">
          <div className="dbc-confession-culprit">
            {culprit.animalEmoji} {culprit.name} — the case is cracked!
          </div>
          <p className="dbc-paper-scene-body">{story.confession.culpritNarrative}</p>

          <div style={{ textAlign: 'center', margin: '0.4rem 0 0.6rem' }}>
            {!noteOpen ? (
              <button className="dbc-note-seal" onClick={() => setNoteOpen(true)} style={{ cursor: 'pointer', border: 'none', minHeight: 44 }}>
                📜 A note for you — open it
              </button>
            ) : (
              <div>
                <span className="dbc-note-seal" style={{ marginBottom: '0.4rem' }}>Mr. B · sealed</span>
                <div className="dbc-mrB-note">{full.slice(0, revealed)}<span aria-hidden="true">{revealed < full.length ? '▌' : ''}</span></div>
              </div>
            )}
          </div>

          <p className="dbc-paper-scene-body" style={{ fontFamily: 'var(--dbc-font-chalk)', fontSize: '1.25rem' }}>
            {story.confession.resolution}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="dbc-profile-slot" style={{ background: 'rgba(42,46,51,0.08)' }}>
              <b>Stars</b>
              <span>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>
            </div>
            <div className="dbc-profile-slot" style={{ background: 'rgba(42,46,51,0.08)' }}>
              <b>XP Earned</b>
              <span>+{xp}</span>
            </div>
          </div>

          <button className="dbc-primary-btn" onClick={onBack} style={{ marginTop: '0.4rem' }}>
            Back to Case Library 🗂️
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main board case component ──────────────────────────────────────────

export default function BoardCasePlay({ story, onComplete, onBack, initialState }) {
  const [engine, setEngine] = useState(() => {
    const base = createInitialState(story, { initialBand: initialState && initialState.initialBand });
    const snap = initialState && initialState.boardSnapshot;
    if (snap) return { ...base, ...snap };
    return base;
  });
  const [phase, setPhase] = useState(() => (initialState && initialState.phase === 'exploring' ? 'exploring' : 'intro'));
  const [activeObjectId, setActiveObjectId] = useState(null);
  const [cardState, setCardState] = useState(null); // { kind, variant?, text?, hintsShown, feedback, solved }
  const [answer, setAnswer] = useState('');
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [showAllThoughts, setShowAllThoughts] = useState(false);
  const [mascot, setMascot] = useState({ mood: 'neutral', text: '' });
  const [toast, setToast] = useState(null);
  const [completed, setCompleted] = useState(false);
  const toastTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeObjectId && cardState && cardState.kind === 'math' && !cardState.solved) {
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [activeObjectId, cardState]);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const collectedEvidence = useMemo(() => getCollectedEvidence(story, engine.collectedEvidenceIds), [story, engine.collectedEvidenceIds]);
  const posterSuspects = useMemo(() => getPosterSuspects(story, engine), [story, engine]);
  const thoughts = useMemo(() => getNotebookLines(story, engine.collectedEvidenceIds), [story, engine.collectedEvidenceIds]);
  const latestThought = useMemo(() => getLatestThought(story, engine.collectedEvidenceIds), [story, engine.collectedEvidenceIds]);
  const currentThoughts = useMemo(() => {
    if (showAllThoughts) return thoughts;
    const perEvidence = selectedEvidenceId
      ? getThoughtsForEvidence(story, engine.collectedEvidenceIds, selectedEvidenceId)
      : [];
    return perEvidence.length > 0 ? perEvidence : latestThought;
  }, [showAllThoughts, thoughts, selectedEvidenceId, story, engine.collectedEvidenceIds, latestThought]);
  const accusation = useMemo(() => accusedSuspect(story, engine), [story, engine]);

  // Persist the in-progress scene after each interaction/elimination/hint.
  useEffect(() => {
    if (completed || phase !== 'exploring') return;
    saveInProgressCase(story.id, {
      currentStage: 1,
      totalStages: 1,
      topic: story.topic,
      phase: 'exploring',
      boardSnapshot: {
        playerPos: engine.playerPos,
        collectedEvidenceIds: engine.collectedEvidenceIds,
        eliminatedIds: engine.eliminatedIds,
        band: engine.band,
        hintsUsedPerObject: engine.hintsUsedPerObject,
        correctCount: engine.correctCount,
        wrongCount: engine.wrongCount,
        totalHintsUsed: engine.totalHintsUsed,
      },
      savedCase: story,
    });
  }, [engine, phase, completed, story]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeCard = useCallback(() => {
    setActiveObjectId(null);
    setCardState(null);
    setAnswer('');
  }, []);

  const closeNotebook = useCallback(() => {
    setNotebookOpen(false);
    setShowAllThoughts(false);
  }, []);

  const openNotebook = useCallback(() => {
    setNotebookOpen(true);
    setShowAllThoughts(false);
  }, []);

  const openObject = useCallback((objectId) => {
    const obj = story.objects.find(o => o.id === objectId);
    if (!obj) return;
    setActiveObjectId(objectId);
    if (obj.clueType === 'observation') {
      const nudge = OBSERVATION_ENCOURAGEMENTS[Math.floor(Math.random() * OBSERVATION_ENCOURAGEMENTS.length)];
      setCardState({ kind: 'observation', text: nudge, hintsShown: [], feedback: null, solved: false });
      setMascot({ mood: 'thinking', text: `Take a close look at the ${obj.name.toLowerCase()}, Detective!` });
    } else {
      const variant = getMathFor(engine, obj);
      setCardState({ kind: 'math', variant, hintsShown: [], feedback: null, solved: false });
      setMascot({ mood: 'thinking', text: 'Use math to read this clue, Detective!' });
    }
  }, [engine, story]);

  const tryMove = useCallback((dx, dy) => {
    if (phase !== 'exploring' || activeObjectId || notebookOpen || posterOpen || exitDialogOpen || completed) return;
    const res = movePlayer(engine, story, dx, dy);
    if (!res.ok) {
      if (res.reason === 'blocked') setMascot({ mood: 'thinking', text: "That way's blocked, Detective!" });
      return;
    }
    SFX.step();
    setEngine(res.state);
    if (res.event.type === 'object') {
      openObject(res.event.objectId);
    } else if (res.event.type === 'already-collected') {
      showToast('Already in your notebook!');
    }
  }, [engine, phase, activeObjectId, notebookOpen, posterOpen, exitDialogOpen, completed, story, openObject, showToast]);

  // Keyboard: WASD + arrows to walk; Escape to close overlays/card.
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const dirs = {
        w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0],
        arrowup: [0, -1], arrowleft: [-1, 0], arrowdown: [0, 1], arrowright: [1, 0],
      };
      if (dirs[k]) {
        e.preventDefault();
        tryMove(dirs[k][0], dirs[k][1]);
        return;
      }
      if (k === 'escape') {
        if (exitDialogOpen) setExitDialogOpen(false);
        else if (activeObjectId) closeCard();
        else if (notebookOpen) closeNotebook();
        else if (posterOpen) setPosterOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, activeObjectId, notebookOpen, posterOpen, exitDialogOpen, closeCard, closeNotebook]);

  const handleTileTap = useCallback((obj) => {
    const [px, py] = engine.playerPos;
    const dist = Math.max(Math.abs(px - obj.cell[0]), Math.abs(py - obj.cell[1]));
    if (dist <= 1) {
      openObject(obj.id);
    } else {
      setMascot({ mood: 'thinking', text: 'Walk closer to reach that, Detective!' });
    }
  }, [engine.playerPos, openObject]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!activeObjectId || !cardState || cardState.solved) return;
    const obj = story.objects.find(o => o.id === activeObjectId);
    const res = registerAnswer(engine, story, obj, answer);
    if (res.correct) {
      SFX.correct();
      setEngine(res.state);
      setCardState({ ...cardState, solved: true, feedback: { correct: true }, evidence: obj.evidence });
      setAnswer('');
      setMascot({ mood: 'correct', text: 'Clue found! Pinned to the scene.' });
      showToast('Evidence found! Check your notebook.');
    } else {
      SFX.wrong();
      const hw = handleWrong(engine, obj);
      setEngine(hw.state);
      const hintsShown = [...(cardState.hintsShown || [])];
      if (!hintsShown.includes(hw.hintIndex)) hintsShown.push(hw.hintIndex);
      const objAfter = story.objects.find(o => o.id === activeObjectId);
      setCardState({
        ...cardState,
        variant: getMathFor(hw.state, objAfter),
        hintsShown,
        feedback: { correct: false },
      });
      setAnswer('');
      if (hw.offeredEasy) {
        setMascot({ mood: 'hint', text: "Let's try an easier version of this one, Detective." });
      } else {
        setMascot({ mood: 'hint', text: 'Detective, try again — here\'s a hint.' });
      }
    }
  }, [engine, story, activeObjectId, cardState, answer, showToast]);

  const handleObservationCollect = useCallback(() => {
    if (!activeObjectId || !cardState || cardState.solved) return;
    const obj = story.objects.find(o => o.id === activeObjectId);
    const res = collectObservation(engine, obj);
    SFX.correct();
    setEngine(res.state);
    setCardState({ ...cardState, solved: true, feedback: { correct: true }, evidence: obj.evidence });
    setMascot({ mood: 'correct', text: 'Noted in your notebook, Detective!' });
    showToast('Evidence found! Check your notebook.');
  }, [engine, story, activeObjectId, cardState, showToast]);

  const handleEliminate = useCallback((evidenceId, suspectId) => {
    const res = applyElimination(engine, story, evidenceId, suspectId);
    if (!res.ok) {
      if (res.reason === 'no-contradiction') {
        SFX.wrong();
        const s = story.suspects.find(x => x.id === suspectId);
        setMascot({ mood: 'wrong', text: `That clue doesn't rule out ${s ? s.name : 'them'}, Detective — keep looking.` });
      } else if (res.reason === 'not-collected') {
        showToast('Collect that clue first!');
      }
      return;
    }
    SFX.stamp();
    setEngine(res.state);
    setSelectedEvidenceId(null);
    if (onlyCulpritRemains(story, res.state)) {
      setMascot({ mood: 'solved', text: 'The case is cracked! Only one suspect remains.' });
    } else {
      setMascot({ mood: 'correct', text: 'Eliminated! Great reasoning, Detective.' });
    }
  }, [engine, story, showToast]);

  const toggleEvidenceSelection = useCallback((evidenceId) => {
    setSelectedEvidenceId(prev => (prev === evidenceId ? null : evidenceId));
    if (selectedEvidenceId !== evidenceId) {
      setMascot({ mood: 'thinking', text: 'Now tap the suspect this clue rules out!' });
    }
  }, [selectedEvidenceId]);

  const handleDrop = useCallback((e, suspectId) => {
    e.preventDefault();
    const eid = e.dataTransfer.getData('text/plain');
    if (eid) handleEliminate(eid, suspectId);
  }, [handleEliminate]);

  const handleSuspectTap = useCallback((suspectId) => {
    if (selectedEvidenceId) {
      handleEliminate(selectedEvidenceId, suspectId);
    } else {
      setMascot({ mood: 'thinking', text: 'Tap a clue in the notebook, then tap the suspect it rules out!' });
    }
  }, [selectedEvidenceId, handleEliminate]);

  const handleAccuse = useCallback(() => {
    if (!accusation || completed) return;
    SFX.confetti();
    setCompleted(true);
    setPosterOpen(false);
    setNotebookOpen(false);
    onComplete(story.id, true, {
      totalHintsUsed: engine.totalHintsUsed,
      correctCount: engine.correctCount,
      wrongCount: engine.wrongCount,
      totalQuestions: engine.correctCount + engine.wrongCount,
      skillFamily: story.skillFamily,
    });
    setPhase('confession');
    setMascot({ mood: 'party', text: 'Case solved! Brilliant detective work.' });
  }, [accusation, completed, engine, story, onComplete]);

  const mood = BOARD_MOODS[mascot.mood] || BOARD_MOODS.neutral;

  // ── Intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <BoardIntro
        story={story}
        onStart={() => {
          setPhase('exploring');
          setMascot({ mood: 'neutral', text: 'Explore the scene, Detective — step on anything interesting!' });
        }}
      />
    );
  }

  // ── Confession ────────────────────────────────────────────────────
  if (phase === 'confession') {
    return (
      <BoardConfession
        story={story}
        stats={{ totalHintsUsed: engine.totalHintsUsed }}
        onBack={onBack}
      />
    );
  }

  // ── Exploring: board + mascot + overlays ──────────────────────────
  const activeObj = activeObjectId ? story.objects.find(o => o.id === activeObjectId) : null;

  const renderTiles = [];
  for (let y = 0; y < story.gridSize; y++) {
    for (let x = 0; x < story.gridSize; x++) {
      const blocked = isBlocked(story, x, y);
      const obj = objectAt(story, x, y);
      const isPlayer = engine.playerPos[0] === x && engine.playerPos[1] === y;
      const collected = obj && engine.collectedEvidenceIds.includes(obj.evidence.id);

      const classes = ['dbc-tile'];
      if (blocked) classes.push('dbc-tile--blocked');
      else if (obj) classes.push(collected ? 'dbc-tile--collected' : 'dbc-tile--object');
      if (isPlayer) classes.push('dbc-tile--player', 'dbc-hop');

      const label = obj
        ? (collected ? `${obj.name} — already in your notebook` : `Investigate ${obj.name}`)
        : (blocked ? 'blocked' : 'floor');

      renderTiles.push(
        <div
          key={`${x}-${y}`}
          className={classes.join(' ')}
          role={obj && !blocked ? 'button' : undefined}
          tabIndex={obj && !blocked ? 0 : undefined}
          aria-label={label}
          onClick={obj && !blocked && !isPlayer ? () => handleTileTap(obj) : undefined}
          onKeyDown={obj && !blocked ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTileTap(obj);
            }
          } : undefined}
        >
          {!blocked && obj && (
            <>
              <span className="dbc-object-emoji" aria-hidden="true">{obj.emoji}</span>
              {collected && (
                <span className="dbc-evidence-tag" aria-hidden="true">{obj.evidence.id.replace('ev-', '')}</span>
              )}
            </>
          )}
          {!blocked && !obj && isPlayer && (
            <span className="dbc-player-hat" role="img" aria-label="You, the detective">🕵️</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="dbc-root">
      <div className="dbc-scene">
        <div className="dbc-topbar">
          <button
            className="dbc-exit-btn"
            onClick={() => setExitDialogOpen(true)}
            aria-label="Leave case"
          >
            ←
          </button>
          <div className="dbc-case-tab">Case {padCaseNumber(story.caseNumber)}</div>
          <h2 className="dbc-case-title">{story.title}</h2>
          <div className="dbc-topbar-toggles">
            <button
              className={`dbc-toggle-btn${notebookOpen ? ' is-active' : ''}`}
              onClick={() => { if (notebookOpen) closeNotebook(); else openNotebook(); setPosterOpen(false); }}
              aria-label={notebookOpen ? 'Close Notebook' : 'Open Notebook'}
            >
              📓 Notebook
            </button>
            <button
              className={`dbc-toggle-btn${posterOpen ? ' is-active' : ''}`}
              onClick={() => { setPosterOpen(v => !v); closeNotebook(); }}
              aria-label={posterOpen ? 'Close Suspects' : 'View Suspects'}
            >
              🖼 Suspects
            </button>
          </div>
        </div>

        <div className="dbc-board-wrap">
          <div className="dbc-board" role="grid" aria-label="Crime scene — 12 by 12 board">
            {renderTiles}
          </div>
        </div>

        <div className="dbc-dpad" aria-label="Movement controls">
          <button className="dbc-dpad-btn dbc-dpad-up" onClick={() => tryMove(0, -1)} aria-label="Move up">▲</button>
          <button className="dbc-dpad-btn dbc-dpad-left" onClick={() => tryMove(-1, 0)} aria-label="Move left">◀</button>
          <button className="dbc-dpad-btn dbc-dpad-down" onClick={() => tryMove(0, 1)} aria-label="Move down">▼</button>
          <button className="dbc-dpad-btn dbc-dpad-right" onClick={() => tryMove(1, 0)} aria-label="Move right">▶</button>
        </div>

        <div className="dbc-desk-edge" aria-hidden="true" />

        <div className="dbc-mascot-bar" role="status" aria-live="polite">
          <span className="dbc-mascot-emoji" aria-hidden="true">{mood.emoji}</span>
          <span className="dbc-mascot-speech">
            {mascot.text || `Walk the scene, Detective. ${collectedEvidence.length} of ${story.objects.length} clues found.`}
          </span>
        </div>

        <div className="dbc-keyhint">WASD / arrow keys to move · Escape to close</div>
      </div>

      {/* Math / observation index card */}
      {activeObj && cardState && (
        <div className="dbc-card-backdrop" onClick={closeCard}>
          <div className="dbc-index-card" onClick={e => e.stopPropagation()}>
            {cardState.solved ? (
              <>
                <div className="dbc-card-label">🖇 Evidence found</div>
                <div className="dbc-card-narrative">
                  <span className="dbc-evidence-cat">{catTag(cardState.evidence.category)}</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.45, margin: '0.4rem 0 0.9rem' }}>
                  {cardState.evidence.text}
                </p>
                <button className="dbc-card-submit" onClick={closeCard} style={{ width: '100%' }}>
                  Continue
                </button>
              </>
            ) : cardState.kind === 'observation' ? (
              <>
                <div className="dbc-card-label">🧐 Observation · {activeObj.name}</div>
                <p className="dbc-card-narrative">{cardState.text}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="dbc-card-submit" onClick={handleObservationCollect} style={{ flex: 1 }}>
                    Clue found 🔎
                  </button>
                  <button
                    className="dbc-primary-btn dbc-primary-btn--ghost-dark"
                    onClick={closeCard}
                    style={{ minHeight: 50, minWidth: 90, fontSize: '0.9rem', margin: 0 }}
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="dbc-card-label">🕵️ Investigation · {activeObj.name}</div>
                <p className="dbc-card-narrative">{cardState.variant.narrative}</p>
                <p className="dbc-card-question">{cardState.variant.question}</p>
                <div className="dbc-card-input-row">
                  <input
                    ref={inputRef}
                    className="dbc-card-input"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="?"
                    aria-label="Your answer"
                  />
                  <button type="submit" className="dbc-card-submit" disabled={!answer.trim()}>
                    Check
                  </button>
                </div>

                {cardState.feedback && !cardState.feedback.correct && (
                  <div className="dbc-card-wrong">Not quite — try again, Detective!</div>
                )}

                {cardState.hintsShown.map(hidx => {
                  const hint = (activeObj.investigation && activeObj.investigation.hints) || [];
                  if (!hint[hidx]) return null;
                  return (
                    <div key={hidx} className="dbc-card-hint">
                      💡 {hint[hidx]}
                    </div>
                  );
                })}

                <div style={{ textAlign: 'right', marginTop: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={closeCard}
                    style={{ background: 'none', border: 'none', color: 'rgba(42,46,51,0.85)', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', minHeight: 44 }}
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Notebook overlay (slides from the left; stays mounted for a smooth exit) */}
      <div
        className={`dbc-overlay-backdrop${notebookOpen ? ' is-open' : ''}`}
        aria-hidden={!notebookOpen}
        onClick={closeNotebook}
      />
      <div
        className={`dbc-notebook${notebookOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-label="Evidence notebook"
        aria-hidden={!notebookOpen}
      >
        <div className="dbc-notebook-header">
          <span className="dbc-notebook-title">My Notebook</span>
          <button className="dbc-notebook-close" onClick={closeNotebook} aria-label="Close Notebook">✕</button>
        </div>
        <div className="dbc-notebook-body">
          <div>
            <div className="dbc-section-label">
              Evidence Found ({collectedEvidence.length}/{story.objects.length})
            </div>
            {collectedEvidence.length === 0 ? (
              <div className="dbc-notebook-empty">Nothing in the notebook yet — keep exploring the scene.</div>
            ) : (
              collectedEvidence.map(ev => (
                <div
                  key={ev.id}
                  className={`dbc-evidence-item${selectedEvidenceId === ev.id ? ' is-selected' : ''}`}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', ev.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => setSelectedEvidenceId(null)}
                  onClick={() => toggleEvidenceSelection(ev.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Evidence: ${catTag(ev.category)} — ${ev.text}. ${selectedEvidenceId === ev.id ? 'Selected. Now tap a suspect.' : 'Tap to select, then tap a suspect.'}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEvidenceSelection(ev.id); } }}
                >
                  <div className="dbc-evidence-cat">{catTag(ev.category)}</div>
                  {ev.text}
                </div>
              ))
            )}
          </div>
          <div>
            <div className="dbc-section-label">Current Thought</div>
            {currentThoughts.length === 0 ? (
              <div className="dbc-notebook-empty">Keep exploring — your thoughts will grow as clues appear.</div>
            ) : (
              currentThoughts.map((line, i) => (
                <div key={i} className="dbc-thought-line">{line}</div>
              ))
            )}
            {thoughts.length > 1 && (
              <button
                className="dbc-thought-toggle"
                onClick={() => setShowAllThoughts(v => !v)}
                aria-pressed={showAllThoughts}
              >
                {showAllThoughts ? `Show one thought` : `Show all thoughts (${thoughts.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suspect poster overlay (slides from the right; stays mounted for a smooth exit) */}
      <div
        className={`dbc-overlay-backdrop${posterOpen ? ' is-open' : ''}`}
        aria-hidden={!posterOpen}
        onClick={() => setPosterOpen(false)}
      />
      <div
        className={`dbc-poster${posterOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-label="Suspect board"
        aria-hidden={!posterOpen}
      >
        <div className="dbc-poster-header">
          <span className="dbc-poster-title">Suspects</span>
          <button className="dbc-poster-close" onClick={() => setPosterOpen(false)} aria-label="Close Suspects">✕</button>
        </div>
        <div className="dbc-poster-body">
          {posterSuspects.map(s => (
            <div
              key={s.id}
              className={`dbc-suspect-card${s.eliminated ? ' is-eliminated' : ''}${selectedEvidenceId && !s.eliminated ? ' is-target' : ''}${accusation && accusation.id === s.id && !s.eliminated ? ' is-accusable' : ''}`}
              onDragOver={s.eliminated ? undefined : (e) => e.preventDefault()}
              onDrop={s.eliminated ? undefined : (e) => handleDrop(e, s.id)}
              onClick={s.eliminated ? undefined : () => handleSuspectTap(s.id)}
              role="button"
              tabIndex={s.eliminated ? undefined : 0}
              aria-label={`${s.name}, ${s.species}. ${s.eliminated ? 'Eliminated.' : 'Tap after selecting a clue to try elimination.'}`}
              onKeyDown={s.eliminated ? undefined : (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSuspectTap(s.id); }
              }}
            >
              <div className="dbc-suspect-head">
                <span className="dbc-suspect-emoji" aria-hidden="true">{s.animalEmoji}</span>
                <span className="dbc-suspect-name">{s.name}</span>
              </div>
              <div className="dbc-suspect-hint">{s.hint}</div>
              <div className="dbc-profile-grid">
                {Object.entries(s.profile).map(([field, value]) => (
                  <div key={field} className="dbc-profile-slot">
                    <b>{PROFILE_LABELS[field] || field}</b>
                    <span className={value === '???' ? 'dbc-qmark' : ''}>{value}</span>
                  </div>
                ))}
              </div>
              {s.eliminated && <div className="dbc-stamp">ELIMINATED</div>}
              {s.eliminated && <div className="dbc-motive-line">{s.motiveContext}</div>}
            </div>
          ))}
        </div>
        {accusation && (
          <div className="dbc-accuse-row">
            <button className="dbc-accuse-btn" onClick={handleAccuse}>
              Accuse {accusation.name}!
            </button>
          </div>
        )}
      </div>

      {exitDialogOpen && (
        <div className="dbc-exit-dialog-backdrop" onClick={() => setExitDialogOpen(false)}>
          <div className="dbc-exit-dialog" role="dialog" aria-modal="true" aria-label="Leave the case?" onClick={e => e.stopPropagation()}>
            <div className="dbc-exit-dialog-title">Leave the case?</div>
            <p className="dbc-exit-dialog-body">
              Your progress is saved — you can pick it up again from the case library.
            </p>
            <div className="dbc-exit-dialog-actions">
              <button className="dbc-primary-btn dbc-primary-btn--ghost-dark" onClick={() => setExitDialogOpen(false)}>
                Keep playing
              </button>
              <button
                className="dbc-primary-btn"
                onClick={() => { setExitDialogOpen(false); onBack(); }}
              >
                Leave for now
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="dbc-toast" role="status">{toast}</div>}
    </div>
  );
}
