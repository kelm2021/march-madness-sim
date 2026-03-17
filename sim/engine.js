/**
 * Monte Carlo Simulation Engine
 *
 * Runs N tournament simulations and aggregates results into
 * probability distributions for each team advancing through each round.
 */

const { simulateTournament, ROUND_NAMES } = require("./bracket");
const { teams, getTeamsByRegion, REGIONS } = require("../data/teams");

/**
 * Run Monte Carlo tournament simulation
 *
 * @param {number} numSims - Number of simulations to run (default 10000)
 * @param {Object} constraints - Optional constraints { eliminated_before: {}, must_reach: {} }
 * @returns {Object} Aggregated probability distributions
 */
function runSimulation(numSims = 10000, constraints = {}) {
  const startTime = Date.now();

  // Prepare teams by region
  const regionTeams = {};
  for (const region of REGIONS) {
    regionTeams[region] = getTeamsByRegion(region);
  }

  // Validate constraints reference real teams
  const teamNames = new Set(teams.map((t) => t.name));
  const invalidConstraints = [];

  if (constraints.eliminated_before) {
    for (const name of Object.keys(constraints.eliminated_before)) {
      if (!teamNames.has(name)) invalidConstraints.push(name);
    }
  }
  if (constraints.must_reach) {
    for (const name of Object.keys(constraints.must_reach)) {
      if (!teamNames.has(name)) invalidConstraints.push(name);
    }
  }

  if (invalidConstraints.length > 0) {
    return {
      error: "invalid_constraints",
      message: `Unknown team(s): ${invalidConstraints.join(", ")}`,
      valid_teams: Array.from(teamNames).sort(),
    };
  }

  // Track advancement counts per team per round
  const advancement = {};
  const championshipCounts = {};

  for (const team of teams) {
    advancement[team.name] = {
      team: team.name,
      seed: team.seed,
      region: team.region,
      rounds: {},
    };
    for (const round of ROUND_NAMES) {
      advancement[team.name].rounds[round] = 0;
    }
    championshipCounts[team.name] = 0;
  }

  // Track upset frequency per matchup slot
  const upsets = {};

  // Run simulations
  for (let i = 0; i < numSims; i++) {
    const result = simulateTournament(regionTeams, constraints);

    // Count advancements for regional rounds
    for (const round of ["round_of_64", "round_of_32", "sweet_sixteen", "elite_eight"]) {
      for (const region of REGIONS) {
        const winners = result[round][region];
        if (winners) {
          for (const name of winners) {
            if (advancement[name]) {
              advancement[name].rounds[round]++;
            }
          }
        }
      }
    }

    // Final Four
    if (result.final_four) {
      const ff = result.final_four;
      if (advancement[ff.semifinal_1.winner]) {
        advancement[ff.semifinal_1.winner].rounds.final_four++;
      }
      if (advancement[ff.semifinal_2.winner]) {
        advancement[ff.semifinal_2.winner].rounds.final_four++;
      }
    }

    // Championship
    if (result.championship) {
      const champWinner = result.championship.winner;
      if (advancement[champWinner]) {
        advancement[champWinner].rounds.championship++;
      }
      championshipCounts[champWinner] = (championshipCounts[champWinner] || 0) + 1;
    }

    // Track upsets (lower seed beats higher seed) in round of 64
    for (const region of REGIONS) {
      const regionBracket = getTeamsByRegion(region);
      const r64Winners = result.round_of_64[region];
      if (r64Winners) {
        // Check each game in the round
        const bracketTeams = regionBracket.sort((a, b) => a.seed - b.seed);
        for (const winnerName of r64Winners) {
          const winner = teams.find((t) => t.name === winnerName);
          if (winner) {
            // Find the opponent (the team with the complementary seed: 1v16, 2v15, etc.)
            const complementSeed = 17 - winner.seed;
            const opponent = bracketTeams.find((t) => t.seed === complementSeed);
            if (opponent && winner.seed > opponent.seed) {
              const key = `${opponent.seed}v${winner.seed}_${region}`;
              upsets[key] = (upsets[key] || 0) + 1;
            }
          }
        }
      }
    }
  }

  // Convert counts to probabilities
  const teamProbabilities = [];
  for (const team of teams) {
    const adv = advancement[team.name];
    const probs = {};
    for (const round of ROUND_NAMES) {
      probs[round] = Number((adv.rounds[round] / numSims).toFixed(4));
    }
    teamProbabilities.push({
      team: team.name,
      seed: team.seed,
      region: team.region,
      conference: team.conference,
      advancement_probability: probs,
      championship_probability: Number((championshipCounts[team.name] / numSims).toFixed(4)),
    });
  }

  // Sort by championship probability descending
  teamProbabilities.sort((a, b) => b.championship_probability - a.championship_probability);

  // Build upset alerts (matchups with >25% upset probability)
  const upsetAlerts = [];
  for (const [key, count] of Object.entries(upsets)) {
    const probability = count / numSims;
    if (probability > 0.25) {
      const [matchup, region] = key.split("_");
      upsetAlerts.push({ matchup, region, probability: Number(probability.toFixed(4)) });
    }
  }
  upsetAlerts.sort((a, b) => b.probability - a.probability);

  const elapsedMs = Date.now() - startTime;

  return {
    simulation_meta: {
      simulations_run: numSims,
      model_version: "1.0.0",
      factors: [
        "tempo_adjusted_efficiency",
        "strength_of_schedule",
        "seed_history",
        "qualitative_coaching",
        "qualitative_momentum",
        "qualitative_experience",
        "qualitative_clutch",
        "qualitative_injury_impact",
      ],
      constraints_applied: Object.keys(constraints).length > 0 ? constraints : null,
      computation_time_ms: elapsedMs,
      timestamp: new Date().toISOString(),
      disclaimer:
        "Monte Carlo simulation results based on statistical modeling with qualitative adjustments. These are simulated outcomes, not predictions. Past performance does not guarantee future results.",
    },
    teams: teamProbabilities,
    upset_alerts: upsetAlerts,
  };
}

/**
 * Extract just the championship probabilities (winner tier)
 */
function extractWinner(simResult) {
  return {
    simulation_meta: simResult.simulation_meta,
    championship_probabilities: simResult.teams.map((t) => ({
      team: t.team,
      seed: t.seed,
      region: t.region,
      probability: t.championship_probability,
    })),
  };
}

/**
 * Extract through Final Four (final_four tier)
 */
function extractFinalFour(simResult) {
  return {
    simulation_meta: simResult.simulation_meta,
    teams: simResult.teams.map((t) => ({
      team: t.team,
      seed: t.seed,
      region: t.region,
      conference: t.conference,
      final_four_probability: t.advancement_probability.final_four,
      championship_probability: t.championship_probability,
    })),
  };
}

/**
 * Extract through Elite Eight
 */
function extractEliteEight(simResult) {
  return {
    simulation_meta: simResult.simulation_meta,
    teams: simResult.teams.map((t) => ({
      team: t.team,
      seed: t.seed,
      region: t.region,
      conference: t.conference,
      elite_eight_probability: t.advancement_probability.elite_eight,
      final_four_probability: t.advancement_probability.final_four,
      championship_probability: t.championship_probability,
    })),
    upset_alerts: simResult.upset_alerts,
  };
}

/**
 * Full bracket — everything
 */
function extractFullBracket(simResult) {
  return simResult;
}

module.exports = {
  runSimulation,
  extractWinner,
  extractFinalFour,
  extractEliteEight,
  extractFullBracket,
};
