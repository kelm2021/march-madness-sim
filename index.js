/**
 * March Madness Monte Carlo Simulation API
 *
 * x402-powered API that runs real-time tournament simulations
 * with optional scenario constraints.
 *
 * Tiers:
 *   GET  /methodology        — Free. Model description, factors, sample format.
 *   POST /sim/winner          — $0.02. Championship probability distribution.
 *   POST /sim/final-four      — $0.08. Per-team Final Four advancement probabilities.
 *   POST /sim/elite-eight     — $0.15. Through Elite Eight + upset alerts.
 *   POST /sim/full-bracket    — $0.35. All rounds, all matchups, all probabilities.
 *
 * High confidence mode: ?sims=50000 → 3x price on any tier.
 *
 * All POST endpoints accept optional constraints:
 *   { "constraints": { "eliminated_before": { "Duke": "final_four" }, "must_reach": { "Gonzaga": "elite_eight" } } }
 */

const express = require("express");
const { paymentMiddleware } = require("x402-express");
const {
  runSimulation,
  extractWinner,
  extractFinalFour,
  extractEliteEight,
  extractFullBracket,
} = require("./sim/engine");
const { teams, REGIONS } = require("./data/teams");
const { ROUND_NAMES } = require("./sim/bracket");
const { calculateWinProbability } = require("./sim/matchup");

const app = express();
app.use(express.json());

const PAY_TO = "0xC1ce2f3fc018EB304Fa178BDDFFf0E5664Fa6B64";
const PORT = process.env.PORT || 4020;
const DEFAULT_SIMS = 10000;
const HIGH_CONFIDENCE_SIMS = 50000;

// ============================================================
// x402 Payment Middleware
// ============================================================
const payment = paymentMiddleware(PAY_TO, {
  "POST /sim/winner": {
    price: ".02",
    network: "base-sepolia",
    config: {
      description:
        "Real-time Monte Carlo simulation (10K runs) → championship probability distribution for all 68 teams. Supports scenario constraints.",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          constraints: {
            type: "object",
            description:
              "Optional. { eliminated_before: { TeamName: round }, must_reach: { TeamName: round } }. Rounds: round_of_64, round_of_32, sweet_sixteen, elite_eight, final_four, championship.",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          simulation_meta: { type: "object" },
          championship_probabilities: { type: "array" },
        },
      },
    },
  },
  "POST /sim/final-four": {
    price: ".08",
    network: "base-sepolia",
    config: {
      description:
        "Real-time Monte Carlo simulation (10K runs) → Final Four advancement probabilities for all 68 teams. Supports scenario constraints.",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          constraints: {
            type: "object",
            description:
              "Optional. { eliminated_before: { TeamName: round }, must_reach: { TeamName: round } }.",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          simulation_meta: { type: "object" },
          teams: { type: "array" },
        },
      },
    },
  },
  "POST /sim/elite-eight": {
    price: ".15",
    network: "base-sepolia",
    config: {
      description:
        "Real-time Monte Carlo simulation (10K runs) → Elite Eight advancement probabilities + upset alerts. Supports scenario constraints.",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          constraints: {
            type: "object",
            description:
              "Optional. { eliminated_before: { TeamName: round }, must_reach: { TeamName: round } }.",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          simulation_meta: { type: "object" },
          teams: { type: "array" },
          upset_alerts: { type: "array" },
        },
      },
    },
  },
  "POST /sim/full-bracket": {
    price: ".35",
    network: "base-sepolia",
    config: {
      description:
        "Real-time Monte Carlo simulation (10K runs) → complete bracket with all rounds, all matchups, all advancement probabilities, upset alerts. Supports scenario constraints.",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          constraints: {
            type: "object",
            description:
              "Optional. { eliminated_before: { TeamName: round }, must_reach: { TeamName: round } }.",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          simulation_meta: { type: "object" },
          teams: { type: "array" },
          upset_alerts: { type: "array" },
        },
      },
    },
  },
});

// ============================================================
// Free Endpoints (before payment middleware)
// ============================================================

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "march-madness-sim", version: "1.0.0" });
});

