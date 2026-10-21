/**
 * TEST SUITE: Daily Warmup & Weekly Habit Engine (RFC 0001 Milestone 1)
 */

const assert = require('assert');
const {
  calculateDecayPriority,
  selectWarmupTopics,
  generateWarmupQuestion,
  normalizeWeeklyHabit,
  isWarmupCompletedToday,
  recordWarmupCompletion,
  getIsoWeek,
  getTodayDateString,
  updateTopicSpacingLadder,
  INTERVAL_DAYS,
  nextInterval,
  TOPIC_APP_KEYS
} = require('./lib/dailyWarmup');

console.log('--- RUNNING DAILY WARMUP & WEEKLY HABIT TESTS ---');

// 1. Test BKT Decay Math
console.log('\n[1] Testing Memory Decay Priority Calculation...');
const now = Date.now();
const todayTopic = calculateDecayPriority(0.8, now); // practiced today
const weekAgoTopic = calculateDecayPriority(0.8, now - 7 * 86400000); // practiced 7 days ago
const lowMasteryWeekAgo = calculateDecayPriority(0.2, now - 7 * 86400000); // low mastery 7 days ago

assert(todayTopic < weekAgoTopic, 'Freshly practiced topic must have lower decay priority than 7-day-old topic');
assert(weekAgoTopic < lowMasteryWeekAgo, 'Low mastery topic must have higher decay priority than high mastery topic');
console.log(`✓ Decay scores: today=${todayTopic}, weekAgo=${weekAgoTopic}, lowMasteryWeekAgo=${lowMasteryWeekAgo}`);

// 2. Test Warmup Topic Selection
console.log('\n[2] Testing Warmup Topic Selection...');
// Guest / empty history fallback:
const guestSelection = selectWarmupTopics([], 3);
assert.strictEqual(guestSelection.length, 3, 'Guest selection should return exactly 3 questions');
assert(guestSelection.every(s => s.isFallback), 'Empty history should use fallback foundational topics');
console.log('✓ Guest fallback topics:', guestSelection.map(s => s.topic));

// User with history:
const userHistory = [
  { topic: 'addition', pMastery: 0.9, lastPracticedAt: now },
  { topic: 'lineq', pMastery: 0.3, lastPracticedAt: now - 10 * 86400000 },
  { topic: 'fractions', pMastery: 0.5, lastPracticedAt: now - 5 * 86400000 }
];
const userSelection = selectWarmupTopics(userHistory, 3);
assert.strictEqual(userSelection.length, 3);
assert.strictEqual(userSelection[0].topic, 'lineq', 'Most decayed topic (lineq) should be prioritized first');
console.log('✓ Priority sorted topics:', userSelection.map(s => `${s.topic} (decay: ${s.decayPriority})`));

// 3. Test Question Generators & Conceptual Refresher Tips & App Keys
console.log('\n[3] Testing Question Generation & Concept Refresher Tips & App Keys...');
const topicsToTest = [
  'addition', 'subtraction', 'multiplication', 'division', 'fractions',
  'decimals', 'percentages', 'hcf_lcm', 'lineq', 'quadratics', 'monomials',
  'squares', 'sqrt', 'pythag', 'angles', 'trig', 'coordgeom', 'stats', 'prob',
  'ratio', 'sdt', 'profitloss'
];
topicsToTest.forEach(topic => {
  const q = generateWarmupQuestion(topic, 'easy');
  assert(q.prompt && q.prompt.length > 25, `Prompt must be a rich story for topic ${topic}`);
  assert(q.answer !== undefined && q.answer !== '', `Answer must be non-empty for topic ${topic}`);
  assert(q.conceptName && q.conceptName.length > 0, `conceptName must exist for topic ${topic}`);
  assert(q.conceptTip && q.conceptTip.length > 0, `conceptTip must exist for topic ${topic}`);
  assert(q.appKey && q.appKey.length > 0, `appKey must exist for topic ${topic}`);
  assert(Array.isArray(q.acceptableAnswers), `acceptableAnswers must be an array for ${topic}`);
  console.log(`✓ [${topic}] App: "${q.appKey}" | Story: "${q.storyContext}" | Tip: "${q.conceptTip.substring(0, 45)}..."`);
});

// 4. Test Weekly Habit Tracker
console.log('\n[4] Testing Flexible Weekly Habit (3 Days/Week)...');
let habit = normalizeWeeklyHabit({ targetDaysPerWeek: 3 });
assert.strictEqual(habit.targetDaysPerWeek, 3);
assert.strictEqual(habit.activeDaysThisWeek.length, 0);
assert.strictEqual(habit.weeklyStreak, 0);

