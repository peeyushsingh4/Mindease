/* eslint-disable no-console */
const { spawn } = require('child_process');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const smokePort = process.env.SMOKE_PORT || '5055';
const apiBaseUrl = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${smokePort}/api`;
const healthUrl = process.env.SMOKE_HEALTH_URL || `http://127.0.0.1:${smokePort}/`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(maxAttempts = 80, delayMs = 500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) {
        return;
      }
    } catch (err) {
      // keep retrying until timeout
    }
    await wait(delayMs);
  }
  throw new Error('Backend did not become ready in time.');
}

async function request(method, endpoint, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = { raw: text };
  }

  return { status: res.status, ok: res.ok, data };
}

function createRunner() {
  const failures = [];
  let passed = 0;

  async function test(name, fn) {
    try {
      await fn();
      passed += 1;
      console.log(`✓ ${name}`);
    } catch (err) {
      failures.push({ name, error: err.message });
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function summary() {
    console.log('\n----- Smoke Test Summary -----');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failures.length}`);
    if (failures.length > 0) {
      for (const failure of failures) {
        console.log(`- ${failure.name}: ${failure.error}`);
      }
    }
    return failures.length === 0;
  }

  return { test, assert, summary };
}

async function main() {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: backendRoot,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development', PORT: smokePort },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    process.stdout.write(`[server] ${data}`);
  });
  server.stderr.on('data', (data) => {
    process.stderr.write(`[server:err] ${data}`);
  });

  const { test, assert, summary } = createRunner();
  const runId = Date.now();
  const studentEmail = `student_${runId}@example.com`;
  const counsellorEmail = `counsellor_${runId}@example.com`;
  const password = 'Password123!';

  let studentToken = '';
  let counsellorId = '';

  try {
    await waitForServer();

    await test('register student', async () => {
      const res = await request('POST', '/auth/register', {
        body: {
          name: 'Smoke Student',
          email: studentEmail,
          password,
          role: 'student'
        }
      });
      assert(res.ok && res.data?.token, `Expected token, got status ${res.status}`);
      studentToken = res.data.token;
    });

    await test('login student', async () => {
      const res = await request('POST', '/auth/login', {
        body: { email: studentEmail, password }
      });
      assert(res.ok && res.data?.token, `Expected login token, got status ${res.status}`);
    });

    await test('fetch current user profile', async () => {
      const res = await request('GET', '/auth/me', { token: studentToken });
      assert(res.ok && res.data?.data, `Expected /auth/me data, got status ${res.status}`);
    });

    await test('update guardian details', async () => {
      const res = await request('PUT', '/auth/guardian', {
        token: studentToken,
        body: {
          guardianName: 'Guardian Name',
          guardianPhone: '+911234567890',
          guardianRelation: 'Parent'
        }
      });
      assert(res.ok, `Expected guardian update success, got status ${res.status}`);
    });

    await test('create mood entry', async () => {
      const res = await request('POST', '/mood', {
        token: studentToken,
        body: { level: 4, note: 'Feeling okay in smoke test' }
      });
      assert(res.ok, `Expected mood create success, got status ${res.status}`);
    });

    await test('read mood history', async () => {
      const res = await request('GET', '/mood', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected mood history, got status ${res.status}`);
    });

    await test('submit PHQ-9 screening', async () => {
      const res = await request('POST', '/screening', {
        token: studentToken,
        body: { type: 'PHQ-9', answers: [0, 1, 1, 0, 1, 0, 1, 0, 0] }
      });
      assert(res.ok, `Expected screening submit success, got status ${res.status}`);
    });

    await test('create forum post', async () => {
      const res = await request('POST', '/forum', {
        token: studentToken,
        body: {
          title: `Smoke post ${runId}`,
          content: 'Forum smoke test content.',
          category: 'general',
          isAnonymousPost: true
        }
      });
      assert(res.ok, `Expected forum post success, got status ${res.status}`);
    });

    await test('read forum posts', async () => {
      const res = await request('GET', '/forum', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected forum list, got status ${res.status}`);
    });

    await test('create journal entry', async () => {
      const res = await request('POST', '/journal', {
        token: studentToken,
        body: { content: 'Journal smoke entry.' }
      });
      assert(res.ok, `Expected journal create success, got status ${res.status}`);
    });

    await test('read journal entries', async () => {
      const res = await request('GET', '/journal', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected journal list, got status ${res.status}`);
    });

    await test('register counsellor', async () => {
      const res = await request('POST', '/auth/register', {
        body: {
          name: 'Smoke Counsellor',
          email: counsellorEmail,
          password,
          role: 'counsellor'
        }
      });
      assert(res.ok && res.data?.user, `Expected counsellor user, got status ${res.status}`);
      counsellorId = res.data.user.id || res.data.user._id;
    });

    await test('list counsellors', async () => {
      const res = await request('GET', '/auth/counsellors', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected counsellor list, got status ${res.status}`);
      if (!counsellorId && res.data.data.length > 0) {
        counsellorId = res.data.data[0]._id;
      }
    });

    await test('book appointment', async () => {
      assert(Boolean(counsellorId), 'No counsellor id available for appointment booking.');
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await request('POST', '/appointments', {
        token: studentToken,
        body: {
          counsellorId,
          date,
          timeSlot: '10:00 AM',
          notes: 'Smoke booking'
        }
      });
      assert(res.ok, `Expected appointment booking success, got status ${res.status}`);
    });

    await test('read appointments', async () => {
      const res = await request('GET', '/appointments', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected appointment list, got status ${res.status}`);
    });

    await test('chat non-crisis response', async () => {
      const res = await request('POST', '/chat/respond', {
        token: studentToken,
        body: { message: 'I am a little stressed about exams.' }
      });
      assert(res.ok, `Expected chat response success, got status ${res.status} (${res.data?.error || 'no error body'})`);
      assert(Boolean(res.data?.data?.response), 'Chat response missing assistant text.');
    });

    await test('chat crisis response', async () => {
      const res = await request('POST', '/chat/respond', {
        token: studentToken,
        body: { message: 'I want to end my life.' }
      });
      assert(res.ok, `Expected crisis response success, got status ${res.status}`);
      assert(res.data?.data?.isCrisis === true, 'Expected isCrisis=true for crisis trigger.');
    });

    await test('read chat history', async () => {
      const res = await request('GET', '/chat/history', { token: studentToken });
      assert(res.ok && Array.isArray(res.data?.data), `Expected chat history, got status ${res.status}`);
    });

    const ok = summary();
    process.exitCode = ok ? 0 : 1;
  } catch (err) {
    console.error(`Smoke test setup failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    server.kill('SIGTERM');
    await wait(600);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }
}

main();
