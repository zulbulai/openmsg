/**
 * WhatsApp Account Warmer Engine (Phase 7D.1)
 * Simulates organic peer-to-peer multi-turn conversations between connected accounts
 * Built-in safety: anti-ban random delays, typing indicators, daily quotas, error recovery
 */

const { EventEmitter } = require('events');
const { generateWarmingDialogue } = require('../shared/data/warmer-templates');

class AccountWarmer extends EventEmitter {
  /**
   * @param {Object} options
   * @param {import('./session-manager').SessionManager} options.sessionManager
   * @param {import('./database').LocalDatabase} options.database
   * @param {Function} [options.broadcastProgress]
   */
  constructor(options = {}) {
    super();
    this.sessionManager = options.sessionManager;
    this.db = options.database;
    this.broadcastProgress = options.broadcastProgress || (() => {});

    this.status = 'IDLE'; // 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED'
    this.currentTimer = null;
    this.countdownTimer = null;
    this.nextRunTimestamp = null;
    this.isProcessingRound = false;

    this.currentPair = null;
    this.lastExchange = null;
    this.recentExchanges = [];
  }

  /**
   * Get current engine status snapshot
   */
  getStatus() {
    const nextIn = this.nextRunTimestamp
      ? Math.max(0, Math.round((this.nextRunTimestamp - Date.now()) / 1000))
      : 0;

    return {
      status: this.status,
      isRunning: this.status === 'RUNNING',
      isPaused: this.status === 'PAUSED',
      nextRunInSeconds: nextIn,
      currentPair: this.currentPair,
      lastExchange: this.lastExchange,
      recentExchanges: this.recentExchanges.slice(-10),
      stats: this.db ? this.db.getWarmerStats() : {},
      config: this.db ? this.db.getWarmerConfig() : {}
    };
  }

  /**
   * Start warming process
   * @param {Object} [overrideConfig]
   */
  async start(overrideConfig = {}) {
    if (this.status === 'RUNNING') {
      return { success: true, message: 'Warmer is already running.', status: this.status };
    }

    if (overrideConfig && Object.keys(overrideConfig).length > 0) {
      this.db.saveWarmerConfig(overrideConfig);
    }

    const config = this.db.getWarmerConfig();
    const eligibleAccounts = this._getEligibleAccounts(config);

    if (eligibleAccounts.length < 2) {
      return {
        success: false,
        reason: 'INSUFFICIENT_ACCOUNTS',
        message: `Peer-to-peer warming requires at least 2 connected WhatsApp accounts. Currently active: ${eligibleAccounts.length}.`
      };
    }

    this.status = 'RUNNING';
    this._startCountdownTicker();
    this._emitProgress();

    // Trigger first round with a short initial delay (3-5 seconds)
    const initialDelay = 3000 + Math.floor(Math.random() * 2000);
    this.nextRunTimestamp = Date.now() + initialDelay;

    this.currentTimer = setTimeout(() => {
      this._runCycle();
    }, initialDelay);
    if (this.currentTimer && typeof this.currentTimer.unref === 'function') {
      this.currentTimer.unref();
    }

    return {
      success: true,
      message: 'Account Warmer started successfully.',
      status: this.status
    };
  }

  /**
   * Pause warming
   */
  pause() {
    if (this.status !== 'RUNNING') return { success: false, status: this.status };

    this.status = 'PAUSED';
    this._clearTimers();
    this._emitProgress();
    return { success: true, status: this.status };
  }

  /**
   * Resume warming
   */
  resume() {
    if (this.status !== 'PAUSED') return { success: false, status: this.status };
    this.status = 'RUNNING';
    this._startCountdownTicker();
    this._emitProgress();

    const initialDelay = 1500 + Math.floor(Math.random() * 1500);
    this.nextRunTimestamp = Date.now() + initialDelay;
    this.currentTimer = setTimeout(() => {
      this._runCycle();
    }, initialDelay);
    if (this.currentTimer && typeof this.currentTimer.unref === 'function') {
      this.currentTimer.unref();
    }

    return { success: true, status: this.status };
  }

