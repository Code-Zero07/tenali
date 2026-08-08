/**
 * DETECTIVE BOARD CASES — data only.
 *
 * The Narrative engine: fully authored board-case specs for the Math
 * Detective Agency's crime-scene case type. Cases 2 & 3 (the elephant
 * mastermind arc) are future pure-data additions in this file — the
 * engine (`detective-board-engine.js`) is complete and unchanged.
 *
 * All specs are validated by `validateBoardCase` at dev load and in tests.
 */

import { validateBoardSpec } from './detective-board-engine';

// ─── Case 1 — The Vanished Birthday Cupcakes ─────────────────────────
// Greenleaf Animal School, baking celebration day. The class cupcakes
// vanished minutes before snack time. Warm, low-stakes, no villainy.

export const BOARD_CASE_1 = {
  type: 'board',
  id: 'board-1',
  caseNumber: 1,
  title: 'The Vanished Birthday Cupcakes',
  description: 'The class cupcakes vanished before snack time. Can you crack the case?',
  difficulty: 1,
  xpReward: 60,
  topic: 'adventure',
  skillFamily: 'addsub',
  ageRange: [6, 9],
  gridSize: 12,
  blocked: [
    [1, 1], [2, 1], [3, 1], [1, 2], // the school pond
    [10, 8], [10, 9], [11, 9],      // the garden fence
  ],
  playerStart: [6, 6],
  briefing:
    'The cupcakes vanished before snack time! Walk the school, Detective — step on anything interesting and find the thief!',

  suspects: [
    {
      id: 'leo', name: 'Leo', animalEmoji: '🦁', species: 'lion',
      hint: 'Loves chocolate. A bit of a show-off.',
      profile: { favouriteFood: 'chocolate', footprint: '16 cm', colour: 'golden mane', timing: 'led gym at 9:40' },
      motiveContext: "Leo was leading the gym drills at 9:40 — the exact minute the cupcakes vanished — in front of the whole class. He couldn't be in the kitchen and the gym at the same time. A show-off, but not a cupcake thief.",
    },
    {
      id: 'mila', name: 'Mila', animalEmoji: '🐭', species: 'mouse',
      hint: 'Tiny, quiet and shy.',
      profile: { favouriteFood: 'cheese', footprint: '4 cm', colour: 'grey fur', timing: 'on time' },
      motiveContext: "Mila is tiny and shy — her paw prints measure only 4 cm. The kitchen print was 15 cm, far too big for her to make alone. She arrived on time and sat quietly in class.",
    },
    {
      id: 'teddy', name: 'Teddy', animalEmoji: '🐻', species: 'bear',
      hint: 'Big, clumsy, forgetful. Leaves mud everywhere.',
      profile: { favouriteFood: 'honey', footprint: '18 cm', colour: 'brown fur', timing: 'late (after the rain)' },
      motiveContext: "Teddy's muddy trail is old and dry — from before the rain. The kitchen trail is fresh and wet, so it can't be his. He's clumsy and forgetful, not sneaky.",
    },
    {
      id: 'riya', name: 'Riya', animalEmoji: '🐰', species: 'rabbit',
      hint: 'Quick, eager to please, always watching the clock.',
      profile: { favouriteFood: 'carrots', footprint: '9 cm', colour: 'white fur', timing: 'early, always' },
      motiveContext: "Riya wanted to help the tired teacher. She hid the cupcakes to decorate them as a surprise — she just forgot to ask permission first.",
    },
  ],
  culprit: 'riya',

  objects: [
    {
      id: 'footprints',
      cell: [2, 3], emoji: '🦶', name: 'Footprints by the door',
      category: 'identity',
      clueType: 'investigation',
      investigation: {
        hints: [
          'Use the little ruler on your badge. Measure the front part and the back part together.',
          'The front part is 8 cm and the back part is 7 cm. What is 8 + 7?',
        ],
        math: {
          easy: {
            narrative: 'Two clear prints lead to the kitchen door. The front part of the print is 8 cm long and the back part is 7 cm long.',
            question: 'How long is the whole footprint?',
            answer: 15,
          },
          medium: {
            narrative: 'The whole footprint is 20 cm long. The toe part measures 5 cm.',
            question: 'How long is the heel part of the print?',
            answer: 15,
          },
          hard: {
            narrative: 'A print is 3 steps long, and each step makes it 5 cm longer.',
            question: '3 steps of 5 cm each — how long is the whole print?',
            answer: 15,
          },
        },
        unlocksProfile: [
          { suspectId: 'mila', field: 'footprint' },
          { suspectId: 'leo', field: 'footprint' },
          { suspectId: 'teddy', field: 'footprint' },
          { suspectId: 'riya', field: 'footprint' },
        ],
      },
      evidence: { id: 'ev-footprints', text: 'The print at the door is 15 cm long — measured with the ruler on your badge.', category: 'identity' },
    },
    {
      id: 'clock',
      cell: [9, 6], emoji: '⏰', name: 'Classroom clock',
      category: 'time',
      clueType: 'investigation',
      investigation: {
        hints: [
          'The long hand points to the 8. Each number on a clock is worth 5 minutes.',
          'Count by fives up to the 8: 5, 10, 15, 20, 25, 30, 35, 40. That is 8 × 5.',
        ],
        math: {
          easy: {
            narrative: 'The classroom clock was the only witness! The long hand points to the 8.',
            question: '8 × 5 = ? How many minutes does the long hand show?',
            answer: 40,
          },
          medium: {
            narrative: 'The clock stopped at 9:40 — the minute the cupcakes vanished. Snack time is at 10:00, exactly 20 minutes later.',
            question: '60 − 20 = ? How many minutes after 9:00 did the cupcakes vanish?',
            answer: 40,
          },
          hard: {
            narrative: 'The clock is frozen at 9:40. That is two lots of 20 minutes after 9:00.',
            question: '2 × 20 = ? How many minutes past 9:00 is it?',
            answer: 40,
          },
        },
        unlocksProfile: [
          { suspectId: 'leo', field: 'timing' },
          { suspectId: 'teddy', field: 'timing' },
          { suspectId: 'riya', field: 'timing' },
        ],
      },
      evidence: { id: 'ev-clock', text: 'The classroom clock stopped at 9:40 — the exact minute the cupcakes vanished.', category: 'time' },
    },
    {
      id: 'muddy',
      cell: [4, 8], emoji: '🐾', name: 'Muddy trail',
      category: 'location',
      clueType: 'investigation',
      investigation: {
        hints: [
          'Only the fresh WET prints tell the story. The old dry ones are from before the rain.',
          'The fresh prints are two rows of six. What is 2 × 6?',
        ],
        math: {
          easy: {
            narrative: 'A trail of prints crosses the kitchen. Some are old and dry, but the fresh wet ones near the sink are the clue.',
            question: '5 + 7 = ? How many fresh wet prints are there?',
            answer: 12,
          },
          medium: {
            narrative: 'The trail had 18 prints in total, but 6 of them are old and dry — from before the rain.',
            question: '18 − 6 = ? How many prints are fresh and wet?',
            answer: 12,
          },
          hard: {
            narrative: 'The fresh prints make two neat rows, with 6 prints in each row.',
            question: '2 rows of 6 — how many fresh wet prints is that?',
            answer: 12,
          },
        },
        unlocksProfile: [
          { suspectId: 'teddy', field: 'colour' },
          { suspectId: 'mila', field: 'colour' },
          { suspectId: 'leo', field: 'colour' },
        ],
      },
      evidence: { id: 'ev-muddy', text: 'The fresh wet trail has 12 prints. Teddy\'s old prints are dry — from before the rain.', category: 'location' },
    },
    {
      id: 'milk',
      cell: [11, 2], emoji: '🥛', name: 'Spilled milk jug',
      category: 'motive',
      clueType: 'investigation',
      investigation: {
        hints: [
          'Look at the little marks on the jug — the baker marked off each cup they poured.',
          'Five baking trays, five cups of milk in each. What is 5 × 5?',
        ],
        math: {
          easy: {
            narrative: 'A milk jug rests near the kitchen sink, with marks showing every cup poured out.',
            question: '15 + 10 = ? How many cups of milk were measured?',
            answer: 25,
          },
          medium: {
            narrative: 'The jug held 30 cups of milk. A little spilled, and 25 cups were used.',
            question: '30 − 5 = ? How many cups of milk were measured out?',
            answer: 25,
          },
          hard: {
            narrative: 'The baker measured milk for five trays, with five cups of milk in each.',
            question: '5 × 5 = ? How many cups of milk were measured?',
            answer: 25,
          },
        },
        unlocksProfile: [],
      },
      evidence: { id: 'ev-milk', text: 'Someone measured 25 cups of milk — enough for a whole batch of secret baking.', category: 'motive' },
    },
    {
      id: 'icecream',
      cell: [5, 4], emoji: '🍦', name: 'Ice cream cart',
      category: 'motive',
      clueType: 'observation',
      observation: {
        text: 'The ice cream cart is still full — only vanilla is left. Someone took the last chocolate scoop. Who is the biggest chocolate lover in class?',
        unlocksProfile: [{ suspectId: 'leo', field: 'favouriteFood' }],
      },
      evidence: { id: 'ev-icecream', text: 'Only vanilla left at the cart — someone took the last chocolate scoop.', category: 'motive' },
    },
    {
      id: 'feather',
      cell: [7, 9], emoji: '🪶', name: 'Blue feather',
      category: 'identity',
      clueType: 'observation',
      observation: {
        text: 'A single blue feather rests on the kitchen windowsill — the same shade as the feather in Riya\'s hair. She wears it over her fluffy white fur.',
        unlocksProfile: [{ suspectId: 'riya', field: 'colour' }],
      },
      evidence: { id: 'ev-feather', text: 'A blue feather, the same shade as the one in Riya\'s hair.', category: 'identity' },
    },
    {
      id: 'chalkboard',
      cell: [0, 10], emoji: '📝', name: 'Chalkboard note',
      category: 'location',
      clueType: 'observation',
      observation: {
        text: 'The chalkboard timetable shows gym drills at 9:40 with Leo — and a neat tick beside "Mila arrived on time" in careful handwriting.',
        unlocksProfile: [{ suspectId: 'mila', field: 'timing' }],
      },
      evidence: { id: 'ev-chalkboard', text: 'Timetable: gym at 9:40 with Leo. A tick shows Mila arrived on time.', category: 'location' },
    },
  ],

  eliminationRules: [
    { evidenceId: 'ev-footprints', eliminates: ['mila'] },
    { evidenceId: 'ev-clock', eliminates: ['leo'] },
    { evidenceId: 'ev-muddy', eliminates: ['teddy'] },
  ],

  currentThoughts: [
    { afterEvidenceIds: ['ev-footprints'], lines: ['The kitchen print is 15 cm long — far too big for tiny Mila\'s 4 cm paws!'] },
    { afterEvidenceIds: ['ev-clock'], lines: ['The clock froze at 9:40 — the exact minute Leo was leading gym in front of the whole class.'] },
    { afterEvidenceIds: ['ev-muddy'], lines: ['12 fresh wet prints in the kitchen. Teddy\'s trail is old and dry — from before the rain.'] },
    { afterEvidenceIds: ['ev-milk'], lines: ['25 cups of milk measured out — that\'s a whole batch of secret baking. Someone is baking something!'] },
    { afterEvidenceIds: ['ev-icecream'], lines: ['Only vanilla left at the cart — someone took the last chocolate scoop. Leo is the chocolate fan.'] },
    { afterEvidenceIds: ['ev-feather'], lines: ['A blue feather, the same shade as the one in Riya\'s hair. She was near the hiding spot.'] },
    { afterEvidenceIds: ['ev-chalkboard'], lines: ['The timetable shows Mila arrived on time — she was in class, not the kitchen.'] },
    { afterEvidenceIds: ['ev-footprints', 'ev-clock', 'ev-muddy'], lines: ['Mila, Leo and Teddy all have alibis... that leaves only one classmate: Riya!'] },
  ],

  confession: {
    culpritNarrative:
      'Riya\'s ears droop. "I hid the cupcakes to decorate them as a surprise for the teacher. I just... forgot to ask first." She hands you a folded note. "Mr. B asked me to give you this."',
    mrBNote: 'Excellent observation, Detective.\nEvery mystery begins with listening.',
    resolution:
      "The teacher hugs Riya warmly. \"Decorated cupcakes are my favourite kind of surprise,\" she says. The whole class pitches in, and by snack time the cupcakes are decorated, shared and delicious.",
  },
};

export const BOARD_CASES = [BOARD_CASE_1];

/** Returns the board case spec for an id, or null. */
export function getBoardCase(id) {
  return BOARD_CASES.find(c => c.id === id) || null;
}

/**
 * Validate a board case spec (thin alias over the engine validator).
 * Returns string[] of problems; an empty array means the spec is valid.
 */
export function validateBoardCase(spec) {
  return validateBoardSpec(spec);
}
