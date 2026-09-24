/**
 * Automated Unit Tests for OpenMsg Desktop CRM Features
 * Tests Kanban, Canned Responses, Reminders, and Webhooks
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { LocalDatabase } = require('../src/main/database');

const TEST_DB_PATH = path.join(__dirname, 'test_crm_db.json');

function cleanup() {
  if (fs.existsSync(TEST_DB_PATH)) {
    try { fs.unlinkSync(TEST_DB_PATH); } catch (e) {}
  }
}

test('CRM Features - Kanban Board & Pipeline Stages', () => {
  cleanup();
  const db = new LocalDatabase(TEST_DB_PATH);

  // 1. Initial Stages
  const initialData = db.getKanbanData();
  assert.equal(Array.isArray(initialData.stages), true);
  assert.ok(initialData.stages.length >= 6, 'Should have at least 6 default stages');
  assert.equal(initialData.stages[0].id, 'stage_lead');

  // 2. Add New Custom Stage
  const updatedData = db.saveKanbanStage({
    name: 'Contract Review',
    color: '#c4b5fd'
  });
  const customStage = updatedData.stages.find(s => s.name === 'Contract Review');
  assert.ok(customStage, 'Custom stage should be saved');

  // 3. Add Lead Card
  const dataWithCard = db.saveKanbanCard({
    name: 'Acme Enterprise',
    phone: '18005550199',
    stageId: 'stage_lead',
    value: '$2,500',
    tags: ['Enterprise', 'High-Priority'],
    notes: 'Requested customized API setup'
  });
  assert.equal(dataWithCard.cards.length, 1);
  const cardId = dataWithCard.cards[0].id;
  assert.equal(dataWithCard.cards[0].name, 'Acme Enterprise');

  // 4. Move Card to another stage
  const moveSuccess = db.moveKanbanCard(cardId, 'stage_qualified');
  assert.equal(moveSuccess, true);
  const movedCard = db.getKanbanData().cards.find(c => c.id === cardId);
  assert.equal(movedCard.stageId, 'stage_qualified');

  // 5. Delete Card
  const afterDelete = db.deleteKanbanCard(cardId);
  assert.equal(afterDelete.cards.length, 0);

  cleanup();
});

test('CRM Features - Canned Responses & Quick Replies', () => {
  cleanup();
  const db = new LocalDatabase(TEST_DB_PATH);

  // 1. Initial canned responses
  const list = db.getCannedResponses();
  assert.ok(list.length >= 4, 'Should contain default canned responses');
  const intro = list.find(c => c.shortcut === '/intro');
  assert.ok(intro, 'Should contain /intro shortcut');

  // 2. Add new canned reply
  db.saveCannedResponse({
    shortcut: '/demo',
    title: 'Demo Invitation',
    category: 'Sales',
    message: 'We would love to show you a quick 10-minute demo. Are you free tomorrow?'
  });
  const updatedList = db.getCannedResponses();
  const demo = updatedList.find(c => c.shortcut === '/demo');
  assert.ok(demo, 'Should save new canned reply');

  // 3. Delete canned reply
  db.deleteCannedResponse(demo.id);
  const finalList = db.getCannedResponses();
  assert.equal(finalList.some(c => c.id === demo.id), false);

  cleanup();
});

test('CRM Features - Notes & Follow-up Reminders', () => {
  cleanup();
  const db = new LocalDatabase(TEST_DB_PATH);

  // 1. Initial reminders
  assert.deepEqual(db.getReminders(), []);

  // 2. Add reminder
  const due = Date.now() + 86400000;
  const reminders = db.saveReminder({
    title: 'Call Marketing Lead',
    phone: '919876543210',
    name: 'Rajesh Sharma',
    note: 'Inquired about WhatsApp bulk sender software',
    dueAt: due
  });
  assert.equal(reminders.length, 1);
  const remId = reminders[0].id;
  assert.equal(reminders[0].completed, false);

  // 3. Toggle Complete
  const toggleRes = db.toggleReminder(remId);
  assert.equal(toggleRes, true);
  const toggled = db.getReminders().find(r => r.id === remId);
  assert.equal(toggled.completed, true);

  // 4. Delete Reminder
  const afterDel = db.deleteReminder(remId);
  assert.equal(afterDel.length, 0);

  cleanup();
});

test('CRM Features - Webhooks & Event Subscriptions', () => {
  cleanup();
  const db = new LocalDatabase(TEST_DB_PATH);

  // 1. Add Webhook
  const webhooks = db.saveWebhook({
    name: 'Zapier WhatsApp Hook',
    url: 'https://hooks.zapier.com/test',
    events: ['message_received', 'campaign_done']
  });
  assert.equal(webhooks.length, 1);
  const hookId = webhooks[0].id;
  assert.equal(webhooks[0].enabled, true);

  // 2. Toggle Webhook
  webhooks[0].enabled = false;
  db.saveWebhook(webhooks[0]);
  const updatedHooks = db.getWebhooks();
  assert.equal(updatedHooks[0].enabled, false);

  // 3. Delete Webhook
  db.deleteWebhook(hookId);
  assert.equal(db.getWebhooks().length, 0);

  cleanup();
});

test('Live Chat - upsertChatThread and Media Message Types', () => {
  cleanup();
  const db = new LocalDatabase(TEST_DB_PATH);

  // 1. Test upsertChatThread
  const thread = db.upsertChatThread({
    accountId: 'acc_primary',
    phone: '919876543210',
    name: 'Alice Corp',
    lastMessage: '📷 Photo',
    timestamp: Date.now(),
    unreadCount: 2
  });
  assert.equal(thread.phone, '919876543210');
  assert.equal(thread.name, 'Alice Corp');
  assert.equal(thread.lastMessage, '📷 Photo');
  assert.equal(thread.unreadCount, 2);

  // 2. Save rich media message
  const msgRes = db.saveChatMessage({
    accountId: 'acc_primary',
    phone: '919876543210',
    name: 'Alice Corp',
    fromMe: false,
    body: '📷 Product Brochure',
    type: 'image',
    mediaUrl: 'https://example.com/brochure.jpg',
    skipUnread: true,
    timestamp: Date.now()
  });
  assert.equal(msgRes.message.type, 'image');
  assert.equal(msgRes.message.body, '📷 Product Brochure');
  assert.equal(msgRes.thread.unreadCount, 2); // Not incremented because skipUnread=true

  const msgs = db.getChatMessages('919876543210');
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].type, 'image');

  cleanup();
});