  /**
   * Stop warming completely
   */
  stop() {
    this.status = 'STOPPED';
    this._clearTimers();
    this.nextRunTimestamp = null;
    this.currentPair = null;
    this._emitProgress();
    return { success: true, status: this.status };
  }

  /**
   * Internal cycle runner
   */
  async _runCycle() {
    if (this.status !== 'RUNNING' || this.isProcessingRound) return;

    this.isProcessingRound = true;
    try {
      const config = this.db.getWarmerConfig();
      const accounts = this._getEligibleAccounts(config);

      if (accounts.length < 2) {
        this.status = 'IDLE';
        this._clearTimers();
        this._emitProgress({
          error: 'Insufficient connected accounts to continue warming.'
        });
        return;
      }

      // Check daily target cap
      const warmerStats = this.db.getWarmerStats().accounts || {};
      const target = Number(config.dailyTarget) || 30;

      const nonCappedAccounts = accounts.filter(acc => {
        const stat = warmerStats[acc.id];
        return !stat || (stat.sentToday || 0) < target;
      });

      if (nonCappedAccounts.length === 0) {
        this.status = 'COMPLETED';
        this._clearTimers();
        this._emitProgress({
          message: 'All selected accounts have reached their daily warming target!'
        });
        return;
      }

      // Pick sender (among non-capped) and receiver (any distinct account with phone)
      const sender = nonCappedAccounts[Math.floor(Math.random() * nonCappedAccounts.length)];
      const possibleReceivers = accounts.filter(a => a.id !== sender.id && a.phone);

      if (possibleReceivers.length === 0) {
        throw new Error('No eligible receiver phone found.');
      }

      const receiver = possibleReceivers[Math.floor(Math.random() * possibleReceivers.length)];
      this.currentPair = {
        from: { id: sender.id, name: sender.name, phone: sender.phone },
        to: { id: receiver.id, name: receiver.name, phone: receiver.phone }
      };

      // Generate dialogue
      const dialogue = generateWarmingDialogue({
        categories: config.enabledCategories,
        customTemplates: config.customTemplates
      });

      // ─── Turn 1: Sender -> Receiver ──────────────────────────────────────
      await this._simulateMessage({
        from: sender,
        to: receiver,
        text: dialogue.starter,
        turn: 'starter',
        dialogueTitle: dialogue.title,
        simulateTyping: Boolean(config.simulateTyping)
      });

      // Natural pause for reading and thinking (4 to 10 seconds)
      if (this.status === 'RUNNING' && dialogue.reply) {
        const readDelay = 4000 + Math.floor(Math.random() * 6000);
        await this._sleep(readDelay);

        // ─── Turn 2: Receiver -> Sender (Contextual Reply) ─────────────────
        if (this.status === 'RUNNING') {
          await this._simulateMessage({
            from: receiver,
            to: sender,
            text: dialogue.reply,
            turn: 'reply',
            dialogueTitle: dialogue.title,
            simulateTyping: Boolean(config.simulateTyping)
          });
        }
      }

      // Optional Turn 3: Sender -> Receiver (Short acknowledgment/emoji)
      if (this.status === 'RUNNING' && dialogue.followup && Math.random() > 0.35) {
        const ackDelay = 3000 + Math.floor(Math.random() * 4000);
        await this._sleep(ackDelay);

        if (this.status === 'RUNNING') {
          await this._simulateMessage({
            from: sender,
            to: receiver,
            text: dialogue.followup,
            turn: 'followup',
            dialogueTitle: dialogue.title,
            simulateTyping: Boolean(config.simulateTyping)
          });
        }
      }
    } catch (err) {
      console.error('[AccountWarmer] Error in warming cycle:', err);
      this.db.recordWarmerMessage({
        fromAccountId: this.currentPair ? this.currentPair.from.id : null,
        toAccountId: this.currentPair ? this.currentPair.to.id : null,
        message: 'Cycle execution error',
        status: 'failed',
        error: err.message
      });
    } finally {
      this.isProcessingRound = false;

      // Schedule next conversational round if still running
      if (this.status === 'RUNNING') {
        const config = this.db.getWarmerConfig();
        const minSec = Math.max(10, Number(config.minDelay) || 45);
        const maxSec = Math.max(minSec + 5, Number(config.maxDelay) || 180);
        const delaySeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

        this.nextRunTimestamp = Date.now() + (delaySeconds * 1000);
        this._emitProgress();

        this.currentTimer = setTimeout(() => {
          this._runCycle();
        }, delaySeconds * 1000);
        if (this.currentTimer && typeof this.currentTimer.unref === 'function') {
          this.currentTimer.unref();
        }
      }
    }
  }

