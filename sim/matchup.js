/**
 * Matchup Probability Engine
 *
 * Calculates win probability for a single game between two teams
 * using tempo-adjusted efficiency differential with qualitative overlay.
 *
 * Core formula:
 * 1. Calculate expected point differential using tempo-adjusted offensive/defensive efficiency
 * 2. Apply strength-of-schedule adjustment
 * 3. Apply qualitative factors (LLM-derived: coaching, momentum, experience, clutch, injuries)
 * 4. Convert differential to win probability using logistic function
 */

// Logistic function: converts point differential to win probability
// k controls steepness — calibrated so that a 10-point edge ≈ 85% win probability
const LOGISTIC_K = 0.18;

// Weight of qualitative factors relative to statistical model (0-1)
// 0.15 means qualitative factors can swing win probability by up to ~15%
const QUALITATIVE_WEIGHT = 0.15;

// Seed-based historical upset bonus
// Lower seeds (higher number) get a small boost reflecting tournament chaos
const SEED_UPSET_FACTOR = 0.008;

/**
 * Calculate win probability for teamA over teamB in a single game
 *
 * @param {Object} teamA - Team object with adjO, adjD, tempo, sos, qualitative
 * @param {Object} teamB - Team object with adjO, adjD, tempo, sos, qualitative
 * @returns {number} Win probability for teamA (0.0 - 1.0)
 */
function calculateWinProbability(teamA, teamB) {
  // 1. Tempo-adjusted efficiency
  // Expected possessions = average of both teams' tempos
  const expectedPossessions = (teamA.tempo + teamB.tempo) / 2;

  // Points teamA would score: their offense vs teamB's defense
  // Normalized to possessions in the game
  const teamAPoints = (teamA.adjO / 100) * expectedPossessions;
  const teamAAllowed = (teamB.adjO / 100) * expectedPossessions;

  const teamBPoints = (teamB.adjO / 100) * expectedPossessions;
  const teamBAllowed = (teamA.adjO / 100) * expectedPossessions;

  // Offensive output for A = their efficiency attacking B's defense
  // Use geometric mean of A's offense and B's defense to get matchup-specific efficiency
  const avgD = 100; // baseline defensive efficiency (D1 average)
  const teamAOffense = (teamA.adjO * teamB.adjD) / avgD;
  const teamBOffense = (teamB.adjO * teamA.adjD) / avgD;

  // Raw point differential (positive = teamA favored)
  const rawDiff = ((teamAOffense - teamBOffense) / 100) * expectedPossessions;

  // 2. Strength-of-schedule adjustment
  // Teams from tougher conferences have been tested more — their metrics are more reliable
  const sosDiff = (teamA.sos - teamB.sos) * 2.5; // Scale SOS to ~2.5 points max

  // 3. Qualitative composite score
  const qualA = computeQualitativeScore(teamA.qualitative);
  const qualB = computeQualitativeScore(teamB.qualitative);
  const qualDiff = (qualA - qualB) * 10; // Scale to ~10 points max swing

  // 4. Seed-based upset factor (slight boost for underdogs reflecting tournament variance)
  const seedDiff = (teamA.seed - teamB.seed) * SEED_UPSET_FACTOR;

  // Combined differential
  const totalDiff = rawDiff + sosDiff + (qualDiff * QUALITATIVE_WEIGHT) - seedDiff;

  // 5. Convert to probability via logistic function
  const probability = 1 / (1 + Math.exp(-LOGISTIC_K * totalDiff));

  return probability;
}

/**
 * Compute a single qualitative score from the qualitative factors object
 * Higher = better tournament prospect
 */
function computeQualitativeScore(qual) {
  if (!qual) return 0.5;

  // Weighted average of qualitative factors
  // Coaching and clutch weighted higher for tournament play
  const weights = {
    momentum: 0.15,
    coaching: 0.30,
    experience: 0.20,
    clutch: 0.25,
    injury_impact: -0.10, // Negative: injury_impact is a penalty (0 = healthy, 1 = decimated)
  };

  let score = 0;
  let totalWeight = 0;
  for (const [factor, weight] of Object.entries(weights)) {
    if (qual[factor] !== undefined) {
      if (factor === "injury_impact") {
        score += (1 - qual[factor]) * Math.abs(weight);
        totalWeight += Math.abs(weight);
      } else {
        score += qual[factor] * weight;
        totalWeight += weight;
      }
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0.5;
}

/**
 * Simulate a single game outcome
 * @returns {string} Name of winning team
 */
function simulateGame(teamA, teamB) {
  const winProbA = calculateWinProbability(teamA, teamB);
  return Math.random() < winProbA ? teamA : teamB;
}

module.exports = { calculateWinProbability, computeQualitativeScore, simulateGame };
