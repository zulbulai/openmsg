/**
 * Automated Core Unit Tests for OpenMsg Desktop
 * Tests Spintax, SenderQueue, HWID/Licensing, Database, and AI Rules
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { parseSpintax, replaceVariables, preparePersonalizedMessage } = require('../src/shared/utils/spintax');
const { SenderQueue } = require('../src/shared/utils/sender-queue');
const { getHardwareId, generateLicenseKey, verifyLicenseKey } = require('../src/shared/utils/hwid');
const { LocalDatabase } = require('../src/main/database');
const { AiEngine } = require('../src/main/ai-engine');

test('Spintax Parser - Basic & Nested Variations', () => {
  const template = '{Hello|Hi|Greetings} friend!';
  const result = parseSpintax(template);
  assert.ok(['Hello friend!', 'Hi friend!', 'Greetings friend!'].includes(result), `Unexpected result: ${result}`);

  // Test nested spintax
  const nested = '{Good {morning|afternoon}|Welcome} user!';
  const nestedResult = parseSpintax(nested);
  assert.ok(
    ['Good morning user!', 'Good afternoon user!', 'Welcome user!'].includes(nestedResult),
    `Unexpected nested result: ${nestedResult}`
  );
});

test('Spintax & Variables - Full Personalization', () => {
  const template = '{Hey|Hello} {{Name}}, welcome to {{Company}}!';
  const contact = { Name: 'Jitendra', Company: 'OpenMsg' };
  const res = preparePersonalizedMessage(template, contact);

  assert.ok(
    ['Hey Jitendra, welcome to OpenMsg!', 'Hello Jitendra, welcome to OpenMsg!'].includes(res),
    `Personalized message mismatch: ${res}`
  );
});

test('HWID & Cryptographic Licensing System', () => {
  const hwid = getHardwareId();
  assert.match(hwid, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

  // 1. Generate valid lifetime license key
  const validKey = generateLicenseKey(hwid, {
    customer: 'VIP Client',
    plan: 'PRO_ENTERPRISE',
    expiresAt: null
  });

  const checkValid = verifyLicenseKey(validKey, hwid);
  assert.equal(checkValid.valid, true);
  assert.equal(checkValid.plan, 'PRO_ENTERPRISE');
  assert.equal(checkValid.customer, 'VIP Client');
  assert.equal(checkValid.isLifetime, true);

  // 2. Test forged signature
  const forgedKey = validKey.slice(0, -4) + 'FFFF';
  const checkForged = verifyLicenseKey(forgedKey, hwid);
  assert.equal(checkForged.valid, false);
  assert.match(checkForged.reason, /signature/i);

  // 3. Test machine lock mismatch
  const wrongHwid = '9999-8888-7777-6666';
  const checkMismatch = verifyLicenseKey(validKey, wrongHwid);
  assert.equal(checkMismatch.valid, false);
  assert.match(checkMismatch.reason, /different machine/i);

  // 4. Test expired key
  const expiredKey = generateLicenseKey(hwid, {
    customer: 'Expired User',
    plan: 'PRO_MONTHLY',
    expiresAt: Date.now() - 10000 // 10s in the past
  });
  const checkExpired = verifyLicenseKey(expiredKey, hwid);
  assert.equal(checkExpired.valid, false);
  assert.match(checkExpired.reason, /expired/i);
});

test('SenderQueue - Anti-Ban Rate Limiting & Execution', async () => {
  const queue = new SenderQueue({
    minDelayMs: 10,
    maxDelayMs: 25,
    batchSize: 2,
    batchPauseMs: 50,
    simulateTyping: false
  });

  const mockItems = [
    { phone: '919876543210', Name: 'Alice' },
    { phone: '919876543211', Name: 'Bob' },
    { phone: '919876543212', Name: 'Charlie' }
  ];

  queue.setItems(mockItems, 'Hello {{Name}}');

  const dispatched = [];
  const completedPromise = new Promise(resolve => {
    queue.on('completed', (stats) => {
      resolve(stats);
    });
  });

  queue.start(async (item) => {
    dispatched.push(item);
  });

  const finalStats = await completedPromise;

  assert.equal(finalStats.total, 3);
  assert.equal(finalStats.sent, 3);
  assert.equal(finalStats.failed, 0);
  assert.equal(dispatched.length, 3);
  assert.equal(dispatched[0].phone, '919876543210');
  assert.equal(dispatched[0].message, 'Hello Alice');
});

test('LocalDatabase & AI Engine Rule Matching', () => {
  const tmpDbPath = path.join(__dirname, 'tmp_test_db.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // Test account creation
  db.addAccount({ id: 'acc_1', name: 'Test WhatsApp', phone: '123456789' });
  assert.equal(db.getAccounts().length, 1);
  assert.equal(db.getAccounts()[0].name, 'Test WhatsApp');

  // Test AI Engine rules
  const aiEngine = new AiEngine(db);

  // Default welcome rule
  const matchHello = aiEngine.evaluateRules('Hello there!');
  assert.ok(matchHello);
  assert.match(matchHello.response, /How can we help/i);

  // Regex rule
  db.saveRules([
    {
      id: 'rule_regex',
      trigger: '^order #?[0-9]+',
      matchType: 'regex',
      response: 'Tracking your order now...',
      isActive: true
    }
  ]);

  const matchOrder = aiEngine.evaluateRules('Order #12345 status');
  assert.ok(matchOrder);
  assert.equal(matchOrder.response, 'Tracking your order now...');

  // Match types: exact, startswith, endswith
  db.saveRules([
    { id: 'r_exact', trigger: 'hi', matchType: 'exact', response: 'Exact Hi!', isActive: true },
    { id: 'r_starts', trigger: 'menu', matchType: 'startswith', response: 'Here is our menu', isActive: true },
    { id: 'r_ends', trigger: 'thanks', matchType: 'endswith', response: 'You are welcome!', isActive: true },
    { id: 'r_spintax', trigger: 'deal', matchType: 'contains', response: '{Hot|Best} deal for {{phone}}', isActive: true }
  ]);

  // Exact match
  assert.ok(aiEngine.evaluateRules('hi'));
  assert.equal(aiEngine.evaluateRules('hi there'), null); // should not match exact

  // StartsWith
  assert.ok(aiEngine.evaluateRules('menu items for lunch'));
  assert.equal(aiEngine.evaluateRules('see our menu'), null);

  // EndsWith
  assert.ok(aiEngine.evaluateRules('many thanks'));
  assert.equal(aiEngine.evaluateRules('thanks a lot'), null);

  // Spintax & Dynamic Variable evaluation
  const spintaxMatch = aiEngine.evaluateRules('What is the deal today?', { senderPhone: '919876543210' });
  assert.ok(spintaxMatch);
  assert.match(spintaxMatch.response, /(Hot|Best) deal for 919876543210/);

  // testRuleMatch dry-run
  const dryRun = aiEngine.testRuleMatch('what is the deal?', { phone: '12345' });
  assert.ok(dryRun.matched);
  assert.equal(dryRun.ruleId, 'r_spintax');

  // Inactive rule should not match
  db.saveRules([
    {
      id: 'rule_inactive',
      trigger: 'pricing',
      matchType: 'contains',
      response: 'Plans start at $10',
      isActive: false
    }
  ]);
  const matchInactive = aiEngine.evaluateRules('Can you tell me the pricing?');
  assert.equal(matchInactive, null);

  // Chatbot Logs persistence
  db.addChatbotLog({
    senderPhone: '919876543210',
    incomingText: 'hello',
    replySource: 'Rule: hello',
    replyText: 'Hi there!',
    status: 'sent'
  });
  const logs = db.getChatbotLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].senderPhone, '919876543210');
  assert.equal(logs[0].status, 'sent');
  db.clearChatbotLogs();
  assert.equal(db.getChatbotLogs().length, 0);

  // Conversation history multi-turn memory
  db.appendConversationHistory('919876543210', { role: 'user', text: 'Do you sell laptops?' });
  db.appendConversationHistory('919876543210', { role: 'assistant', text: 'Yes, Dell and HP.' });
  const hist = db.getConversationHistory('919876543210');
  assert.equal(hist.length, 2);
  assert.equal(hist[0].role, 'user');
  assert.equal(hist[1].role, 'assistant');
  db.clearConversationHistory('919876543210');
  assert.equal(db.getConversationHistory('919876543210').length, 0);

  // Clean up
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

test('SenderQueue - Multi-Message Rotation & Interactive Buttons (Phase 7E)', async () => {
  const queue = new SenderQueue({
    minDelayMs: 5,
    maxDelayMs: 15,
    batchSize: 10,
    batchPauseMs: 50,
    simulateTyping: false
  });

  const mockContacts = [
    { phone: '1001', Name: 'User 1' },
    { phone: '1002', Name: 'User 2' },
    { phone: '1003', Name: 'User 3' },
    { phone: '1004', Name: 'User 4' }
  ];

  const variants = [
    'Variant A for {{Name}}',
    'Variant B for {{Name}}'
  ];

  const buttons = {
    type: 'link',
    text: 'Visit Site',
    url: 'https://openmsg.org'
  };

  // 1. Sequential Round-Robin Rotation
  queue.setItems(mockContacts, 'Default', [], {
    messages: variants,
    rotationMode: 'sequential',
    buttons: buttons
  });

  const sentPayloads = [];
  const completedPromise = new Promise(resolve => {
    queue.on('completed', resolve);
  });

  queue.start(async (item) => {
    sentPayloads.push(item);
  });

  await completedPromise;

  assert.equal(sentPayloads.length, 4);
  assert.equal(sentPayloads[0].message, 'Variant A for User 1');
  assert.equal(sentPayloads[1].message, 'Variant B for User 2');
  assert.equal(sentPayloads[2].message, 'Variant A for User 3');
  assert.equal(sentPayloads[3].message, 'Variant B for User 4');
  assert.deepEqual(sentPayloads[0].buttons, buttons);
});

test('Database - Phase 7 Leads, Warmer & Dashboard Stats', () => {
  const tmpDbPath = path.join(__dirname, 'tmp_phase7_db.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // 1. Initial dashboard stats
  const initialStats = db.getDashboardStats();
  assert.equal(initialStats.totalAccounts, 0);
  assert.equal(initialStats.totalMapLeads, 0);
  assert.equal(initialStats.messagesSentToday, 0);

  // 2. Google Maps Leads
  const leads = [
    { name: 'Dr. Smile Dental', phone: '12125550199', address: '123 5th Ave', rating: '4.8', website: 'https://drsmile.com', city: 'NYC', keyword: 'Dentist' },
    { name: 'Apex Orthodontics', phone: '12125550200', address: '456 Madison Ave', rating: '4.9', website: '', city: 'NYC', keyword: 'Dentist' }
  ];
  const addRes = db.addMapLeads(leads);
  assert.equal(addRes.added, 2);
  assert.equal(db.getMapLeads().length, 2);

  // Deduplication check
  const dupRes = db.addMapLeads([leads[0]]);
  assert.equal(dupRes.added, 0);
  assert.equal(db.getMapLeads().length, 2);

  // 3. Warmer Stats & Config
  const cfg = db.getWarmerConfig();
  assert.equal(cfg.dailyTarget, 30);

  db.saveWarmerConfig({ dailyTarget: 50, minDelay: 30, maxDelay: 90 });
  assert.equal(db.getWarmerConfig().dailyTarget, 50);

  db.recordWarmerMessage('acc_1');
  db.recordWarmerMessage('acc_1');
  const wStats = db.getWarmerStats();
  assert.equal(wStats.accounts['acc_1'].sentToday, 2);
  assert.equal(wStats.accounts['acc_1'].totalAllTime, 2);
  assert.equal(wStats.totalSentToday, 2);

  // 4. Aggregated Dashboard Stats check
  const updatedStats = db.getDashboardStats();
  assert.equal(updatedStats.totalMapLeads, 2);
  assert.equal(updatedStats.messagesSentToday, 2);

  // Clear leads
  db.clearMapLeads();
  assert.equal(db.getMapLeads().length, 0);

  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

test('Group Link Extraction Pattern', () => {
  const sampleHtml = `
    <div>Check out our crypto group at https://chat.whatsapp.com/J9F7b2X9K1mL5p8Q0wR3tZ for signals!</div>
    <p>Another real estate group https://chat.whatsapp.com/A1B2C3D4E5F6G7H8I9J0kL and duplicate https://chat.whatsapp.com/J9F7b2X9K1mL5p8Q0wR3tZ</p>
  `;

  const regex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]{20,24})/gi;
  const found = new Set();
  let match;
  while ((match = regex.exec(sampleHtml)) !== null) {
    found.add(match[1]);
  }

  assert.equal(found.size, 2);
  assert.ok(found.has('J9F7b2X9K1mL5p8Q0wR3tZ'));
  assert.ok(found.has('A1B2C3D4E5F6G7H8I9J0kL'));
});

