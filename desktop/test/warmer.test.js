/**
 * Automated Unit Tests for WhatsApp Account Warmer (Phase 7D)
 * Tests:
 * 1. Curated Templates Library (Categories, Spintax parsing, Dialogue Generation)
 * 2. Database Stats & Config Persistence (7-Day Activity, Daily Rollover, Ring Buffer Logs)
 * 3. AccountWarmer Backend Engine (P2P State Machine, Account Validation, Quota Capping)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const {
  CURATED_WARMING_DIALOGUES,
  getAllCuratedDialogues,
  getDialoguesByCategories,
  generateWarmingDialogue
} = require('../src/shared/data/warmer-templates');
const { LocalDatabase } = require('../src/main/database');
const { AccountWarmer } = require('../src/main/account-warmer');

// ─── SUITE 1: CURATED TEMPLATES & SPINTAX ──────────────────────────────────
test('Curated Templates Library - Categories & Count', () => {
  const all = getAllCuratedDialogues();
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 10, `Expected at least 10 dialogues, got ${all.length}`);

  const categories = new Set(all.map(d => d.category));
  assert.ok(categories.has('greetings'), 'Should contain greetings category');
  assert.ok(categories.has('casual'), 'Should contain casual category');
  assert.ok(categories.has('followups'), 'Should contain followups category');
  assert.ok(categories.has('emoji'), 'Should contain emoji category');

  // Filter by category
  const greetingsOnly = getDialoguesByCategories(['greetings']);
  assert.ok(greetingsOnly.every(d => d.category === 'greetings'));

  const casualAndEmoji = getDialoguesByCategories(['casual', 'emoji']);
  assert.ok(casualAndEmoji.every(d => ['casual', 'emoji'].includes(d.category)));
});

test('Dialogue Generation - Spintax Expansion & Structure', () => {
  const dialogue = generateWarmingDialogue({ categories: ['casual', 'greetings'] });
  assert.ok(dialogue.id, 'Dialogue must have an id');
  assert.ok(dialogue.title, 'Dialogue must have a title');
  assert.ok(dialogue.starter, 'Dialogue must have a starter text');
  assert.ok(dialogue.reply, 'Dialogue must have a reply text');

  // Ensure Spintax curly braces are fully parsed/expanded
  assert.equal(dialogue.starter.includes('{'), false, `Starter should not have unresolved Spintax: ${dialogue.starter}`);
  assert.equal(dialogue.starter.includes('}'), false, `Starter should not have unresolved Spintax: ${dialogue.starter}`);
  assert.equal(dialogue.reply.includes('{'), false, `Reply should not have unresolved Spintax: ${dialogue.reply}`);
  assert.equal(dialogue.reply.includes('}'), false, `Reply should not have unresolved Spintax: ${dialogue.reply}`);
});

// ─── SUITE 2: DATABASE PERSISTENCE & 7-DAY STATS ───────────────────────────
test('Database Warmer Persistence - Config & 7-Day Stats', () => {
  const testDbFile = path.join(__dirname, 'test-warmer-db.json');
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);

  try {
    const db = new LocalDatabase(testDbFile);

    // 1. Test Default & Custom Config
    const defaultCfg = db.getWarmerConfig();
    assert.equal(defaultCfg.dailyTarget, 30);
    assert.equal(defaultCfg.minDelay, 45);
    assert.equal(defaultCfg.maxDelay, 180);
    assert.equal(defaultCfg.simulateTyping, true);

    db.saveWarmerConfig({
      dailyTarget: 50,
      minDelay: 20,
      maxDelay: 60,
      enabledCategories: ['casual', 'emoji']
    });
    const updatedCfg = db.getWarmerConfig();
    assert.equal(updatedCfg.dailyTarget, 50);
    assert.equal(updatedCfg.minDelay, 20);
    assert.equal(updatedCfg.maxDelay, 60);

    // 2. Record simulated warming messages
    const log1 = db.recordWarmerMessage({
      fromAccountId: 'acc_1',
      toAccountId: 'acc_2',
      fromPhone: '919876543210',
      toPhone: '919876543211',
      message: 'Hey, good morning!',
      status: 'sent'
    });
    assert.ok(log1.id, 'Log entry should have an ID');
    assert.equal(log1.status, 'sent');

    const log2 = db.recordWarmerMessage({
      fromAccountId: 'acc_2',
      toAccountId: 'acc_1',
      fromPhone: '919876543211',
      toPhone: '919876543210',
      message: 'Morning! Hope you have a great day.',
      status: 'sent'
    });
    assert.equal(log2.status, 'sent');

    // 3. Inspect aggregate stats
    const stats = db.getWarmerStats();
    assert.equal(stats.totalSentToday, 2);
    assert.equal(stats.totalAllTime, 2);
    assert.equal(stats.activeAccountsCount, 2);
    assert.equal(stats.accounts['acc_1'].sentToday, 1);
    assert.equal(stats.accounts['acc_2'].sentToday, 1);

    // 4. Verify 7-day breakdown structure
    assert.equal(Array.isArray(stats.sevenDaysActivity), true);
    assert.equal(stats.sevenDaysActivity.length, 7);
    const todaySlot = stats.sevenDaysActivity.find(d => d.isToday);
    assert.ok(todaySlot, 'Should find slot for today');
    assert.equal(todaySlot.count, 2);

    // 5. Verify logs ring buffer
    assert.equal(stats.recentLogs.length, 2);
    assert.equal(stats.recentLogs[0].id, log2.id); // Most recent first

    // 6. Reset stats
    db.resetWarmerStats();
    const resetStats = db.getWarmerStats();
    assert.equal(resetStats.totalSentToday, 0);
    assert.equal(resetStats.recentLogs.length, 0);
  } finally {
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  }
});

// ─── SUITE 3: ACCOUNT WARMER BACKEND ENGINE ────────────────────────────────
test('AccountWarmer Engine - Lifecycle & P2P State Machine', async () => {
  const testDbFile = path.join(__dirname, 'test-warmer-engine-db.json');
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);

  let warmer = null;
  try {
    const db = new LocalDatabase(testDbFile);

    // Mock session manager
    const sentMessages = [];
    const mockSessionManager = {
      sessions: new Map(),
      execute: async (action, payload, accountId) => {
        if (action === 'SEND_MESSAGE') {
          sentMessages.push({ action, payload, accountId });
          return { messageId: 'msg_' + Date.now() };
        }
        return { success: true };
      }
    };

    const progressEvents = [];
    warmer = new AccountWarmer({
      sessionManager: mockSessionManager,
      database: db,
      broadcastProgress: (p) => progressEvents.push(p)
    });

    // 1. Initial State
    assert.equal(warmer.getStatus().status, 'IDLE');

    // 2. Reject start with 0 or 1 accounts
    const failedStart = await warmer.start();
    assert.equal(failedStart.success, false);
    assert.equal(failedStart.reason, 'INSUFFICIENT_ACCOUNTS');

    // 3. Add 2 mock connected accounts
    db.addAccount({
      id: 'acc_a',
      name: 'Account Alpha',
      phone: '919876543201',
      sessionPartition: 'persist:acc_a',
      createdAt: Date.now(),
      status: 'CONNECTED'
    });
    db.addAccount({
      id: 'acc_b',
      name: 'Account Beta',
      phone: '919876543202',
      sessionPartition: 'persist:acc_b',
      createdAt: Date.now(),
      status: 'CONNECTED'
    });
    mockSessionManager.sessions.set('acc_a', { status: 'CONNECTED' });
    mockSessionManager.sessions.set('acc_b', { status: 'CONNECTED' });

    // 4. Start warmer with short delay
    const startRes = await warmer.start({
      minDelay: 10,
      maxDelay: 20,
      dailyTarget: 5
    });
    assert.equal(startRes.success, true);
    assert.equal(warmer.getStatus().status, 'RUNNING');
    assert.equal(warmer.getStatus().isRunning, true);

    // 5. Test Pause & Resume
    const pauseRes = warmer.pause();
    assert.equal(pauseRes.success, true);
    assert.equal(warmer.getStatus().status, 'PAUSED');

    const resumeRes = await warmer.resume();
    assert.equal(resumeRes.success, true);
    assert.equal(warmer.getStatus().status, 'RUNNING');

    // 6. Test manual execution of a single simulated cycle
    await warmer._simulateMessage({
      from: { id: 'acc_a', name: 'Alpha', phone: '919876543201' },
      to: { id: 'acc_b', name: 'Beta', phone: '919876543202' },
      text: 'Testing P2P message exchange',
      turn: 'starter',
      dialogueTitle: 'Unit Test',
      simulateTyping: false
    });

    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].accountId, 'acc_a');
    assert.equal(sentMessages[0].payload.phone, '919876543202');
    assert.equal(sentMessages[0].payload.message, 'Testing P2P message exchange');

    // 7. Stop warmer
    const stopRes = warmer.stop();
    assert.equal(stopRes.success, true);
    assert.equal(warmer.getStatus().status, 'STOPPED');
    assert.equal(warmer.getStatus().isRunning, false);
  } finally {
    if (warmer) warmer.stop();
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  }
});
