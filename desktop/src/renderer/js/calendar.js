/**
 * Interactive Marketing Calendar Controller for OpenMsg Desktop
 * Ported from Chrome Extension Manifest V3 CRM
 */

window.addEventListener('DOMContentLoaded', () => {
  const monthYearLabel = document.getElementById('calMonthYear');
  const btnPrev = document.getElementById('calBtnPrev');
  const btnNext = document.getElementById('calBtnNext');
  const btnToday = document.getElementById('calBtnToday');
  const gridEl = document.getElementById('calGridDays');
  const selectedDayTitle = document.getElementById('calSelectedDateTitle');
  const selectedDayEvents = document.getElementById('calSelectedDateEvents');
  const btnQuickSchedule = document.getElementById('calBtnQuickSchedule');

  let currentDate = new Date();
  let selectedDate = new Date();
  let scheduledCampaigns = [];
  let reminders = [];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  async function loadEvents() {
    try {
      if (window.api && window.api.getScheduledCampaigns) {
        scheduledCampaigns = (await window.api.getScheduledCampaigns()) || [];
      }
      if (window.api && window.api.getReminders) {
        reminders = (await window.api.getReminders()) || [];
      }
      renderCalendar();
      renderSelectedDayEvents();
    } catch (err) {
      console.error('[Calendar] Load events error:', err);
    }
  }

  function renderCalendar() {
    if (!monthYearLabel || !gridEl) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    gridEl.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const cell = createDayCell(new Date(year, month - 1, dayNum), true);
      gridEl.appendChild(cell);
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const isToday = (dayDate.toDateString() === today.toDateString());
      const isSelected = (dayDate.toDateString() === selectedDate.toDateString());
      const cell = createDayCell(dayDate, false, isToday, isSelected);
      gridEl.appendChild(cell);
    }

    // Next month padding days to fill 35 or 42 cells
    const currentCellsCount = firstDayIndex + totalDays;
    const totalSlots = currentCellsCount > 35 ? 42 : 35;
    const remaining = totalSlots - currentCellsCount;
    for (let n = 1; n <= remaining; n++) {
      const cell = createDayCell(new Date(year, month + 1, n), true);
      gridEl.appendChild(cell);
    }
  }

  function createDayCell(date, isOutsideMonth, isToday = false, isSelected = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell' + 
      (isOutsideMonth ? ' outside-month' : '') + 
      (isToday ? ' is-today' : '') + 
      (isSelected ? ' is-selected' : '');

    const numSpan = document.createElement('span');
    numSpan.className = 'calendar-day-number';
    numSpan.textContent = date.getDate();
    cell.appendChild(numSpan);

    // Find events matching this day
    const dayStr = date.toDateString();
    const dayCampaigns = scheduledCampaigns.filter(c => {
      const runDate = new Date(c.runAt || c.scheduledAt);
      return runDate.toDateString() === dayStr;
    });

    const dayReminders = reminders.filter(r => {
      if (!r.dueAt) return false;
      const dueDate = new Date(r.dueAt);
      return dueDate.toDateString() === dayStr;
    });

    const eventsWrap = document.createElement('div');
    eventsWrap.className = 'calendar-day-events';

    if (dayCampaigns.length > 0) {
      const chip = document.createElement('span');
      chip.className = 'cal-event-chip campaign-chip';
      chip.title = `${dayCampaigns.length} Campaign(s) scheduled`;
      chip.textContent = `📤 ${dayCampaigns.length} Camp`;
      eventsWrap.appendChild(chip);
    }

    if (dayReminders.length > 0) {
      const chip = document.createElement('span');
      chip.className = 'cal-event-chip reminder-chip';
      chip.title = `${dayReminders.length} Reminder(s) due`;
      chip.textContent = `⏰ ${dayReminders.length} Due`;
      eventsWrap.appendChild(chip);
    }

    cell.appendChild(eventsWrap);

    cell.addEventListener('click', () => {
      selectedDate = date;
      renderCalendar();
      renderSelectedDayEvents();
    });

    return cell;
  }

  function renderSelectedDayEvents() {
    if (!selectedDayTitle || !selectedDayEvents) return;

    selectedDayTitle.textContent = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    selectedDayEvents.innerHTML = '';

    const dayStr = selectedDate.toDateString();
    const dayCampaigns = scheduledCampaigns.filter(c => {
      const runDate = new Date(c.runAt || c.scheduledAt);
      return runDate.toDateString() === dayStr;
    });

    const dayReminders = reminders.filter(r => {
      if (!r.dueAt) return false;
      const dueDate = new Date(r.dueAt);
      return dueDate.toDateString() === dayStr;
    });

    if (dayCampaigns.length === 0 && dayReminders.length === 0) {
      selectedDayEvents.innerHTML = `
        <div style="font-size:12px; color:var(--text-dim); padding:16px 0; text-align:center;">
          No campaigns or reminders scheduled for this date.
        </div>
      `;
      return;
    }

    // List campaigns
    dayCampaigns.forEach(c => {
      const el = document.createElement('div');
      el.className = 'cal-selected-event-item';
      const timeStr = c.runAt ? new Date(c.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      el.innerHTML = `
        <div class="cal-event-header">
          <span class="badge-campaign">📤 Scheduled Campaign</span>
          <span class="cal-event-time">${timeStr}</span>
        </div>
        <div class="cal-event-title">${c.campaignPayload?.title || c.title || 'Bulk Broadcast'}</div>
        <div class="cal-event-meta">Targets: ${(c.campaignPayload?.recipients || []).length} contacts &bull; Status: ${c.status || 'PENDING'}</div>
      `;
      selectedDayEvents.appendChild(el);
    });

    // List reminders
    dayReminders.forEach(r => {
      const el = document.createElement('div');
      el.className = 'cal-selected-event-item';
      const timeStr = r.dueAt ? new Date(r.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      el.innerHTML = `
        <div class="cal-event-header">
          <span class="badge-reminder">⏰ Follow-up Reminder</span>
          <span class="cal-event-time">${timeStr}</span>
        </div>
        <div class="cal-event-title">${r.title || r.name || 'Contact Follow-up'}</div>
        <div class="cal-event-meta">Phone: ${r.phone || 'N/A'} &bull; ${r.note || ''}</div>
      `;
      selectedDayEvents.appendChild(el);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      currentDate = new Date();
      selectedDate = new Date();
      renderCalendar();
      renderSelectedDayEvents();
    });
  }

  if (btnQuickSchedule) {
    btnQuickSchedule.addEventListener('click', () => {
      // Switch to campaigns tab with schedule focus
      const campNav = document.querySelector('[data-tab="campaigns"]');
      if (campNav) campNav.click();
    });
  }

  // Initial load
  loadEvents();
});