app.get("/methodology", (req, res) => {
  // Build a sample matchup to demonstrate the model
  const duke = teams.find((t) => t.name === "Duke");
  const auburn = teams.find((t) => t.name === "Auburn");
  const sampleProb = duke && auburn ? calculateWinProbability(duke, auburn) : null;

  res.json({
    service: "March Madness Monte Carlo Simulation Engine",
    version: "1.0.0",
    season: "2025-26 NCAA Tournament",

    model: {
      type: "Monte Carlo simulation with qualitative overlay",
      simulations_per_request: `${DEFAULT_SIMS.toLocaleString()} standard, ${HIGH_CONFIDENCE_SIMS.toLocaleString()} high-confidence`,
      execution: "Real-time — fresh simulation on every API call, not cached results",

      statistical_foundation: {
        description:
          "Each game is simulated using a tempo-adjusted efficiency model. Win probability is calculated from the matchup-specific offensive/defensive efficiency differential, adjusted for strength of schedule, and converted via logistic function.",
        factors: [
          {
            name: "Adjusted Offensive Efficiency (adjO)",
            description: "Points scored per 100 possessions, adjusted for opponent strength",
          },
          {
            name: "Adjusted Defensive Efficiency (adjD)",
            description: "Points allowed per 100 possessions, adjusted for opponent strength",
          },
          {
            name: "Tempo",
            description: "Possessions per 40 minutes — determines game pace and variance",
          },
          {
            name: "Strength of Schedule (SOS)",
            description: "0-1 scale reflecting difficulty of opponents faced",
          },
          {
            name: "Seed-based upset factor",
            description:
              "Small adjustment reflecting historical tournament variance by seed line",
          },
        ],
      },

      qualitative_overlay: {
        description:
          "Statistical model is augmented with qualitative factors weighted at 15% influence. These capture intangibles that pure efficiency numbers miss — critical for tournament play where single-elimination amplifies coaching, experience, and momentum.",
        weight: "15% of total win probability calculation",
        factors: [
          {
            name: "Coaching",
            weight: "30%",
            description: "Tournament coaching track record and in-game adjustment ability",
          },
          {
            name: "Clutch performance",
            weight: "25%",
            description: "Performance in close games and pressure situations",
          },
          {
            name: "Experience",
            weight: "20%",
            description: "Roster tournament experience, upperclassman ratio",
          },
          {
            name: "Momentum",
            weight: "15%",
            description: "Recent form, conference tournament performance, winning streaks",
          },
          {
            name: "Injury impact",
            weight: "10% (penalty)",
            description: "Impact of current injuries on team capability",
          },
        ],
      },
    },

    scenario_constraints: {
      description:
        "All endpoints accept optional constraints to explore what-if scenarios. Constraints filter the simulation space — e.g., 'in simulations where Duke does NOT make the Final Four, what does the bracket look like?'",
      supported_constraints: {
        eliminated_before:
          "Force a team to lose before reaching a specified round. Example: { 'Duke': 'final_four' } means Duke is eliminated before the Final Four in every simulation.",
        must_reach:
          "Force a team to advance to at least a specified round. Example: { 'Gonzaga': 'elite_eight' } means Gonzaga reaches the Elite Eight in every simulation.",
      },
      valid_rounds: ROUND_NAMES,
    },

    endpoints: {
      free: [
        { path: "GET /health", description: "Service health check" },
        { path: "GET /methodology", description: "This document" },
        { path: "GET /teams", description: "List all 68 teams with seeds and regions" },
      ],
      paid: [
        {
          path: "POST /sim/winner",
          price: "$0.02 (standard) / $0.06 (high-confidence)",
          returns: "Championship probability distribution for all 68 teams",
        },
        {
          path: "POST /sim/final-four",
          price: "$0.08 / $0.24",
          returns: "Final Four advancement probabilities for all 68 teams",
        },
        {
          path: "POST /sim/elite-eight",
          price: "$0.15 / $0.45",
          returns: "Elite Eight probabilities + upset alerts",
        },
        {
          path: "POST /sim/full-bracket",
          price: "$0.35 / $1.05",
          returns: "All rounds, all matchups, all probabilities, upset alerts",
        },
      ],
    },

    high_confidence_mode: {
      description: "Add ?sims=50000 to any endpoint for 5x simulations (3x price). Higher simulation count produces more stable probability estimates.",
      standard: { sims: DEFAULT_SIMS, price_multiplier: "1x" },
      high_confidence: { sims: HIGH_CONFIDENCE_SIMS, price_multiplier: "3x" },
    },

    sample_matchup: sampleProb
      ? {
          description: "Live sample: Duke vs Auburn win probability (Duke perspective)",
          duke_win_probability: Number(sampleProb.toFixed(4)),
          auburn_win_probability: Number((1 - sampleProb).toFixed(4)),
          note: "This is a single-game probability. Tournament simulations compound these across all rounds.",
        }
      : null,

    sample_response_format: {
      championship_probabilities: [
        { team: "TeamName", seed: 1, region: "East", probability: 0.1234 },
      ],
      note: "Actual responses include all 68 teams sorted by probability descending",
    },

    contact: "Built by Liquid Mercury. x402 payment protocol on Base.",
  });
});

app.get("/teams", (req, res) => {
  const teamList = teams.map((t) => ({
    name: t.name,
    seed: t.seed,
    region: t.region,
    conference: t.conference,
    record: t.record,
  }));
  // Sort by region then seed
  teamList.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    return a.seed - b.seed;
  });
  res.json({ season: "2025-26", teams: teamList, total: teamList.length });
});

// ============================================================
// Paid Endpoints
// ============================================================

/**
 * Parse simulation parameters from request
 */
function parseSimParams(req) {
  const simsParam = parseInt(req.query.sims);
  const numSims =
    simsParam === HIGH_CONFIDENCE_SIMS ? HIGH_CONFIDENCE_SIMS : DEFAULT_SIMS;
  const constraints = req.body?.constraints || {};
  return { numSims, constraints };
}

app.post("/sim/winner", payment, (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);

  if (simResult.error) {
    return res.status(400).json(simResult);
  }

  res.json(extractWinner(simResult));
});

app.post("/sim/final-four", payment, (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);

  if (simResult.error) {
    return res.status(400).json(simResult);
  }

  res.json(extractFinalFour(simResult));
});

app.post("/sim/elite-eight", payment, (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);

  if (simResult.error) {
    return res.status(400).json(simResult);
  }

  res.json(extractEliteEight(simResult));
});

app.post("/sim/full-bracket", payment, (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);

  if (simResult.error) {
    return res.status(400).json(simResult);
  }

  res.json(extractFullBracket(simResult));
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log(`\n  March Madness Simulation API`);
  console.log(`  ============================`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Payment address: ${PAY_TO}`);
  console.log(`\n  Free endpoints:`);
  console.log(`    GET  /health`);
  console.log(`    GET  /methodology`);
  console.log(`    GET  /teams`);
  console.log(`\n  Paid endpoints (x402):`);
  console.log(`    POST /sim/winner          $0.02`);
  console.log(`    POST /sim/final-four      $0.08`);
  console.log(`    POST /sim/elite-eight     $0.15`);
  console.log(`    POST /sim/full-bracket    $0.35`);
  console.log(`\n  High confidence: append ?sims=50000 (3x price)\n`);
});
