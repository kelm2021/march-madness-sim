/**
 * Quick validation tests for the simulation engine
 */

const { runSimulation, extractWinner, extractFinalFour, extractEliteEight, extractFullBracket } = require("./sim/engine");
const { calculateWinProbability } = require("./sim/matchup");
const { teams, findTeam } = require("./data/teams");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  FAIL: ${msg}`);
    failed++;
  }
}

console.log("\n=== Team Data Tests ===\n");

assert(teams.length >= 64, `Have ${teams.length} teams (need >= 64)`);

const duke = findTeam("Duke");
assert(duke !== undefined, "Can find Duke by name");
assert(duke.seed === 1, "Duke is a 1 seed");
assert(duke.region === "East", "Duke is in East region");

const regions = new Set(teams.map(t => t.region));
assert(regions.size === 4, `Have 4 regions: ${[...regions].join(", ")}`);

for (const region of ["East", "West", "South", "Midwest"]) {
  const regionTeams = teams.filter(t => t.region === region);
  assert(regionTeams.length >= 16, `${region} has ${regionTeams.length} teams`);
}

console.log("\n=== Matchup Probability Tests ===\n");

const auburn = findTeam("Auburn");
const american = findTeam("American");

const prob1v16 = calculateWinProbability(duke, american);
assert(prob1v16 > 0.9, `1-seed vs 16-seed: ${(prob1v16 * 100).toFixed(1)}% (should be > 90%)`);

const probEven = calculateWinProbability(duke, auburn);
assert(probEven > 0.3 && probEven < 0.7, `1-seed vs 1-seed: ${(probEven * 100).toFixed(1)}% (should be 30-70%)`);

const probReverse = calculateWinProbability(american, duke);
assert(Math.abs((prob1v16 + probReverse) - 1.0) < 0.01, `Win probabilities sum to ~1.0`);

console.log("\n=== Simulation Engine Tests (1000 sims for speed) ===\n");

const startTime = Date.now();
const result = runSimulation(1000);
const elapsed = Date.now() - startTime;

assert(!result.error, "Simulation completed without error");
assert(result.simulation_meta.simulations_run === 1000, "Ran 1000 simulations");
assert(elapsed < 10000, `Completed in ${elapsed}ms (should be < 10s)`);
assert(result.teams.length >= 64, `Got ${result.teams.length} team results`);

// Championship probs should sum to ~1.0
const totalChampProb = result.teams.reduce((sum, t) => sum + t.championship_probability, 0);
assert(Math.abs(totalChampProb - 1.0) < 0.05, `Championship probs sum to ${totalChampProb.toFixed(3)} (~1.0)`);

// Top seeds should generally have higher championship probability
const top4 = result.teams.slice(0, 4);
assert(top4.every(t => t.seed <= 4), `Top 4 championship contenders are seeds 1-4: ${top4.map(t => `${t.team}(${t.seed})`).join(", ")}`);

console.log("\n=== Constraint Tests ===\n");

const constrained = runSimulation(500, { eliminated_before: { "Duke": "final_four" } });
assert(!constrained.error, "Constrained simulation completed");

const dukeFinalFour = constrained.teams.find(t => t.team === "Duke");
assert(dukeFinalFour.advancement_probability.final_four === 0, `Duke Final Four prob = 0 when constrained: ${dukeFinalFour.advancement_probability.final_four}`);
assert(dukeFinalFour.championship_probability === 0, `Duke championship prob = 0 when constrained: ${dukeFinalFour.championship_probability}`);

const mustReach = runSimulation(500, { must_reach: { "American": "elite_eight" } });
assert(!mustReach.error, "Must-reach simulation completed");

const americanResult = mustReach.teams.find(t => t.team === "American");
assert(americanResult.advancement_probability.sweet_sixteen === 1, `American reaches Sweet 16 when must_reach elite_eight: ${americanResult.advancement_probability.sweet_sixteen}`);

// Invalid team constraint
const invalid = runSimulation(100, { eliminated_before: { "FakeTeam": "final_four" } });
assert(invalid.error === "invalid_constraints", "Invalid team constraint returns error");

console.log("\n=== Tier Extraction Tests ===\n");

const winnerTier = extractWinner(result);
assert(winnerTier.championship_probabilities.length >= 64, "Winner tier has all teams");
assert(winnerTier.championship_probabilities[0].probability !== undefined, "Winner tier has probability field");

const ffTier = extractFinalFour(result);
assert(ffTier.teams[0].final_four_probability !== undefined, "Final Four tier has final_four_probability");

const e8Tier = extractEliteEight(result);
assert(e8Tier.upset_alerts !== undefined, "Elite Eight tier has upset_alerts");
assert(e8Tier.teams[0].elite_eight_probability !== undefined, "Elite Eight tier has elite_eight_probability");

const fullTier = extractFullBracket(result);
assert(fullTier.teams[0].advancement_probability !== undefined, "Full bracket has advancement_probability");
assert(Object.keys(fullTier.teams[0].advancement_probability).length === 6, "Full bracket has all 6 rounds");

console.log("\n=== 10K Simulation Performance Test ===\n");

const start10k = Date.now();
const result10k = runSimulation(10000);
const elapsed10k = Date.now() - start10k;
console.log(`  10K simulations completed in ${elapsed10k}ms`);
assert(elapsed10k < 30000, `10K sims under 30s (actual: ${elapsed10k}ms)`);

console.log(`\n========================================`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
