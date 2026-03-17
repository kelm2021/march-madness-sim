/**
 * March Madness Monte Carlo Simulation API
 *
 * x402-powered API on Base mainnet via Coinbase CDP facilitator.
 * Real-time tournament simulations with scenario constraints.
 */

const express = require("express");
const {
  runSimulation,
  extractWinner,
  extractFinalFour,
  extractEliteEight,
  extractFullBracket,
} = require("./sim/engine");
const { teams } = require("./data/teams");
const { ROUND_NAMES } = require("./sim/bracket");
const { calculateWinProbability } = require("./sim/matchup");

const app = express();
app.use(express.json());

const PAY_TO = "0x348Df429BD49A7506128c74CE1124A81B4B7dC9d";
const PORT = process.env.PORT || 4020;
const DEFAULT_SIMS = 10000;
const HIGH_CONFIDENCE_SIMS = 50000;
const BASE_MAINNET = "eip155:8453";

// ============================================================
// CDP Facilitator (lazy-loaded, same pattern as restricted-party-screen)
// ============================================================

async function loadCoinbaseFacilitator(env = process.env) {
  const { createFacilitatorConfig } = await import("@coinbase/x402");
  return createFacilitatorConfig(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET);
}

function createFacilitatorClient(facilitator) {
  if (
    facilitator &&
    typeof facilitator.verify === "function" &&
    typeof facilitator.settle === "function" &&
    typeof facilitator.getSupported === "function"
  ) {
    return facilitator;
  }
  const { HTTPFacilitatorClient } = require("@x402/core/server");
  return new HTTPFacilitatorClient(facilitator);
}

function createPaymentResourceServer(options = {}) {
  const { facilitator } = options;
  const { x402ResourceServer } = require("@x402/core/server");
  const { ExactEvmScheme } = require("@x402/evm/exact/server");

  const resourceServer = new x402ResourceServer(createFacilitatorClient(facilitator));
  resourceServer.register(BASE_MAINNET, new ExactEvmScheme());

  resourceServer.onVerifyFailure(async ({ error, requirements }) => {
    console.error("x402 verify failure:", JSON.stringify({
      message: error?.message || "Verification failed",
      network: requirements.network,
    }));
  });

  resourceServer.onSettleFailure(async ({ error, requirements }) => {
    console.error("x402 settle failure:", JSON.stringify({
      message: error?.message || "Settlement failed",
      network: requirements.network,
    }));
  });

  return resourceServer;
}

// Route config for x402 middleware
const routeConfig = {
  "POST /sim/winner": {
    accepts: {
      scheme: "exact",
      network: BASE_MAINNET,
      payTo: PAY_TO,
      price: "$0.02",
      maxTimeoutSeconds: 60,
    },
    description: "Real-time Monte Carlo simulation (10K runs) — championship probability distribution for all 68 teams. Supports scenario constraints.",
    mimeType: "application/json",
  },
  "POST /sim/final-four": {
    accepts: {
      scheme: "exact",
      network: BASE_MAINNET,
      payTo: PAY_TO,
      price: "$0.08",
      maxTimeoutSeconds: 60,
    },
    description: "Real-time Monte Carlo simulation (10K runs) — Final Four advancement probabilities for all 68 teams. Supports scenario constraints.",
    mimeType: "application/json",
  },
  "POST /sim/elite-eight": {
    accepts: {
      scheme: "exact",
      network: BASE_MAINNET,
      payTo: PAY_TO,
      price: "$0.15",
      maxTimeoutSeconds: 60,
    },
    description: "Real-time Monte Carlo simulation (10K runs) — Elite Eight advancement probabilities + upset alerts. Supports scenario constraints.",
    mimeType: "application/json",
  },
  "POST /sim/full-bracket": {
    accepts: {
      scheme: "exact",
      network: BASE_MAINNET,
      payTo: PAY_TO,
      price: "$0.35",
      maxTimeoutSeconds: 60,
    },
    description: "Real-time Monte Carlo simulation (10K runs) — complete bracket with all rounds, all matchups, all advancement probabilities, upset alerts. Supports scenario constraints.",
    mimeType: "application/json",
  },
};

// Lazy payment middleware initialization
let paymentReady = null;

async function getPaymentMiddleware() {
  if (!paymentReady) {
    paymentReady = loadCoinbaseFacilitator()
      .then((facilitator) => createPaymentResourceServer({ facilitator }))
      .then((resourceServer) => {
        const { paymentMiddleware } = require("@x402/express");
        return paymentMiddleware(routeConfig, resourceServer);
      });
  }
  return paymentReady;
}

async function paymentGate(req, res, next) {
  try {
    const middleware = await getPaymentMiddleware();
    return await middleware(req, res, next);
  } catch (err) {
    console.error("Payment middleware init failed:", err.message);
    return res.status(500).json({
      error: "Payment middleware init failed",
      details: err.message,
    });
  }
}

// ============================================================
// Free Endpoints
// ============================================================

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "march-madness-sim", version: "2.0.0" });
});

