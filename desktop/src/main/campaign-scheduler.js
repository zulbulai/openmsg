/**
 * Campaign Scheduler — Persistent Timed Campaign Queue
 * Saves scheduled campaigns to database and auto-triggers them at the specified time
 */

const { EventEmitter } = require('events');

class CampaignScheduler extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;
    this.timers = new Map(); // scheduleId -> timeoutHandle
    this._restoreSchedules();
  }

  /**
   * Schedule a campaign to run at a specific future timestamp
   */
  schedule(campaignPayload, runAt) {
    const id = 'sched_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = Date.now();
    const delayMs = Math.max(0, runAt - now);

    const schedule = {
      id,
      campaignPayload,
      runAt,
      status: 'pending',      // pending, running, completed, cancelled
      createdAt: now
    };

    this._saveSchedule(schedule);

    if (delayMs === 0) {
      // Run immediately
      setImmediate(() => this._triggerSchedule(id));
    } else {
      const handle = setTimeout(() => {
        this._triggerSchedule(id);
      }, delayMs);
      this.timers.set(id, handle);
    }

    console.log(`[Scheduler] Campaign "${campaignPayload.title}" scheduled for ${new Date(runAt).toLocaleString()} (in ${Math.round(delayMs / 1000)}s)`);
    return schedule;
  }

  /**
   * Cancel a pending scheduled campaign
   */
  cancel(scheduleId) {
    if (this.timers.has(scheduleId)) {
      clearTimeout(this.timers.get(scheduleId));
      this.timers.delete(scheduleId);
    }

    const schedules = this._getSchedules();
    const idx = schedules.findIndex(s => s.id === scheduleId);
    if (idx >= 0) {
      schedules[idx].status = 'cancelled';
      this.db.set('scheduledCampaigns', schedules);
    }

    this.emit('schedule-cancelled', { scheduleId });
    return true;
  }

  /**
   * Get all scheduled campaigns
   */
  getAll() {
    return this._getSchedules();
  }

  /**
   * Get only pending (future) schedules
   */
  getPending() {
    return this._getSchedules().filter(s => s.status === 'pending' && s.runAt > Date.now());
  }

  /**
   * Internal — Fire a scheduled campaign
   */
  async _triggerSchedule(scheduleId) {
    const schedules = this._getSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.status !== 'pending') return;

    schedule.status = 'running';
    this._saveSchedule(schedule);

    console.log(`[Scheduler] Triggering scheduled campaign: ${scheduleId}`);
    this.emit('schedule-triggered', schedule);

    this.timers.delete(scheduleId);
  }

  /**
   * Restore timers for pending schedules on startup
   */
  _restoreSchedules() {
    const schedules = this._getSchedules();
    const now = Date.now();
    let restored = 0;

    for (const s of schedules) {
      if (s.status !== 'pending') continue;

      if (s.runAt <= now) {
        // Overdue — trigger now
        setImmediate(() => this._triggerSchedule(s.id));
        restored++;
      } else {
        const delayMs = s.runAt - now;
        const handle = setTimeout(() => this._triggerSchedule(s.id), delayMs);
        this.timers.set(s.id, handle);
        restored++;
      }
    }

    if (restored > 0) {
      console.log(`[Scheduler] Restored ${restored} pending scheduled campaigns`);
    }
  }

  _getSchedules() {
    return this.db.get('scheduledCampaigns') || [];
  }

  _saveSchedule(schedule) {
    const all = this._getSchedules();
    const idx = all.findIndex(s => s.id === schedule.id);
    if (idx >= 0) {
      all[idx] = schedule;
    } else {
      all.unshift(schedule);
    }
    this.db.set('scheduledCampaigns', all);
    return schedule;
  }

  destroy() {
    for (const handle of this.timers.values()) {
      clearTimeout(handle);
    }
    this.timers.clear();
  }
}

module.exports = { CampaignScheduler };