  /**
   * Helper to simulate a single message exchange
   */
  async _simulateMessage({ from, to, text, turn, dialogueTitle, simulateTyping }) {
    let success = false;
    let errorMsg = null;

    try {
      if (this.sessionManager && typeof this.sessionManager.execute === 'function') {
        await this.sessionManager.execute('SEND_MESSAGE', {
          phone: to.phone,
          message: text,
          simulateTyping,
          typingDurationMs: 2500 + Math.floor(Math.random() * 1500)
        }, from.id);
      }
      success = true;
    } catch (err) {
      console.warn(`[AccountWarmer] Send failed (${from.name} -> ${to.name}):`, err.message);
      errorMsg = err.message;
    }

    const logEntry = this.db.recordWarmerMessage({
      fromAccountId: from.id,
      toAccountId: to.id,
      fromPhone: from.phone,
      toPhone: to.phone,
      message: text,
      status: success ? 'sent' : 'failed',
      error: errorMsg
    });

    const exchange = {
      id: logEntry.id || 'ex_' + Date.now(),
      timestamp: Date.now(),
      fromName: from.name,
      toName: to.name,
      fromPhone: from.phone,
      toPhone: to.phone,
      text,
      turn,
      dialogueTitle,
      status: success ? 'sent' : 'failed'
    };

    this.lastExchange = exchange;
    this.recentExchanges.push(exchange);
    if (this.recentExchanges.length > 30) {
      this.recentExchanges.shift();
    }

    this._emitProgress({ lastExchange: exchange });
    return success;
  }

  /**
   * Filter accounts that are connected and eligible for warming
   */
  _getEligibleAccounts(config) {
    if (!this.db) return [];
    const allAccounts = this.db.getAccounts() || [];
    const selectedIds = config.selectedAccounts || [];

    return allAccounts.filter(acc => {
      // Must have valid phone
      if (!acc.phone || acc.phone.trim() === '') return false;

      // If user specified selected accounts, must match
      if (selectedIds.length > 0 && !selectedIds.includes(acc.id)) return false;

      // In real session manager, verify if session is connected
      if (this.sessionManager && this.sessionManager.sessions) {
        const s = this.sessionManager.sessions.get(acc.id);
        if (s && s.status !== 'CONNECTED') return false;
      }
      return true;
    });
  }

  /**
   * Countdown ticker to broadcast remaining seconds every second
   */
  _startCountdownTicker() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      if (this.status !== 'RUNNING') {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        return;
      }
      this._emitProgress();
    }, 1000);
    if (this.countdownTimer && typeof this.countdownTimer.unref === 'function') {
      this.countdownTimer.unref();
    }
  }

  _clearTimers() {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  _emitProgress(extra = {}) {
    const payload = {
      ...this.getStatus(),
      ...extra
    };
    this.emit('progress', payload);
    try {
      this.broadcastProgress(payload);
    } catch (e) {
      // ignore
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { AccountWarmer };
