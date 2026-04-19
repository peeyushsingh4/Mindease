const { getDb } = require('../lib/firebase');

const memoryCollection = () => getDb().collection('chatMemory');

function extractMemorySignals(text) {
  const t = (text || '').toLowerCase();
  const signals = {
    stressors: [],
    triggers: [],
    goals: [],
    repeatedEmotions: []
  };

  if (/exam|assignment|college|study|deadline/.test(t)) signals.stressors.push('college exams/workload');
  if (/family|parent|pressure/.test(t)) signals.stressors.push('family pressure');
  if (/sleep|insomnia|can.t sleep/.test(t)) signals.triggers.push('sleep disruption');
  if (/panic|anxious|anxiety|overwhelm/.test(t)) signals.repeatedEmotions.push('anxiety');
  if (/sad|low|empty|hopeless/.test(t)) signals.repeatedEmotions.push('low mood');
  if (/want to improve|goal|better|focus|routine/.test(t)) signals.goals.push('improve routine/wellbeing');

  return signals;
}

function uniqueMerge(existing = [], incoming = []) {
  return Array.from(new Set([...(existing || []), ...(incoming || [])])).slice(0, 10);
}

async function getUserMemory(userId) {
  const doc = await memoryCollection().doc(userId).get();
  if (!doc.exists) {
    return {
      userName: '',
      stressors: [],
      triggers: [],
      goals: [],
      repeatedEmotions: []
    };
  }
  return doc.data();
}

async function updateUserMemory(userId, { userName, userText }) {
  const prev = await getUserMemory(userId);
  const nextSignals = extractMemorySignals(userText || '');

  const merged = {
    userName: userName || prev.userName || '',
    stressors: uniqueMerge(prev.stressors, nextSignals.stressors),
    triggers: uniqueMerge(prev.triggers, nextSignals.triggers),
    goals: uniqueMerge(prev.goals, nextSignals.goals),
    repeatedEmotions: uniqueMerge(prev.repeatedEmotions, nextSignals.repeatedEmotions),
    updatedAt: new Date().toISOString()
  };

  await memoryCollection().doc(userId).set(merged, { merge: true });
  return merged;
}

function memoryToPromptContext(memory) {
  if (!memory) return '';
  const compact = {
    userName: memory.userName || '',
    stressors: memory.stressors || [],
    triggers: memory.triggers || [],
    goals: memory.goals || [],
    repeatedEmotions: memory.repeatedEmotions || []
  };
  return JSON.stringify(compact);
}

module.exports = {
  getUserMemory,
  updateUserMemory,
  memoryToPromptContext
};

