/**
 * Tests for the Detective Board Cases engine + Case 1 data.
 *
 * Mirrors the existing `detective.test.jsx` suite: pure-engine and data-
 * validation coverage driven through the engine API (no DOM automation),
 * plus a mount smoke test for the BoardCasePlay shell.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

import {
  BAND_LEVELS,
  checkDetectiveAnswer,
  objectAt,
  createInitialState,
  movePlayer,
  currentVariantKey,
  getMathFor,
  registerAnswer,
  recordWrong,
  consumeHint,
  handleWrong,
  collectObservation,
  evidenceEliminates,
  applyElimination,
  remainingSuspects,
  onlyCulpritRemains,
  accusedSuspect,
  getRevealedProfile,
  getNotebookLines,
  getLatestThought,
  getThoughtsForEvidence,
  getCollectedEvidence,
  getPosterSuspects,
  validateBoardSpec,
  profileUnlocks,
} from './detective-board-engine';
import { BOARD_CASES, BOARD_CASE_1, getBoardCase, validateBoardCase } from './detective-board-cases';
import BoardCasePlay from './detective-board-app';

// ─── Helper: Simulate localStorage (for the BoardCasePlay smoke test) ──
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ─── Helper: BFS path to walk the detective to a cell (skips blocked) ──
function bfsPath(spec, from, to) {
  const size = spec.gridSize;
  const blocked = new Set(spec.blocked.map(([x, y]) => `${x},${y}`));
  const key = (x, y) => `${x},${y}`;
  const queue = [[from[0], from[1]]];
  const prev = { [key(from[0], from[1])]: null };
  while (queue.length) {
    const [cx, cy] = queue.shift();
    if (cx === to[0] && cy === to[1]) break;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (blocked.has(key(nx, ny))) continue;
      if (prev[key(nx, ny)] !== undefined) continue;
      prev[key(nx, ny)] = [cx, cy];
      queue.push([nx, ny]);
    }
  }
  const moves = [];
  let cur = to;
  while (cur && prev[key(cur[0], cur[1])] !== null && prev[key(cur[0], cur[1])] !== undefined) {
    const p = prev[key(cur[0], cur[1])];
    moves.unshift([cur[0] - p[0], cur[1] - p[1]]);
    cur = p;
  }
  return moves;
}

function walkTo(state, spec, cell) {
  const moves = bfsPath(spec, state.playerPos, cell);
  let s = state;
  let lastEvent = null;
  for (const [dx, dy] of moves) {
    const r = movePlayer(s, spec, dx, dy);
    s = r.state;
    lastEvent = r.event;
  }
  return { state: s, lastEvent };
}

// ═══ Schema validation (Case 1) ══════════════════════════════════════

describe('Board case schema validation', () => {
  test('validateBoardCase(board-1) passes with zero problems', () => {
    expect(validateBoardCase(BOARD_CASE_1)).toEqual([]);
  });

  test('every investigation object has E/M/H variants whose answers all equal the evidence value', () => {
    for (const obj of BOARD_CASE_1.objects) {
      if (obj.clueType !== 'investigation') continue;
      const m = obj.investigation.math;
      expect(m.easy).toBeDefined();
      expect(m.medium).toBeDefined();
      expect(m.hard).toBeDefined();
      const answers = [m.easy.answer, m.medium.answer, m.hard.answer];
      expect(new Set(answers.map(String)).size).toBe(1);
      expect(typeof m.easy.answer).toBe('number');
    }
  });

  test('every eliminates entry targets a real non-culprit suspect', () => {
    const ids = BOARD_CASE_1.suspects.map(s => s.id);
    for (const rule of BOARD_CASE_1.eliminationRules) {
      for (const sid of rule.eliminates) {
        expect(ids).toContain(sid);
        expect(sid).not.toBe(BOARD_CASE_1.culprit);
      }
    }
    // The culprit never appears in any rule — un-eliminable by design.
    const allEliminated = BOARD_CASE_1.eliminationRules.flatMap(r => r.eliminates);
    expect(allEliminated).not.toContain(BOARD_CASE_1.culprit);
  });

  test('every suspect has at least one unlockable profile slot', () => {
    const unlockMap = {};
    for (const obj of BOARD_CASE_1.objects) {
      for (const u of profileUnlocks(obj)) {
        if (!unlockMap[u.suspectId]) unlockMap[u.suspectId] = new Set();
        unlockMap[u.suspectId].add(u.field);
      }
    }
    for (const s of BOARD_CASE_1.suspects) {
      expect(unlockMap[s.id]).toBeDefined();
      expect(unlockMap[s.id].size).toBeGreaterThan(0);
    }
  });

  test('every evidence id is unique; currentThoughts reference real evidence', () => {
    const ids = BOARD_CASE_1.objects.map(o => o.evidence.id);
    expect(new Set(ids).size).toBe(ids.length);
    const thoughtIds = BOARD_CASE_1.currentThoughts.flatMap(t => t.afterEvidenceIds);
    for (const id of thoughtIds) expect(ids).toContain(id);
  });

  test('each elimination evidence reveals a relevant field of the eliminated suspect', () => {
    const unlockIndex = {};
    for (const obj of BOARD_CASE_1.objects) {
      for (const u of profileUnlocks(obj)) {
        if (!unlockIndex[u.suspectId]) unlockIndex[u.suspectId] = new Set();
        unlockIndex[u.suspectId].add(u.field);
      }
    }
    for (const rule of BOARD_CASE_1.eliminationRules) {
      for (const sid of rule.eliminates) {
        expect(unlockIndex[sid] && unlockIndex[sid].size).toBeGreaterThan(0);
      }
    }
  });

  test('registry helpers work', () => {
    expect(getBoardCase('board-1')).toBe(BOARD_CASE_1);
    expect(getBoardCase('nope')).toBeNull();
    expect(BOARD_CASES).toContain(BOARD_CASE_1);
  });

  test('validateBoardSpec catches a culprit in an elimination rule', () => {
    const bad = JSON.parse(JSON.stringify(BOARD_CASE_1));
    bad.eliminationRules[0] = { evidenceId: 'ev-footprints', eliminates: ['riya'] };
    expect(validateBoardSpec(bad).some(p => p.includes('culprit'))).toBe(true);
  });
});

// ═══ Engine: movement ═════════════════════════════════════════════════

describe('Board engine — movement', () => {
  test('moving beyond the edge returns ok:false edge', () => {
    const s = createInitialState(BOARD_CASE_1);
    const res = movePlayer(s, BOARD_CASE_1, 0, -100);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('edge');
  });

  test('moving into a blocked cell returns ok:false blocked', () => {
    const s = createInitialState(BOARD_CASE_1);
    // [1,1] is the pond; path playerStart [6,6] -> [6,5] -> [5,5] -> ... (not needed)
    // Just force position adjacent to a blocked cell and attempt the step.
    const near = { ...s, playerPos: [4, 1] };
    const res = movePlayer(near, BOARD_CASE_1, -1, 0); // into [3,1] (pond)
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('blocked');
  });

  test('plain steps move one tile and never change other state', () => {
    const s = createInitialState(BOARD_CASE_1);
    const r = movePlayer(s, BOARD_CASE_1, 1, 0);
    expect(r.ok).toBe(true);
    expect(r.event.type).toBe('moved');
    expect(r.state.playerPos).toEqual([7, 6]);
    expect(r.state.collectedEvidenceIds).toEqual([]);
  });

  test('diagonal movement happens as two orthogonal steps', () => {
    const s = createInitialState(BOARD_CASE_1);
    const r1 = movePlayer(s, BOARD_CASE_1, 1, 0);
    const r2 = movePlayer(r1.state, BOARD_CASE_1, 0, 1);
    expect(r2.state.playerPos).toEqual([7, 7]);
  });

  test('every object is reachable from the player start', () => {
    for (const obj of BOARD_CASE_1.objects) {
      const s = createInitialState(BOARD_CASE_1);
      const { state, lastEvent } = walkTo(s, BOARD_CASE_1, obj.cell);
      expect(state.playerPos).toEqual(obj.cell);
      expect(lastEvent.type).toBe('object');
    }
  });

  test('stepping onto an object opens it; re-stepping reports already-collected', () => {
    let s = createInitialState(BOARD_CASE_1);
    let r = walkTo(s, BOARD_CASE_1, [2, 3]);
    expect(r.lastEvent.type).toBe('object');
    expect(r.lastEvent.objectId).toBe('footprints');
    s = r.state;

    // Solve it, then walk away and back.
    const solved = registerAnswer(s, BOARD_CASE_1, objectAt(BOARD_CASE_1, 2, 3), '15');
    expect(solved.correct).toBe(true);
    let away = walkTo(solved.state, BOARD_CASE_1, [6, 6]);
    const back = walkTo(away.state, BOARD_CASE_1, [2, 3]);
    expect(back.lastEvent.type).toBe('already-collected');
  });
});

// ═══ Engine: silent band & variant selection ═══════════════════════════

describe('Board engine — silent difficulty band', () => {
  const footprints = objectAt(BOARD_CASE_1, 2, 3);

  test('default band is Easy (0) and selects the easy variant', () => {
    const s = createInitialState(BOARD_CASE_1);
    expect(s.band).toBe(0);
    expect(currentVariantKey(s, footprints)).toBe('easy');
    expect(getMathFor(s, footprints).answer).toBe(15);
  });

  test('2 consecutive correct answers nudge the band up', () => {
    const s = createInitialState(BOARD_CASE_1);
    const r1 = registerAnswer(s, BOARD_CASE_1, footprints, '15');
    expect(r1.state.band).toBe(0);
    const r2 = registerAnswer(r1.state, BOARD_CASE_1, footprints, '15');
    expect(r2.state.band).toBe(1);
  });

  test('2 wrong answers nudge the band down', () => {
    const s = createInitialState(BOARD_CASE_1, { initialBand: 1 });
    const w1 = recordWrong(s);
    expect(w1.band).toBe(1);
    const w2 = recordWrong(w1);
    expect(w2.band).toBe(0);
  });

  test('band clamps at the top (2)', () => {
    const s = createInitialState(BOARD_CASE_1, { initialBand: 2 });
    const r1 = registerAnswer(s, BOARD_CASE_1, footprints, '15');
    const r2 = registerAnswer(r1.state, BOARD_CASE_1, footprints, '15');
    expect(r2.state.band).toBe(2);
  });

  test('band clamps at the bottom (0)', () => {
    const s = createInitialState(BOARD_CASE_1, { initialBand: 0 });
    const w1 = recordWrong(s);
    const w2 = recordWrong(w1);
    expect(w2.band).toBe(0);
  });

  test('band levels are easy/medium/hard', () => {
    expect(BAND_LEVELS).toEqual(['easy', 'medium', 'hard']);
  });
});

// ═══ Engine: hint ladder ══════════════════════════════════════════════

describe('Board engine — hint ladder', () => {
  const footprints = objectAt(BOARD_CASE_1, 2, 3);

  test('wrong → hint 1, wrong → hint 2, then easy variant is offered', () => {
    let s = createInitialState(BOARD_CASE_1);
    const hw1 = handleWrong(s, footprints);
    expect(hw1.hintIndex).toBe(0);
    expect(hw1.offeredEasy).toBe(false);
    expect(hw1.state.hintsUsedPerObject.footprints).toBe(1);

    const hw2 = handleWrong(hw1.state, footprints);
    expect(hw2.hintIndex).toBe(1);
    expect(hw2.offeredEasy).toBe(true);
    expect(hw2.state.hintsUsedPerObject.footprints).toBe(2);

    expect(currentVariantKey(hw2.state, footprints)).toBe('easy');
  });

  test('totalHintsUsed accumulates across objects', () => {
    let s = createInitialState(BOARD_CASE_1);
    const hw = handleWrong(s, footprints);
    expect(hw.state.totalHintsUsed).toBe(1);
    const milk = objectAt(BOARD_CASE_1, 11, 2);
    const hw2 = consumeHint(hw.state, milk.id);
    expect(hw2.state.totalHintsUsed).toBe(2);
    expect(hw2.state.hintsUsedPerObject.milk).toBe(1);
  });

  test('answer tolerance: units and numeric tolerance are accepted', () => {
    expect(checkDetectiveAnswer(15, '15 cm')).toBe(true);
    expect(checkDetectiveAnswer(15, ' 15 ')).toBe(true);
    expect(checkDetectiveAnswer(15, '15.004')).toBe(true);
    expect(checkDetectiveAnswer(15, '16')).toBe(false);
    expect(checkDetectiveAnswer('40', '40')).toBe(true);
  });
});

// ═══ Engine: gradual reveal & notebook ════════════════════════════════

describe('Board engine — notebook & suspect board', () => {
  const mila = BOARD_CASE_1.suspects.find(s => s.id === 'mila');
  const riya = BOARD_CASE_1.suspects.find(s => s.id === 'riya');

  test('profile slots show ??? until the unlocking clue is collected', () => {
    expect(getRevealedProfile(mila, BOARD_CASE_1, []).footprint).toBe('???');
    expect(getRevealedProfile(mila, BOARD_CASE_1, ['ev-footprints']).footprint).toBe('4 cm');
  });

  test('uncollected observations keep slots hidden', () => {
    expect(getRevealedProfile(riya, BOARD_CASE_1, []).colour).toBe('???');
    expect(getRevealedProfile(riya, BOARD_CASE_1, ['ev-feather']).colour).toBe('white fur');
  });

  test('currentThoughts activate only when their evidence is collected', () => {
    expect(getNotebookLines(BOARD_CASE_1, [])).toEqual([]);
    const lines = getNotebookLines(BOARD_CASE_1, ['ev-footprints']);
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Mila');
  });

  test('the combined aha thought appears once all three elimination clues are found', () => {
    const lines = getNotebookLines(BOARD_CASE_1, ['ev-footprints', 'ev-clock', 'ev-muddy']);
    expect(lines.some(l => l.includes('Riya'))).toBe(true);
  });

  test('getLatestThought returns nothing before any clue and only the newest thought after', () => {
    expect(getLatestThought(BOARD_CASE_1, [])).toEqual([]);
    const two = getLatestThought(BOARD_CASE_1, ['ev-footprints', 'ev-clock']);
    expect(two).toHaveLength(1);
    expect(two[0]).toContain('Leo');
    const all = getLatestThought(BOARD_CASE_1, ['ev-footprints', 'ev-clock', 'ev-muddy']);
    expect(all).toHaveLength(1);
    expect(all[0]).toContain('Riya');
  });

  test('getThoughtsForEvidence returns only the thought unlocked by that clue', () => {
    const ft = getThoughtsForEvidence(BOARD_CASE_1, ['ev-footprints'], 'ev-footprints');
    expect(ft).toHaveLength(1);
    expect(ft[0]).toContain('Mila');
    expect(getThoughtsForEvidence(BOARD_CASE_1, ['ev-footprints'], 'ev-clock')).toEqual([]);
  });

  test('getThoughtsForEvidence surfaces the combined aha thought once all its clues are found', () => {
    const lines = getThoughtsForEvidence(BOARD_CASE_1, ['ev-footprints', 'ev-clock', 'ev-muddy'], 'ev-muddy');
    expect(lines.some(l => l.includes('Riya'))).toBe(true);
  });

  test('collected evidence returns in spec object order', () => {
    const ev = getCollectedEvidence(BOARD_CASE_1, ['ev-clock', 'ev-footprints']);
    expect(ev[0].id).toBe('ev-footprints');
    expect(ev[1].id).toBe('ev-clock');
  });

  test('poster suspects carry revealed profiles and eliminated flags', () => {
    const collected = collectObservation(createInitialState(BOARD_CASE_1), objectAt(BOARD_CASE_1, 2, 3));
    const eliminated = applyElimination(collected.state, BOARD_CASE_1, 'ev-footprints', 'mila');
    expect(eliminated.ok).toBe(true);
    const poster = getPosterSuspects(BOARD_CASE_1, eliminated.state);
    const milaPoster = poster.find(x => x.id === 'mila');
    expect(milaPoster.eliminated).toBe(true);
    expect(milaPoster.profile.footprint).toBe('4 cm');
    const teddyPoster = poster.find(x => x.id === 'teddy');
    expect(teddyPoster.eliminated).toBe(false);
  });
});

// ═══ Engine: elimination ══════════════════════════════════════════════

describe('Board engine — elimination', () => {
  test('valid elimination applies; invalid and repeated ones do not', () => {
    const s = createInitialState(BOARD_CASE_1);
    // Not collected yet → refused
    expect(applyElimination(s, BOARD_CASE_1, 'ev-footprints', 'mila').reason).toBe('not-collected');

    const collected = collectObservation(s, objectAt(BOARD_CASE_1, 2, 3));
    const ok = applyElimination(collected.state, BOARD_CASE_1, 'ev-footprints', 'mila');
    expect(ok.ok).toBe(true);
    expect(ok.state.eliminatedIds).toContain('mila');

    // Repeated → already
    expect(applyElimination(ok.state, BOARD_CASE_1, 'ev-footprints', 'mila').reason).toBe('already');

    // Wrong suspect for that evidence → no-contradiction
    expect(applyElimination(ok.state, BOARD_CASE_1, 'ev-footprints', 'leo').reason).toBe('no-contradiction');
  });

  test('the culprit cannot be eliminated by any evidence', () => {
    for (const rule of BOARD_CASE_1.eliminationRules) {
      expect(evidenceEliminates(BOARD_CASE_1, rule.evidenceId, BOARD_CASE_1.culprit)).toBe(false);
    }
  });

  test('only the culprit remains after all three eliminations → accusation ready', () => {
    const s = createInitialState(BOARD_CASE_1);
    let state = s;
    // Collect all three investigation clues and eliminate the innocents.
    for (const [cell, evidenceId, suspectId, answer] of [
      [[2, 3], 'ev-footprints', 'mila', '15'],
      [[9, 6], 'ev-clock', 'leo', '40'],
      [[4, 8], 'ev-muddy', 'teddy', '12'],
    ]) {
      const walked = walkTo(state, BOARD_CASE_1, cell);
      const obj = objectAt(BOARD_CASE_1, cell[0], cell[1]);
      const solved = registerAnswer(walked.state, BOARD_CASE_1, obj, answer);
      expect(solved.correct).toBe(true);
      expect(solved.state.collectedEvidenceIds).toContain(evidenceId);
      const elim = applyElimination(solved.state, BOARD_CASE_1, evidenceId, suspectId);
      expect(elim.ok).toBe(true);
      state = elim.state;
    }

    expect(remainingSuspects(BOARD_CASE_1, state).map(s => s.id)).toEqual(['riya']);
    expect(onlyCulpritRemains(BOARD_CASE_1, state)).toBe(true);
    const accusation = accusedSuspect(BOARD_CASE_1, state);
    expect(accusation.id).toBe('riya');
  });
});

// ═══ Integration: full run through the engine + shell smoke test ═══════

describe('Board case integration', () => {
  test('full detective flow: walk → solve → eliminate → accuse → onComplete', () => {
    let s = createInitialState(BOARD_CASE_1);
    const flow = [
      { cell: [2, 3], answer: '15', evidence: 'ev-footprints', eliminate: 'mila' },
      { cell: [9, 6], answer: '40', evidence: 'ev-clock', eliminate: 'leo' },
      { cell: [4, 8], answer: '12', evidence: 'ev-muddy', eliminate: 'teddy' },
    ];
    for (const step of flow) {
      const { state } = walkTo(s, BOARD_CASE_1, step.cell);
      const obj = objectAt(BOARD_CASE_1, step.cell[0], step.cell[1]);
      const solved = registerAnswer(state, BOARD_CASE_1, obj, step.answer);
      expect(solved.correct).toBe(true);
      expect(solved.state.collectedEvidenceIds).toContain(step.evidence);
      const elim = applyElimination(solved.state, BOARD_CASE_1, step.evidence, step.eliminate);
      expect(elim.ok).toBe(true);
      s = elim.state;
    }

    // The milk jug is a fourth investigation clue (no elimination rule).
    const milkWalk = walkTo(s, BOARD_CASE_1, [11, 2]);
    const milk = objectAt(BOARD_CASE_1, 11, 2);
    const milkSolved = registerAnswer(milkWalk.state, BOARD_CASE_1, milk, '25');
    expect(milkSolved.correct).toBe(true);
    s = milkSolved.state;

    // Observation clues can be collected too (they enrich the poster).
    for (const cell of [[5, 4], [7, 9], [0, 10]]) {
      const { state } = walkTo(s, BOARD_CASE_1, cell);
      const obj = objectAt(BOARD_CASE_1, cell[0], cell[1]);
      const res = collectObservation(state, obj);
      expect(res.event.type).toBe('clue-found');
      s = res.state;
    }
    expect(s.collectedEvidenceIds).toHaveLength(7);
    expect(accusedSuspect(BOARD_CASE_1, s).id).toBe('riya');

    // Completion meta mirrors what BoardCasePlay reports to onComplete.
    const meta = {
      totalHintsUsed: s.totalHintsUsed,
      correctCount: s.correctCount,
      wrongCount: s.wrongCount,
      totalQuestions: s.correctCount + s.wrongCount,
      skillFamily: BOARD_CASE_1.skillFamily,
    };
    expect(meta.skillFamily).toBe('addsub');
    expect(meta.correctCount).toBe(4);
    expect(meta.wrongCount).toBe(0);
  });

  test('BoardCasePlay mounts and shows the intro briefing', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onComplete = vi.fn();
    const onBack = vi.fn();
    let root;
    act(() => {
      root = createRoot(container);
      root.render(
        <BoardCasePlay story={BOARD_CASE_1} onComplete={onComplete} onBack={onBack} />
      );
    });
    expect(container.textContent).toContain('Start the Investigation');
    expect(container.textContent).toContain('Riya');
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  test('BoardCasePlay resumes an in-progress scene from initialState', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onComplete = vi.fn();
    const onBack = vi.fn();
    const snap = {
      phase: 'exploring',
      boardSnapshot: {
        playerPos: [2, 3],
        collectedEvidenceIds: ['ev-footprints'],
        eliminatedIds: ['mila'],
        band: 0,
        hintsUsedPerObject: {},
        correctCount: 1,
        wrongCount: 0,
        totalHintsUsed: 0,
      },
    };
    let root;
    act(() => {
      root = createRoot(container);
      root.render(
        <BoardCasePlay story={BOARD_CASE_1} onComplete={onComplete} onBack={onBack} initialState={snap} />
      );
    });
    expect(container.textContent).toContain('Suspects');
    expect(container.textContent).toContain('1 of 7 clues found');
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  // ─── Exit dialog (leave mid-case, resume later) ────────────────────

  const renderExploring = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onComplete = vi.fn();
    const onBack = vi.fn();
    const snap = {
      phase: 'exploring',
      boardSnapshot: {
        playerPos: [2, 3],
        collectedEvidenceIds: ['ev-footprints'],
        eliminatedIds: ['mila'],
        band: 0,
        hintsUsedPerObject: {},
        correctCount: 1,
        wrongCount: 0,
        totalHintsUsed: 0,
      },
    };
    let root;
    act(() => {
      root = createRoot(container);
      root.render(
        <BoardCasePlay story={BOARD_CASE_1} onComplete={onComplete} onBack={onBack} initialState={snap} />
      );
    });
    const clickText = (text) => {
      const btn = [...container.querySelectorAll('button')].find(b => (b.textContent || '').includes(text));
      expect(btn).toBeTruthy();
      act(() => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    };
    return { container, root, onComplete, onBack, clickText };
  };

  test('BoardCasePlay shows a leave button while exploring', () => {
    const { container, root } = renderExploring();
    expect(container.querySelector('.dbc-exit-btn')).toBeTruthy();
    expect(container.textContent).toContain('←');
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  test('BoardCasePlay opens the leave dialog when the exit button is tapped', () => {
    const { container, root, clickText } = renderExploring();
    clickText('←');
    expect(container.textContent).toContain('Leave the case?');
    expect(container.textContent).toContain('Keep playing');
    expect(container.textContent).toContain('Leave for now');
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  test('BoardCasePlay invokes onBack when leaving the case', () => {
    const { container, root, onBack, clickText } = renderExploring();
    clickText('←');
    clickText('Leave for now');
    expect(onBack).toHaveBeenCalledTimes(1);
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  test('BoardCasePlay keeps playing when the dialog is dismissed', () => {
    const { container, root, onBack, clickText } = renderExploring();
    clickText('←');
    clickText('Keep playing');
    expect(onBack).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain('Leave the case?');
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });
});
