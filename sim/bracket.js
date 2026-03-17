/**
 * Bracket Structure & Tournament Simulation
 *
 * Defines the NCAA tournament bracket structure and simulates
 * a complete tournament given a set of teams and optional constraints.
 *
 * Standard bracket: 64 teams (after First Four), single elimination.
 * Seeding matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
 */

const { simulateGame } = require("./matchup");

const ROUND_NAMES = [
  "round_of_64",
  "round_of_32",
  "sweet_sixteen",
  "elite_eight",
  "final_four",
  "championship",
];

// Standard seed matchup order for first round
// Position in array determines bracket position (matters for subsequent rounds)
const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

/**
 * Build initial bracket for a region
 * Returns teams ordered by bracket position (seed matchup order)
 */
function buildRegionBracket(regionTeams) {
  const bySeed = {};
  for (const team of regionTeams) {
    // Handle play-in: if two teams share a seed, take the first one
    if (!bySeed[team.seed]) {
      bySeed[team.seed] = team;
    }
  }

  return SEED_ORDER.map((seed) => bySeed[seed]).filter(Boolean);
}

/**
 * Simulate one round of a bracket section
 * Takes array of teams, pairs them sequentially, returns winners
 */
function simulateRound(teams, constraints, roundName) {
  const winners = [];
  for (let i = 0; i < teams.length; i += 2) {
    const teamA = teams[i];
    const teamB = teams[i + 1];

    if (!teamA || !teamB) {
      winners.push(teamA || teamB);
      continue;
    }

    // Check constraints
    const aConstrained = isConstrainedOut(teamA.name, roundName, constraints);
    const bConstrained = isConstrainedOut(teamB.name, roundName, constraints);
    const aMustReach = mustReach(teamA.name, roundName, constraints);
    const bMustReach = mustReach(teamB.name, roundName, constraints);

    if (aConstrained && !bConstrained) {
      winners.push(teamB);
    } else if (bConstrained && !aConstrained) {
      winners.push(teamA);
    } else if (aMustReach && !bMustReach) {
      winners.push(teamA);
    } else if (bMustReach && !aMustReach) {
      winners.push(teamB);
    } else {
      winners.push(simulateGame(teamA, teamB));
    }
  }
  return winners;
}

/**
 * Check if a team is constrained to be eliminated before a given round
 */
function isConstrainedOut(teamName, currentRound, constraints) {
  if (!constraints || !constraints.eliminated_before) return false;
  const eliminateBeforeRound = constraints.eliminated_before[teamName];
  if (!eliminateBeforeRound) return false;

  const currentIdx = ROUND_NAMES.indexOf(currentRound);
  const constraintIdx = ROUND_NAMES.indexOf(eliminateBeforeRound);

  // If current round >= the round they must be eliminated before, they're out
  return constraintIdx >= 0 && currentIdx >= constraintIdx;
}

/**
 * Check if a team must reach a given round
 */
function mustReach(teamName, currentRound, constraints) {
  if (!constraints || !constraints.must_reach) return false;
  const mustReachRound = constraints.must_reach[teamName];
  if (!mustReachRound) return false;

  const currentIdx = ROUND_NAMES.indexOf(currentRound);
  const mustReachIdx = ROUND_NAMES.indexOf(mustReachRound);

  // If current round < the round they must reach, force them through
  return mustReachIdx >= 0 && currentIdx < mustReachIdx;
}

/**
 * Simulate a complete tournament
 *
 * @param {Object} regionTeams - { East: [...], West: [...], South: [...], Midwest: [...] }
 * @param {Object} constraints - Optional { eliminated_before: {}, must_reach: {} }
 * @returns {Object} Complete tournament results with per-round winners
 */
function simulateTournament(regionTeams, constraints = {}) {
  const results = {
    round_of_64: {},
    round_of_32: {},
    sweet_sixteen: {},
    elite_eight: {},
    final_four: {},
    championship: {},
    champion: null,
  };

  const regionWinners = {};

  // Simulate each region through Elite Eight
  for (const region of ["East", "West", "South", "Midwest"]) {
    const bracket = buildRegionBracket(regionTeams[region]);

    // Round of 64
    const r64Winners = simulateRound(bracket, constraints, "round_of_64");
    results.round_of_64[region] = r64Winners.map((t) => t.name);

    // Round of 32
    const r32Winners = simulateRound(r64Winners, constraints, "round_of_32");
    results.round_of_32[region] = r32Winners.map((t) => t.name);

    // Sweet Sixteen
    const s16Winners = simulateRound(r32Winners, constraints, "sweet_sixteen");
    results.sweet_sixteen[region] = s16Winners.map((t) => t.name);

    // Elite Eight
    const e8Winners = simulateRound(s16Winners, constraints, "elite_eight");
    results.elite_eight[region] = e8Winners.map((t) => t.name);

    regionWinners[region] = e8Winners[0];
  }

  // Final Four: East vs West, South vs Midwest (standard bracket)
  const semifinal1 = [regionWinners["East"], regionWinners["West"]];
  const semifinal2 = [regionWinners["South"], regionWinners["Midwest"]];

  const ff1Winner = simulateRound(semifinal1, constraints, "final_four");
  const ff2Winner = simulateRound(semifinal2, constraints, "final_four");

  results.final_four = {
    semifinal_1: { teams: [semifinal1[0].name, semifinal1[1].name], winner: ff1Winner[0].name },
    semifinal_2: { teams: [semifinal2[0].name, semifinal2[1].name], winner: ff2Winner[0].name },
  };

  // Championship
  const finalists = [ff1Winner[0], ff2Winner[0]];
  const champWinner = simulateRound(finalists, constraints, "championship");

  results.championship = {
    teams: [finalists[0].name, finalists[1].name],
    winner: champWinner[0].name,
  };

  results.champion = champWinner[0].name;

  return results;
}

module.exports = { simulateTournament, ROUND_NAMES, buildRegionBracket };
