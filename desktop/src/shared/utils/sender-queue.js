/**
 * Anti-Ban Smart Rate-Limited Sender Queue
 * Enforces humanized delay intervals, batch sleeping, and typing indicators
 */

const { EventEmitter } = require('events');
const { preparePersonalizedMessage } = require('./spintax');

class SenderQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      minDelayMs: options.minDelayMs || 5000,     // 5 seconds min
      maxDelayMs: options.maxDelayMs || 15000,    // 15 seconds max
      batchSize: options.batchSize || 25,         // Pause every 25 messages
      batchPauseMs: options.batchPauseMs || 120000, // 2 minutes sleep
      simulateTyping: options.simulateTyping !== false,
      typingDurationMs: options.typingDurationMs || 2500,
      ...options
    };

    this.queue = [];
    this.isRunning = false;
    this.isPaused = false;
    this.totalSent = 0;
    this.totalFailed = 0;
    this.currentIndex = 0;
    this.currentTimer = null;
  }

  setItems(items, template, attachments = []) {
    this.queue = items.map((item, idx) => ({
      id: item.id || `item_${idx}_${Date.now()}`,
      phone: item.phone,
      data: item,
      template: template,
      attachments: attachments,
      status: 'pending', // pending, sending, sent, failed
      error: null
    }));
    this.currentIndex = 0;
    this.totalSent = 0;
    this.totalFailed = 0;
    this.emit('stats', this.getStats());
  }

  getStats() {
    return {
      total: this.queue.length,
      current: this.currentIndex,
      sent: this.totalSent,
      failed: this.totalFailed,
      pending: Math.max(0, this.queue.length - this.currentIndex),
      isRunning: this.isRunning,
      isPaused: this.isPaused
    };
  }

  start(sendHandler) {
    if (this.isRunning && !this.isPaused) return;
    this.isRunning = true;
    this.isPaused = false;
    this.sendHandler = sendHandler;
    this.emit('started');
    this._processNext();
  }

  pause() {
    this.isPaused = true;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.emit('paused', this.getStats());
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.emit('resumed', this.getStats());
    this._processNext();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.emit('stopped', this.getStats());
  }

  async _processNext() {
    if (!this.isRunning || this.isPaused) return;

    if (this.currentIndex >= this.queue.length) {
      this.isRunning = false;
      this.emit('completed', this.getStats());
      return;
    }

    // Check if we hit batch pause limit
    if (this.totalSent > 0 && this.totalSent % this.options.batchSize === 0) {
      this.emit('batch_pause', {
        pauseMs: this.options.batchPauseMs,
        sentCount: this.totalSent
      });
      await this._sleep(this.options.batchPauseMs);
      if (!this.isRunning || this.isPaused) return;
    }

    const currentItem = this.queue[this.currentIndex];
    currentItem.status = 'sending';
    this.emit('item_sending', currentItem);

    try {
      const personalizedBody = preparePersonalizedMessage(currentItem.template, currentItem.data);

      if (this.sendHandler) {
        await this.sendHandler({
          phone: currentItem.phone,
          message: personalizedBody,
          attachments: currentItem.attachments,
          simulateTyping: this.options.simulateTyping,
          typingDurationMs: this.options.typingDurationMs
        });
      }

      currentItem.status = 'sent';
      this.totalSent++;
      this.emit('item_sent', currentItem);
    } catch (err) {
      currentItem.status = 'failed';
      currentItem.error = err.message || String(err);
      this.totalFailed++;
      this.emit('item_failed', currentItem);
    }

    this.currentIndex++;
    this.emit('stats', this.getStats());

    if (this.currentIndex < this.queue.length && this.isRunning && !this.isPaused) {
      // Calculate randomized human delay
      const randomDelay = Math.floor(
        Math.random() * (this.options.maxDelayMs - this.options.minDelayMs + 1)
      ) + this.options.minDelayMs;

      this.emit('delay_started', { delayMs: randomDelay });
      this.currentTimer = setTimeout(() => {
        this.currentTimer = null;
        this._processNext();
      }, randomDelay);
    } else if (this.currentIndex >= this.queue.length) {
      this.isRunning = false;
      this.emit('completed', this.getStats());
    }
  }

  _sleep(ms) {
    return new Promise(resolve => {
      this.currentTimer = setTimeout(() => {
        this.currentTimer = null;
        resolve();
      }, ms);
    });
  }
}

module.exports = { SenderQueue };
