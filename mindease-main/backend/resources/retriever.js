const fs = require('fs');
const path = require('path');

const RESOURCES_PATH = path.join(__dirname, 'resources.json');

let cached = null;

function loadResources() {
  if (cached) return cached;
  const raw = fs.readFileSync(RESOURCES_PATH, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

function inferTags(text) {
  const t = String(text || '').toLowerCase();
  const tags = new Set();

  if (/\b(anxiety|anxious|panic|panicking)\b/.test(t)) tags.add('anxiety');
  if (/\bpanic\b/.test(t)) tags.add('panic');
  if (/\b(stress|stressed|overwhelmed|overwhelm)\b/.test(t)) tags.add('stress');
  if (/\b(sleep|insomnia|tired|exhausted)\b/.test(t)) tags.add('sleep');
  if (/\b(exam|exams|study|studying|deadline|assignment)\b/.test(t)) tags.add('exam');
  if (/\b(lonely|alone)\b/.test(t)) tags.add('lonely');
  if (/\b(depressed|depression|hopeless|empty|low)\b/.test(t)) tags.add('depression');

  return Array.from(tags);
}

function retrieveResources({ text, riskLevel, limit = 3 }) {
  const resources = loadResources();
  const items = Array.isArray(resources.items) ? resources.items : [];
  const tags = inferTags(text);

  const scored = items.map((item) => {
    const itemTags = Array.isArray(item.tags) ? item.tags : [];
    let score = 0;
    for (const tag of tags) if (itemTags.includes(tag)) score += 2;
    if (riskLevel === 'high' && itemTags.includes('high_risk')) score += 3;
    if (riskLevel === 'medium' && itemTags.includes('depression')) score += 1;
    return { item, score };
  });

  const picked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Number(limit) || 3))
    .map((s) => s.item);

  return picked;
}

function resourcesToPromptContext(resources) {
  const items = Array.isArray(resources) ? resources : [];
  if (!items.length) return '';
  const lines = items.slice(0, 5).map((r) => `- ${r.title}: ${r.text}`);
  return `Helpful grounded suggestions (use if relevant):\n${lines.join('\n')}`.slice(0, 900);
}

module.exports = {
  retrieveResources,
  resourcesToPromptContext
};

