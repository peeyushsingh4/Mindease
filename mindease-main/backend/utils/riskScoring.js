const fs = require('fs');
const path = require('path');

const MODEL_PATH = path.join(__dirname, '..', 'data', 'risk-model.json');

const DEFAULT_MODEL = {
  version: 1,
  thresholdHigh: 0.75,
  thresholdMedium: 0.45,
  bias: 0.1,
  keywordWeights: {
    suicide: 0.85,
    die: 0.7,
    kill: 0.85,
    selfharm: 0.8,
    hopeless: 0.5,
    panic: 0.4,
    anxiety: 0.25,
    depressed: 0.35
  },
  screeningWeights: {
    'PHQ-9': { base: 0.15, scoreScale: 0.03 },
    'GAD-7': { base: 0.1, scoreScale: 0.04 }
  }
};

let cachedModel = null;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function loadModel() {
  if (cachedModel) return cachedModel;
  try {
    const file = fs.readFileSync(MODEL_PATH, 'utf8');
    cachedModel = JSON.parse(file);
  } catch (err) {
    cachedModel = DEFAULT_MODEL;
  }
  return cachedModel;
}

function scoreToLevel(score, model) {
  if (score >= model.thresholdHigh) return 'high';
  if (score >= model.thresholdMedium) return 'medium';
  return 'low';
}

function normalizeToken(token) {
  return String(token || '').toLowerCase().replace(/[^a-z]/g, '');
}

function scoreTextRisk(text) {
  const model = loadModel();
  const tokens = String(text || '').split(/\s+/).map(normalizeToken).filter(Boolean);
  let score = model.bias || 0;
  for (const token of tokens) {
    if (Object.prototype.hasOwnProperty.call(model.keywordWeights || {}, token)) {
      score += Number(model.keywordWeights[token] || 0);
    }
  }
  const riskScore = clamp01(score);
  return {
    score: riskScore,
    level: scoreToLevel(riskScore, model),
    modelVersion: model.version || 1
  };
}

function scoreScreeningRisk(type, score) {
  const model = loadModel();
  const config = (model.screeningWeights || {})[type];
  if (!config) {
    const fallback = clamp01(Number(score || 0) / 30);
    return { score: fallback, level: scoreToLevel(fallback, model), modelVersion: model.version || 1 };
  }
  const riskScore = clamp01((config.base || 0) + Number(score || 0) * Number(config.scoreScale || 0));
  return {
    score: riskScore,
    level: scoreToLevel(riskScore, model),
    modelVersion: model.version || 1
  };
}

module.exports = {
  scoreTextRisk,
  scoreScreeningRisk
};
