/**
 * Auto WhatsApp Group Joiner Engine — Phase 7C
 * Sequentially joins WhatsApp groups via active session with humanized anti-ban delays.
 */

const { EventEmitter } = require('events');

class GroupJoiner extends EventEmitter {
  constructor(sessionManager) {
    super();
    this.sessionManager = sessionManager;
    this.isRunning = false;
    this.currentTimer = null;
    this.stats = {
      joined: 0,
      failed: 0,
      total: 0,
      remaining: 0
    };
  }

  async startJoin({ accountId, links = [], delaySeconds = 45 }) {
    if (this.isRunning) return;
    this.isRunning = true;

    // Parse and extract invite codes from links
    const parsedLinks = [];
    links.forEach(raw => {
      const trimmed = String(raw).trim();
      if (!trimmed) return;
      const match = trimmed.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i);
      const code = match ? match[1] : trimmed.replace(/[^A-Za-z0-9_-]/g, '');
      if (code && code.length >= 10) {
        parsedLinks.push({
          url: `https://chat.whatsapp.com/${code}`,
          code: code
        });
      }
    });

    if (parsedLinks.length === 0) {
      this.isRunning = false;
      this.emit('completed', { joined: 0, failed: 0, total: 0 });
      return;
    }

    this.stats = {
      joined: 0,
      failed: 0,
      total: parsedLinks.length,
      remaining: parsedLinks.length
    };

    console.log(`[GroupJoiner] Starting join process for ${parsedLinks.length} groups on account ${accountId} (Delay: ${delaySeconds}s)`);
    this.emit('started', this.stats);

    for (let i = 0; i < parsedLinks.length; i++) {
      if (!this.isRunning) break;

      const item = parsedLinks[i];
      this.emit('progress', {
        index: i + 1,
        total: parsedLinks.length,
        link: item.url,
        status: 'joining',
        remaining: parsedLinks.length - i
      });

      try {
        let joinSuccess = false;
        let errMsg = '';

        if (this.sessionManager && typeof this.sessionManager.execute === 'function') {
          try {
            const res = await this.sessionManager.execute('JOIN_GROUP', {
              accountId: accountId,
              inviteCode: item.code
            });
            joinSuccess = !!(res && (res.success || res.status === 200 || res.gid));
            if (!joinSuccess && res && res.error) errMsg = res.error;
          } catch (e) {
            errMsg = e.message || 'Join invocation failed';
          }
        } else {
          // Simulated join for standalone/offline testing
          await this._sleep(1500);
          joinSuccess = true;
        }

        if (joinSuccess) {
          this.stats.joined++;
          this.emit('progress', {
            index: i + 1,
            total: parsedLinks.length,
            link: item.url,
            status: 'joined',
            remaining: parsedLinks.length - (i + 1)
          });
        } else {
          this.stats.failed++;
          this.emit('progress', {
            index: i + 1,
            total: parsedLinks.length,
            link: item.url,
            status: 'failed',
            error: errMsg || 'Invite link expired or revoked',
            remaining: parsedLinks.length - (i + 1)
          });
        }

      } catch (err) {
        this.stats.failed++;
        this.emit('progress', {
          index: i + 1,
          total: parsedLinks.length,
          link: item.url,
          status: 'failed',
          error: err.message,
          remaining: parsedLinks.length - (i + 1)
        });
      }

      this.stats.remaining = Math.max(0, parsedLinks.length - (i + 1));

      // Anti-ban delay before next group (with random ±4s jitter)
      if (i < parsedLinks.length - 1 && this.isRunning) {
        const jitter = Math.floor(Math.random() * 8) - 4;
        const actualWaitMs = Math.max(10, delaySeconds + jitter) * 1000;
        this.emit('delay_waiting', { waitMs: actualWaitMs, nextIndex: i + 2 });
        await this._sleep(actualWaitMs);
      }
    }

    this.isRunning = false;
    this.emit('completed', this.stats);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.emit('stopped', this.stats);
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

module.exports = { GroupJoiner };
