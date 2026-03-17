/**
 * 2025-26 NCAA Tournament Team Dataset
 * 68-team field with KenPom-style efficiency metrics
 *
 * Metrics:
 * - adjO: Adjusted Offensive Efficiency (points per 100 possessions)
 * - adjD: Adjusted Defensive Efficiency (points allowed per 100 possessions)
 * - tempo: Possessions per 40 minutes
 * - sos: Strength of Schedule (0-1 scale, higher = harder)
 * - seed: Tournament seed (1-16)
 * - region: Tournament region
 * - conference: Conference affiliation
 * - record: Season record (W-L)
 * - qualitative: LLM-relevant factors (injuries, momentum, coaching, intangibles)
 */

const REGIONS = ["East", "West", "South", "Midwest"];

const teams = [
  // === EAST REGION ===
  { name: "Duke", seed: 1, region: "East", conference: "ACC", record: "30-3",
    adjO: 123.5, adjD: 92.1, tempo: 71.2, sos: 0.89,
    qualitative: { momentum: 0.9, coaching: 0.95, experience: 0.85, clutch: 0.88, injury_impact: 0.0 } },

  { name: "Alabama", seed: 2, region: "East", conference: "SEC", record: "27-6",
    adjO: 121.8, adjD: 94.3, tempo: 73.5, sos: 0.91,
    qualitative: { momentum: 0.82, coaching: 0.88, experience: 0.78, clutch: 0.80, injury_impact: 0.05 } },

  { name: "Wisconsin", seed: 3, region: "East", conference: "Big Ten", record: "26-7",
    adjO: 118.2, adjD: 93.8, tempo: 65.1, sos: 0.87,
    qualitative: { momentum: 0.85, coaching: 0.92, experience: 0.90, clutch: 0.85, injury_impact: 0.0 } },

  { name: "Arizona", seed: 4, region: "East", conference: "Big 12", record: "25-8",
    adjO: 119.4, adjD: 95.2, tempo: 69.8, sos: 0.88,
    qualitative: { momentum: 0.78, coaching: 0.85, experience: 0.82, clutch: 0.77, injury_impact: 0.08 } },

  { name: "Oregon", seed: 5, region: "East", conference: "Big Ten", record: "24-9",
    adjO: 116.7, adjD: 96.1, tempo: 68.3, sos: 0.84,
    qualitative: { momentum: 0.75, coaching: 0.80, experience: 0.77, clutch: 0.74, injury_impact: 0.0 } },

  { name: "BYU", seed: 6, region: "East", conference: "Big 12", record: "24-9",
    adjO: 115.3, adjD: 97.4, tempo: 66.9, sos: 0.82,
    qualitative: { momentum: 0.72, coaching: 0.78, experience: 0.80, clutch: 0.73, injury_impact: 0.0 } },

  { name: "Saint Mary's", seed: 7, region: "East", conference: "WCC", record: "26-6",
    adjO: 114.8, adjD: 96.0, tempo: 63.2, sos: 0.72,
    qualitative: { momentum: 0.80, coaching: 0.88, experience: 0.88, clutch: 0.82, injury_impact: 0.0 } },

  { name: "Mississippi State", seed: 8, region: "East", conference: "SEC", record: "22-11",
    adjO: 112.1, adjD: 97.8, tempo: 70.1, sos: 0.86,
    qualitative: { momentum: 0.68, coaching: 0.75, experience: 0.72, clutch: 0.70, injury_impact: 0.03 } },

  { name: "Baylor", seed: 9, region: "East", conference: "Big 12", record: "22-11",
    adjO: 113.5, adjD: 98.2, tempo: 67.5, sos: 0.85,
    qualitative: { momentum: 0.70, coaching: 0.82, experience: 0.75, clutch: 0.72, injury_impact: 0.0 } },

  { name: "Vanderbilt", seed: 10, region: "East", conference: "SEC", record: "21-12",
    adjO: 111.8, adjD: 99.1, tempo: 69.4, sos: 0.83,
    qualitative: { momentum: 0.74, coaching: 0.76, experience: 0.70, clutch: 0.68, injury_impact: 0.0 } },

  { name: "VCU", seed: 11, region: "East", conference: "A-10", record: "25-8",
    adjO: 110.5, adjD: 97.5, tempo: 71.8, sos: 0.68,
    qualitative: { momentum: 0.82, coaching: 0.80, experience: 0.78, clutch: 0.76, injury_impact: 0.0 } },

  { name: "Liberty", seed: 12, region: "East", conference: "CUSA", record: "28-5",
    adjO: 109.2, adjD: 98.8, tempo: 66.4, sos: 0.55,
    qualitative: { momentum: 0.85, coaching: 0.72, experience: 0.75, clutch: 0.70, injury_impact: 0.0 } },

  { name: "Akron", seed: 13, region: "East", conference: "MAC", record: "27-6",
    adjO: 107.8, adjD: 99.5, tempo: 67.9, sos: 0.48,
    qualitative: { momentum: 0.78, coaching: 0.70, experience: 0.72, clutch: 0.68, injury_impact: 0.0 } },

  { name: "Lipscomb", seed: 14, region: "East", conference: "ASUN", record: "26-7",
    adjO: 106.1, adjD: 100.8, tempo: 69.2, sos: 0.42,
    qualitative: { momentum: 0.80, coaching: 0.68, experience: 0.70, clutch: 0.65, injury_impact: 0.0 } },

  { name: "Robert Morris", seed: 15, region: "East", conference: "Horizon", record: "25-9",
    adjO: 104.5, adjD: 102.1, tempo: 68.0, sos: 0.38,
    qualitative: { momentum: 0.75, coaching: 0.65, experience: 0.68, clutch: 0.62, injury_impact: 0.0 } },

  { name: "American", seed: 16, region: "East", conference: "Patriot", record: "24-10",
    adjO: 101.2, adjD: 104.5, tempo: 65.8, sos: 0.32,
    qualitative: { momentum: 0.70, coaching: 0.60, experience: 0.65, clutch: 0.58, injury_impact: 0.0 } },

  // Play-in team (First Four)
  { name: "SIU Edwardsville", seed: 16, region: "East", conference: "OVC", record: "22-12",
    adjO: 100.5, adjD: 105.2, tempo: 66.1, sos: 0.30,
    qualitative: { momentum: 0.65, coaching: 0.58, experience: 0.62, clutch: 0.55, injury_impact: 0.0 } },

  // === WEST REGION ===
  { name: "Florida", seed: 1, region: "West", conference: "SEC", record: "29-4",
    adjO: 122.8, adjD: 91.5, tempo: 70.8, sos: 0.92,
    qualitative: { momentum: 0.92, coaching: 0.90, experience: 0.88, clutch: 0.90, injury_impact: 0.0 } },

  { name: "St. John's", seed: 2, region: "West", conference: "Big East", record: "27-6",
    adjO: 120.1, adjD: 93.0, tempo: 68.5, sos: 0.85,
    qualitative: { momentum: 0.88, coaching: 0.84, experience: 0.82, clutch: 0.85, injury_impact: 0.0 } },

  { name: "Texas Tech", seed: 3, region: "West", conference: "Big 12", record: "26-7",
    adjO: 117.5, adjD: 91.8, tempo: 66.2, sos: 0.88,
    qualitative: { momentum: 0.80, coaching: 0.90, experience: 0.83, clutch: 0.80, injury_impact: 0.0 } },

  { name: "Maryland", seed: 4, region: "West", conference: "Big Ten", record: "26-7",
    adjO: 118.8, adjD: 94.8, tempo: 69.1, sos: 0.86,
    qualitative: { momentum: 0.83, coaching: 0.82, experience: 0.80, clutch: 0.78, injury_impact: 0.0 } },

  { name: "Memphis", seed: 5, region: "West", conference: "AAC", record: "25-8",
    adjO: 117.2, adjD: 95.5, tempo: 72.4, sos: 0.78,
    qualitative: { momentum: 0.77, coaching: 0.80, experience: 0.75, clutch: 0.76, injury_impact: 0.0 } },

  { name: "Missouri", seed: 6, region: "West", conference: "SEC", record: "23-10",
    adjO: 114.9, adjD: 96.8, tempo: 68.7, sos: 0.88,
    qualitative: { momentum: 0.72, coaching: 0.76, experience: 0.74, clutch: 0.70, injury_impact: 0.05 } },

  { name: "Kansas", seed: 7, region: "West", conference: "Big 12", record: "22-11",
    adjO: 115.8, adjD: 97.2, tempo: 69.5, sos: 0.90,
    qualitative: { momentum: 0.68, coaching: 0.92, experience: 0.80, clutch: 0.78, injury_impact: 0.10 } },

  { name: "UConn", seed: 8, region: "West", conference: "Big East", record: "21-12",
    adjO: 113.8, adjD: 96.5, tempo: 67.8, sos: 0.84,
    qualitative: { momentum: 0.65, coaching: 0.92, experience: 0.85, clutch: 0.82, injury_impact: 0.12 } },

  { name: "Oklahoma", seed: 9, region: "West", conference: "SEC", record: "22-11",
    adjO: 112.5, adjD: 98.0, tempo: 68.9, sos: 0.85,
    qualitative: { momentum: 0.70, coaching: 0.78, experience: 0.76, clutch: 0.72, injury_impact: 0.0 } },

  { name: "Arkansas", seed: 10, region: "West", conference: "SEC", record: "21-12",
    adjO: 113.2, adjD: 99.5, tempo: 73.2, sos: 0.86,
    qualitative: { momentum: 0.76, coaching: 0.82, experience: 0.72, clutch: 0.74, injury_impact: 0.0 } },

  { name: "Drake", seed: 11, region: "West", conference: "MVC", record: "27-6",
    adjO: 111.0, adjD: 97.0, tempo: 64.8, sos: 0.62,
    qualitative: { momentum: 0.84, coaching: 0.82, experience: 0.85, clutch: 0.80, injury_impact: 0.0 } },

  { name: "UC San Diego", seed: 12, region: "West", conference: "Big West", record: "28-5",
    adjO: 108.5, adjD: 98.2, tempo: 66.5, sos: 0.50,
    qualitative: { momentum: 0.86, coaching: 0.74, experience: 0.76, clutch: 0.72, injury_impact: 0.0 } },

  { name: "Yale", seed: 13, region: "West", conference: "Ivy", record: "25-5",
    adjO: 108.0, adjD: 99.0, tempo: 67.2, sos: 0.45,
    qualitative: { momentum: 0.82, coaching: 0.78, experience: 0.82, clutch: 0.75, injury_impact: 0.0 } },

  { name: "Wofford", seed: 14, region: "West", conference: "SoCon", record: "26-7",
    adjO: 105.8, adjD: 101.2, tempo: 68.5, sos: 0.40,
    qualitative: { momentum: 0.78, coaching: 0.70, experience: 0.72, clutch: 0.68, injury_impact: 0.0 } },

  { name: "Norfolk State", seed: 15, region: "West", conference: "MEAC", record: "24-8",
    adjO: 103.8, adjD: 102.5, tempo: 69.8, sos: 0.35,
    qualitative: { momentum: 0.74, coaching: 0.66, experience: 0.68, clutch: 0.64, injury_impact: 0.0 } },

  { name: "Omaha", seed: 16, region: "West", conference: "Summit", record: "23-11",
    adjO: 100.8, adjD: 105.0, tempo: 67.5, sos: 0.30,
    qualitative: { momentum: 0.68, coaching: 0.58, experience: 0.64, clutch: 0.56, injury_impact: 0.0 } },

  // === SOUTH REGION ===
  { name: "Auburn", seed: 1, region: "South", conference: "SEC", record: "30-3",
    adjO: 124.2, adjD: 90.8, tempo: 72.5, sos: 0.93,
    qualitative: { momentum: 0.93, coaching: 0.88, experience: 0.86, clutch: 0.88, injury_impact: 0.0 } },

  { name: "Michigan State", seed: 2, region: "South", conference: "Big Ten", record: "27-6",
    adjO: 119.5, adjD: 93.5, tempo: 69.8, sos: 0.88,
    qualitative: { momentum: 0.85, coaching: 0.94, experience: 0.88, clutch: 0.86, injury_impact: 0.0 } },

  { name: "Iowa State", seed: 3, region: "South", conference: "Big 12", record: "26-7",
    adjO: 116.8, adjD: 92.5, tempo: 65.8, sos: 0.89,
    qualitative: { momentum: 0.82, coaching: 0.86, experience: 0.84, clutch: 0.82, injury_impact: 0.0 } },

  { name: "Texas A&M", seed: 4, region: "South", conference: "SEC", record: "25-8",
    adjO: 118.0, adjD: 95.0, tempo: 67.4, sos: 0.90,
    qualitative: { momentum: 0.78, coaching: 0.84, experience: 0.82, clutch: 0.78, injury_impact: 0.03 } },

  { name: "Clemson", seed: 5, region: "South", conference: "ACC", record: "24-9",
    adjO: 115.5, adjD: 95.8, tempo: 66.8, sos: 0.83,
    qualitative: { momentum: 0.76, coaching: 0.80, experience: 0.78, clutch: 0.75, injury_impact: 0.0 } },

  { name: "Illinois", seed: 6, region: "South", conference: "Big Ten", record: "23-10",
    adjO: 116.2, adjD: 97.0, tempo: 70.5, sos: 0.87,
    qualitative: { momentum: 0.73, coaching: 0.78, experience: 0.76, clutch: 0.74, injury_impact: 0.0 } },

  { name: "Marquette", seed: 7, region: "South", conference: "Big East", record: "23-10",
    adjO: 114.5, adjD: 96.8, tempo: 68.0, sos: 0.84,
    qualitative: { momentum: 0.70, coaching: 0.86, experience: 0.80, clutch: 0.78, injury_impact: 0.05 } },

  { name: "Louisville", seed: 8, region: "South", conference: "ACC", record: "22-11",
    adjO: 113.0, adjD: 97.5, tempo: 71.2, sos: 0.82,
    qualitative: { momentum: 0.74, coaching: 0.76, experience: 0.74, clutch: 0.72, injury_impact: 0.0 } },

  { name: "Creighton", seed: 9, region: "South", conference: "Big East", record: "22-11",
    adjO: 114.2, adjD: 98.5, tempo: 67.2, sos: 0.83,
    qualitative: { momentum: 0.72, coaching: 0.82, experience: 0.80, clutch: 0.76, injury_impact: 0.0 } },

  { name: "New Mexico", seed: 10, region: "South", conference: "MWC", record: "24-9",
    adjO: 112.8, adjD: 98.8, tempo: 70.8, sos: 0.74,
    qualitative: { momentum: 0.78, coaching: 0.76, experience: 0.78, clutch: 0.74, injury_impact: 0.0 } },

  { name: "San Diego State", seed: 11, region: "South", conference: "MWC", record: "22-11",
    adjO: 110.8, adjD: 96.2, tempo: 64.5, sos: 0.75,
    qualitative: { momentum: 0.70, coaching: 0.84, experience: 0.82, clutch: 0.78, injury_impact: 0.0 } },

  { name: "McNeese", seed: 12, region: "South", conference: "Southland", record: "29-4",
    adjO: 110.2, adjD: 99.0, tempo: 72.0, sos: 0.45,
    qualitative: { momentum: 0.88, coaching: 0.72, experience: 0.74, clutch: 0.70, injury_impact: 0.0 } },

  { name: "High Point", seed: 13, region: "South", conference: "Big South", record: "27-6",
    adjO: 107.5, adjD: 100.2, tempo: 68.8, sos: 0.40,
    qualitative: { momentum: 0.82, coaching: 0.68, experience: 0.70, clutch: 0.66, injury_impact: 0.0 } },

  { name: "Troy", seed: 14, region: "South", conference: "Sun Belt", record: "26-8",
    adjO: 106.5, adjD: 101.5, tempo: 69.5, sos: 0.42,
    qualitative: { momentum: 0.76, coaching: 0.66, experience: 0.68, clutch: 0.64, injury_impact: 0.0 } },

  { name: "Bryant", seed: 15, region: "South", conference: "AEC", record: "25-8",
    adjO: 104.0, adjD: 102.8, tempo: 67.5, sos: 0.36,
    qualitative: { momentum: 0.72, coaching: 0.62, experience: 0.66, clutch: 0.60, injury_impact: 0.0 } },

  { name: "Mount St. Mary's", seed: 16, region: "South", conference: "MAAC", record: "23-11",
    adjO: 101.5, adjD: 104.8, tempo: 66.2, sos: 0.33,
    qualitative: { momentum: 0.68, coaching: 0.60, experience: 0.64, clutch: 0.58, injury_impact: 0.0 } },

  // === MIDWEST REGION ===
  { name: "Houston", seed: 1, region: "Midwest", conference: "Big 12", record: "29-4",
    adjO: 120.5, adjD: 89.8, tempo: 65.5, sos: 0.90,
    qualitative: { momentum: 0.88, coaching: 0.94, experience: 0.86, clutch: 0.88, injury_impact: 0.0 } },

  { name: "Tennessee", seed: 2, region: "Midwest", conference: "SEC", record: "27-6",
    adjO: 118.2, adjD: 91.2, tempo: 66.8, sos: 0.91,
    qualitative: { momentum: 0.84, coaching: 0.88, experience: 0.85, clutch: 0.84, injury_impact: 0.0 } },

  { name: "Kentucky", seed: 3, region: "Midwest", conference: "SEC", record: "25-8",
    adjO: 119.8, adjD: 94.5, tempo: 71.0, sos: 0.90,
    qualitative: { momentum: 0.80, coaching: 0.86, experience: 0.78, clutch: 0.80, injury_impact: 0.0 } },

  { name: "Purdue", seed: 4, region: "Midwest", conference: "Big Ten", record: "25-8",
    adjO: 120.2, adjD: 95.8, tempo: 68.2, sos: 0.87,
    qualitative: { momentum: 0.76, coaching: 0.84, experience: 0.88, clutch: 0.82, injury_impact: 0.0 } },

  { name: "Gonzaga", seed: 5, region: "Midwest", conference: "WCC", record: "27-6",
    adjO: 121.5, adjD: 97.2, tempo: 72.8, sos: 0.72,
    qualitative: { momentum: 0.85, coaching: 0.92, experience: 0.84, clutch: 0.86, injury_impact: 0.0 } },

  { name: "UCLA", seed: 6, region: "Midwest", conference: "Big Ten", record: "23-10",
    adjO: 115.0, adjD: 96.5, tempo: 67.5, sos: 0.86,
    qualitative: { momentum: 0.74, coaching: 0.82, experience: 0.78, clutch: 0.76, injury_impact: 0.0 } },

  { name: "Pittsburgh", seed: 7, region: "Midwest", conference: "ACC", record: "23-10",
    adjO: 114.8, adjD: 97.0, tempo: 69.8, sos: 0.82,
    qualitative: { momentum: 0.72, coaching: 0.78, experience: 0.76, clutch: 0.74, injury_impact: 0.0 } },

  { name: "Dayton", seed: 8, region: "Midwest", conference: "A-10", record: "25-8",
    adjO: 113.5, adjD: 97.2, tempo: 68.5, sos: 0.70,
    qualitative: { momentum: 0.80, coaching: 0.82, experience: 0.82, clutch: 0.78, injury_impact: 0.0 } },

  { name: "Colorado State", seed: 9, region: "Midwest", conference: "MWC", record: "24-9",
    adjO: 112.0, adjD: 98.5, tempo: 66.2, sos: 0.73,
    qualitative: { momentum: 0.76, coaching: 0.76, experience: 0.78, clutch: 0.74, injury_impact: 0.0 } },

  { name: "Texas", seed: 10, region: "Midwest", conference: "SEC", record: "21-12",
    adjO: 113.8, adjD: 99.2, tempo: 69.5, sos: 0.88,
    qualitative: { momentum: 0.68, coaching: 0.80, experience: 0.76, clutch: 0.72, injury_impact: 0.05 } },

  { name: "North Carolina", seed: 11, region: "Midwest", conference: "ACC", record: "21-12",
    adjO: 115.2, adjD: 100.5, tempo: 73.5, sos: 0.85,
    qualitative: { momentum: 0.66, coaching: 0.86, experience: 0.80, clutch: 0.78, injury_impact: 0.08 } },

  { name: "Grand Canyon", seed: 12, region: "Midwest", conference: "WAC", record: "27-6",
    adjO: 109.8, adjD: 98.5, tempo: 68.2, sos: 0.48,
    qualitative: { momentum: 0.84, coaching: 0.74, experience: 0.76, clutch: 0.72, injury_impact: 0.0 } },

  { name: "UNC Wilmington", seed: 13, region: "Midwest", conference: "CAA", record: "26-7",
    adjO: 108.2, adjD: 99.8, tempo: 67.0, sos: 0.46,
    qualitative: { momentum: 0.80, coaching: 0.70, experience: 0.74, clutch: 0.68, injury_impact: 0.0 } },

  { name: "Montana", seed: 14, region: "Midwest", conference: "Big Sky", record: "25-8",
    adjO: 106.8, adjD: 101.0, tempo: 69.0, sos: 0.38,
    qualitative: { momentum: 0.76, coaching: 0.68, experience: 0.72, clutch: 0.66, injury_impact: 0.0 } },

  { name: "Quinnipiac", seed: 15, region: "Midwest", conference: "MAAC", record: "24-9",
    adjO: 104.2, adjD: 102.5, tempo: 66.8, sos: 0.36,
    qualitative: { momentum: 0.74, coaching: 0.64, experience: 0.68, clutch: 0.62, injury_impact: 0.0 } },

  { name: "Southeastern Louisiana", seed: 16, region: "Midwest", conference: "Southland", record: "22-12",
    adjO: 101.0, adjD: 105.5, tempo: 68.2, sos: 0.30,
    qualitative: { momentum: 0.66, coaching: 0.58, experience: 0.62, clutch: 0.56, injury_impact: 0.0 } },
];

/**
 * Get all teams indexed by name
 */
function getTeamMap() {
  const map = {};
  for (const team of teams) {
    map[team.name] = team;
  }
  return map;
}

/**
 * Get teams by region
 */
function getTeamsByRegion(region) {
  return teams.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
}

/**
 * Get a team by name (case-insensitive)
 */
function findTeam(name) {
  const lower = name.toLowerCase();
  return teams.find(t => t.name.toLowerCase() === lower);
}

module.exports = { teams, REGIONS, getTeamMap, getTeamsByRegion, findTeam };
