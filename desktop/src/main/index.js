/**
 * Main Process Entry Point for OpenMsg Desktop Application
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { getDatabase } = require('./database');
const { SessionManager } = require('./session-manager');
const { AiEngine } = require('./ai-engine');
const { registerIpcHandlers } = require('./ipc-handlers');
const { createMainWindow, getMainWindow } = require('./window-manager');

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const win = getMainWindow();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

let db = null;
let sessionManager = null;
let aiEngine = null;

async function bootstrap() {
  console.log('[OpenMsg Desktop] Bootstrapping application...');

  // 1. Initialize local persistent database
  db = getDatabase();

  // 2. Initialize AI & Autoresponder engine
  aiEngine = new AiEngine(db);

  // 3. Initialize Multi-account Session Manager
  sessionManager = new SessionManager(db);

  // 4. Register all IPC communication channels
  registerIpcHandlers({
    sessionManager,
    db,
    aiEngine,
    getMainWindow
  });

  // 5. Create main dashboard UI window
  createMainWindow();

  // 6. Start active WhatsApp Web sessions in background
  try {
    await sessionManager.initAllAccounts();
  } catch (err) {
    console.error('[OpenMsg Desktop] Error initializing WhatsApp sessions:', err);
  }
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