// Day 1 completion
const day1 = recordWarmupCompletion(habit);
assert.strictEqual(day1.daysCompletedThisWeek, 1);
assert.strictEqual(day1.targetMet, false);
assert.strictEqual(day1.weeklyStreak, 0);
assert.strictEqual(day1.justAchievedTarget, false);
console.log('✓ Day 1 recorded: 1/3 days complete');

// Day 1 repeat on same day (should not double count)
const day1Repeat = recordWarmupCompletion(day1.habit);
assert.strictEqual(day1Repeat.daysCompletedThisWeek, 1, 'Same-day completion must not increment count');
console.log('✓ Duplicate same-day check passed');

// Simulate Day 3 completion (Target hit!)
const habitWithTwoDays = normalizeWeeklyHabit({
  targetDaysPerWeek: 3,
  activeDaysThisWeek: ['2026-09-01', '2026-09-02']
});
const day3 = recordWarmupCompletion(habitWithTwoDays); // Adds today as Day 3
assert.strictEqual(day3.daysCompletedThisWeek, 3);
assert.strictEqual(day3.targetMet, true);
assert.strictEqual(day3.justAchievedTarget, true, 'Reaching 3/3 target must trigger justAchievedTarget');
assert.strictEqual(day3.weeklyStreak, 1, 'Weekly streak must increment to 1 upon achieving target');
console.log('✓ Target hit (3/3 days): weekly streak incremented to 1!');

// Week rollover simulation: target met in previous week -> streak preserved
const rolledOverHabit = normalizeWeeklyHabit({
  targetDaysPerWeek: 3,
  currentWeekYear: '2026-W36', // Previous week
  activeDaysThisWeek: ['2026-09-01', '2026-09-02', '2026-09-03'], // 3 days met
  weeklyStreak: 1
});
assert.strictEqual(rolledOverHabit.weeklyStreak, 1, 'Streak should be preserved into new week');
assert.strictEqual(rolledOverHabit.activeDaysThisWeek.length, 0, 'New week active days should reset to 0');
console.log('✓ Week transition verified: streak preserved, new week initialized');

// 5. Test Spaced Review Ladder Integration ([1, 3, 7, 14, 30] Days)
console.log('\n[5] Testing Spaced Review Ladder (PR #296 / spacingLadder.js)...');
assert.deepStrictEqual(INTERVAL_DAYS, [1, 3, 7, 14, 30], 'Must match platform interval ladder');

// Successful review -> climb ladder
let testLadder = {};
const step1 = updateTopicSpacingLadder(testLadder, 'addition', true);
assert.strictEqual(step1.rung, 1, 'Initial success should advance from rung 0 to 1');
assert.strictEqual(step1.intervalDays, 3, 'Rung 1 should be 3-day interval');
assert.strictEqual(step1.wentUp, true);
console.log('✓ Initial success climbed ladder: 1 day -> 3 days');

const step2 = updateTopicSpacingLadder(step1.ladder, 'addition', true);
assert.strictEqual(step2.rung, 2, 'Second success should advance from rung 1 to 2');
assert.strictEqual(step2.intervalDays, 7, 'Rung 2 should be 7-day interval');
console.log('✓ Second success climbed ladder: 3 days -> 7 days');

// Mistake on topic -> step down ladder for sooner review
const stepMistake = updateTopicSpacingLadder(step2.ladder, 'addition', false);
assert.strictEqual(stepMistake.rung, 1, 'Mistake should demote ladder rung from 2 to 1');
assert.strictEqual(stepMistake.intervalDays, 3, 'Demoted rung 1 should be 3-day interval');
assert.strictEqual(stepMistake.wentUp, false);
console.log('✓ Mistake stepped down ladder: 7 days -> 3 days for sooner reinforcement');

// Overdue ladder topics get higher decay priority
const freshTopicPriority = calculateDecayPriority(0.7, now - 1 * 86400000, 2); // 1 day ago on a 7-day ladder
const overdueTopicPriority = calculateDecayPriority(0.7, now - 14 * 86400000, 2); // 14 days ago on a 7-day ladder
assert(freshTopicPriority < overdueTopicPriority, 'Overdue ladder topic must have higher decay priority');
console.log(`✓ Spaced ladder decay priority verified: fresh=${freshTopicPriority} < overdue=${overdueTopicPriority}`);

console.log('\n========================================');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (100%)');
console.log('========================================\n');