app.get("/methodology", (req, res) => {
  const duke = teams.find((t) => t.name === "Duke");
  const auburn = teams.find((t) => t.name === "Auburn");
  const sampleProb = duke && auburn ? calculateWinProbability(duke, auburn) : null;

  res.json({
    service: "March Madness Monte Carlo Simulation Engine",
    version: "2.0.0",
    season: "2025-26 NCAA Tournament",
    model: {
      type: "Monte Carlo simulation with qualitative overlay",
      simulations_per_request: `${DEFAULT_SIMS.toLocaleString()} standard, ${HIGH_CONFIDENCE_SIMS.toLocaleString()} high-confidence`,
      execution: "Real-time — fresh simulation on every API call, not cached results",
      statistical_foundation: {
        description: "Each game is simulated using a tempo-adjusted efficiency model. Win probability is calculated from the matchup-specific offensive/defensive efficiency differential, adjusted for strength of schedule, and converted via logistic function.",
        factors: [
          { name: "Adjusted Offensive Efficiency (adjO)", description: "Points scored per 100 possessions, adjusted for opponent strength" },
          { name: "Adjusted Defensive Efficiency (adjD)", description: "Points allowed per 100 possessions, adjusted for opponent strength" },
          { name: "Tempo", description: "Possessions per 40 minutes — determines game pace and variance" },
          { name: "Strength of Schedule (SOS)", description: "0-1 scale reflecting difficulty of opponents faced" },
          { name: "Seed-based upset factor", description: "Small adjustment reflecting historical tournament variance by seed line" },
        ],
      },
      qualitative_overlay: {
        description: "Statistical model is augmented with qualitative factors weighted at 15% influence. These capture intangibles that pure efficiency numbers miss — critical for tournament play where single-elimination amplifies coaching, experience, and momentum.",
        weight: "15% of total win probability calculation",
        factors: [
          { name: "Coaching", weight: "30%", description: "Tournament coaching track record and in-game adjustment ability" },
          { name: "Clutch performance", weight: "25%", description: "Performance in close games and pressure situations" },
          { name: "Experience", weight: "20%", description: "Roster tournament experience, upperclassman ratio" },
          { name: "Momentum", weight: "15%", description: "Recent form, conference tournament performance, winning streaks" },
          { name: "Injury impact", weight: "10% (penalty)", description: "Impact of current injuries on team capability" },
        ],
      },
    },
    scenario_constraints: {
      description: "All endpoints accept optional constraints to explore what-if scenarios.",
      supported_constraints: {
        eliminated_before: "Force a team to lose before reaching a specified round. Example: { 'Duke': 'final_four' }",
        must_reach: "Force a team to advance to at least a specified round. Example: { 'Gonzaga': 'elite_eight' }",
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
        { path: "POST /sim/winner", price: "$0.02 USDC", returns: "Championship probability distribution" },
        { path: "POST /sim/final-four", price: "$0.08 USDC", returns: "Final Four advancement probabilities" },
        { path: "POST /sim/elite-eight", price: "$0.15 USDC", returns: "Elite Eight probabilities + upset alerts" },
        { path: "POST /sim/full-bracket", price: "$0.35 USDC", returns: "All rounds, all matchups, all probabilities" },
      ],
    },
    high_confidence_mode: {
      description: "Add ?sims=50000 to any endpoint for 5x simulations.",
      standard: { sims: DEFAULT_SIMS },
      high_confidence: { sims: HIGH_CONFIDENCE_SIMS },
    },
    sample_matchup: sampleProb ? {
      description: "Live sample: Duke vs Auburn win probability (Duke perspective)",
      duke_win_probability: Number(sampleProb.toFixed(4)),
      auburn_win_probability: Number((1 - sampleProb).toFixed(4)),
    } : null,
    payment: {
      network: "Base",
      protocol: "x402",
      pricingDenomination: "USDC",
    },
    contact: "Built by Liquid Mercury.",
  });
});

app.get("/teams", (req, res) => {
  const teamList = teams.map((t) => ({
    name: t.name, seed: t.seed, region: t.region, conference: t.conference, record: t.record,
  }));
  teamList.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    return a.seed - b.seed;
  });
  res.json({ season: "2025-26", teams: teamList, total: teamList.length });
});

// ============================================================
// Paid Endpoints (behind payment gate)
// ============================================================

function parseSimParams(req) {
  const simsParam = parseInt(req.query.sims);
  const numSims = simsParam === HIGH_CONFIDENCE_SIMS ? HIGH_CONFIDENCE_SIMS : DEFAULT_SIMS;
  const constraints = req.body?.constraints || {};
  return { numSims, constraints };
}

const paidRouter = express.Router();

paidRouter.post("/sim/winner", (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);
  if (simResult.error) return res.status(400).json(simResult);
  res.json(extractWinner(simResult));
});

paidRouter.post("/sim/final-four", (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);
  if (simResult.error) return res.status(400).json(simResult);
  res.json(extractFinalFour(simResult));
});

paidRouter.post("/sim/elite-eight", (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);
  if (simResult.error) return res.status(400).json(simResult);
  res.json(extractEliteEight(simResult));
});

paidRouter.post("/sim/full-bracket", (req, res) => {
  const { numSims, constraints } = parseSimParams(req);
  const simResult = runSimulation(numSims, constraints);
  if (simResult.error) return res.status(400).json(simResult);
  res.json(extractFullBracket(simResult));
});

app.use(paymentGate, paidRouter);

// ============================================================
// Start Server
// ============================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  March Madness Simulation API v2.0.0`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`  Payment: ${PAY_TO} on Base (${BASE_MAINNET})`);
    console.log(`  Facilitator: Coinbase CDP\n`);
  });
}

module.exports = app;
