/**
 * Campaign History & Analytics Dashboard UI Controller
 * Shows past campaigns, stats, per-campaign logs, and Excel/CSV export
 */

window.addEventListener('DOMContentLoaded', async () => {
  const historyPane = document.getElementById('history-section');
  if (!historyPane) return;

  const historyTableBody = document.getElementById('historyTableBody');
  const scheduledTableBody = document.getElementById('scheduledTableBody');
  const btnRefreshHistory = document.getElementById('btnRefreshHistory');

  async function loadHistory() {
    // Campaign History
    const campaigns = await window.api.getCampaigns();
    renderHistoryTable(campaigns);

    // Scheduled Campaigns
    const scheduled = await window.api.getScheduledCampaigns();
    renderScheduledTable(scheduled);
  }

  function renderHistoryTable(campaigns) {
    historyTableBody.innerHTML = '';

    if (!campaigns || campaigns.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No campaign history yet. Run your first bulk campaign!</td></tr>`;
      return;
    }

    campaigns.forEach(camp => {
      const successRate = camp.total > 0 ? Math.round((camp.sent / camp.total) * 100) : 0;
      const statusClass = camp.status === 'COMPLETED' ? 'status-badge-success' : camp.status === 'RUNNING' ? 'status-badge-running' : 'status-badge-default';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${camp.title}">${camp.title || 'Unnamed'}</td>
        <td style="font-size:11px; color:var(--text-dim);">${camp.createdAt ? new Date(camp.createdAt).toLocaleString() : '—'}</td>
        <td style="font-family:var(--font-mono);">${camp.total || 0}</td>
        <td style="color: var(--accent-success); font-weight:700; font-family:var(--font-mono);">${camp.sent || 0}</td>
        <td style="color: var(--accent-danger); font-weight:700; font-family:var(--font-mono);">${camp.failed || 0}</td>
        <td>
          <div class="mini-progress-bar">
            <div class="mini-progress-fill" style="width:${successRate}%;"></div>
          </div>
          <span style="font-size:10px; color:var(--text-dim);">${successRate}%</span>
        </td>
        <td>
          <div class="flex-gap">
            <button class="btn btn-outline btn-xs btn-export-report" data-id="${camp.id}" title="Export campaign report to Excel">📊 Export</button>
            <button class="btn btn-outline btn-xs btn-delete-hist" data-id="${camp.id}" style="color:#f87171;" title="Delete history entry">Delete</button>
          </div>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Export report
    historyTableBody.querySelectorAll('.btn-export-report').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const buffer = await window.api.exportCampaignReport(id);
        if (!buffer) { window.showToast('No report data available', 'error'); return; }
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign_report_${id}_${Date.now()}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.showToast('Campaign report exported!', 'success');
      });
    });

    // Delete history
    historyTableBody.querySelectorAll('.btn-delete-hist').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this campaign history entry?')) return;
        await window.api.deleteCampaignHistory(btn.getAttribute('data-id'));
        await loadHistory();
        window.showToast('History entry deleted', 'info');
      });
    });
  }

  function renderScheduledTable(schedules) {
    if (!scheduledTableBody) return;
    scheduledTableBody.innerHTML = '';

    const pending = schedules.filter(s => s.status === 'pending');
    if (pending.length === 0) {
      scheduledTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No scheduled campaigns. Create a campaign and set a future schedule date/time.</td></tr>`;
      return;
    }

    pending.forEach(s => {
      const runAt = new Date(s.runAt);
      const fromNow = Math.round((s.runAt - Date.now()) / 60000);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;">${s.campaignPayload?.title || 'Scheduled Campaign'}</td>
        <td>${s.campaignPayload?.contacts?.length || 0} recipients</td>
        <td style="color:#fbbf24; font-weight:600;">${runAt.toLocaleString()}</td>
        <td style="font-size:11px; color:var(--text-muted);">
          ${fromNow > 0 ? `In ${fromNow} min` : 'Running soon'}
        </td>
        <td>
          <button class="btn btn-danger btn-xs btn-cancel-sched" data-id="${s.id}">Cancel</button>
        </td>
      `;
      scheduledTableBody.appendChild(tr);
    });

    scheduledTableBody.querySelectorAll('.btn-cancel-sched').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Cancel this scheduled campaign?')) return;
        await window.api.cancelSchedule(btn.getAttribute('data-id'));
        await loadHistory();
        window.showToast('Scheduled campaign cancelled', 'info');
      });
    });
  }

  if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', loadHistory);
  }

  // Refresh history every time Campaigns tab is activated
  document.querySelectorAll('[data-tab="campaigns"]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(loadHistory, 200));
  });

  await loadHistory();
});
