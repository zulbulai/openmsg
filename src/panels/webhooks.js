import { h, icon, clear } from '../ui/dom.js';
import * as kit from '../ui/kit.js';
import { WEBHOOK_EVENTS } from '../core/webhooks.js';
import { fmtDateTime, clone, debounce, truncate } from '../core/util.js';

// ─── Editor (Add / Edit webhook) ────────────────────────────────────────────
// Uses openModal (centered) instead of openDrawer to avoid the full-screen
// backdrop-side overlay that caused the blinking / flickering effect.
function openEditor(app, existing) {
  const draft = existing
    ? clone(existing)
    : {
        name: '',
        url: '',
        method: 'POST',
        events: ['message_received'],
        headers: [],
        secret: '',
        enabled: true,
      };

  const errorEl = h('div', { class: 'wc-field-error' });

  // ── Custom headers list ──
  const headersWrap = h('div', { class: 'wc-stack' });

  function renderHeaders() {
    clear(headersWrap);
    draft.headers.forEach((hdr, idx) =>
      headersWrap.appendChild(
        h(
          'div',
          { class: 'wc-form-row wc-row-remove' },
          kit.input({
            value: hdr.name,
            placeholder: 'Header name',
            onInput: (v) => { hdr.name = v; },
          }),
          kit.input({
            value: hdr.value,
            placeholder: 'Value',
            onInput: (v) => { hdr.value = v; },
          }),
          kit.iconButton('trash-2', 'Remove', () => {
            draft.headers.splice(idx, 1);
            renderHeaders();
          }, 'is-danger'),
        ),
      ),
    );
    headersWrap.appendChild(
      kit.button('Add header', {
        icon: 'plus',
        size: 'sm',
        onClick: () => {
          draft.headers.push({ name: '', value: '' });
          renderHeaders();
        },
      }),
    );
  }

  // ── Permission callout ──
  const permWrap = h('div', { class: 'wc-stack' });

  async function checkPermission() {
    clear(permWrap);
    if (!/^https?:\/\//i.test(draft.url)) return;
    const hasAccess = await app.http.hasAccess(draft.url).catch(() => true);
    if (!hasAccess) {
      permWrap.appendChild(
        h(
          'div',
          { class: 'wc-callout wc-callout-warn' },
          icon('shield-check', 16),
          h('span', null,
            'Chrome needs your permission to reach ' +
            app.http.originOf(draft.url) + '.',
          ),
          kit.button('Allow', {
            size: 'sm',
            variant: 'primary',
            onClick: () => app.http.grant(app.http.originOf(draft.url)),
          }),
        ),
      );
    }
  }

  const modal = kit.openModal({
    title: existing ? 'Edit webhook' : 'Add webhook',
    width: 560,
    body: h(
      'div',
      { class: 'wc-form' },
      kit.field(
        'Name',
        kit.input({
          value: draft.name,
          placeholder: 'e.g. Send new leads to my spreadsheet',
          onInput: (v) => { draft.name = v; },
        }),
        { required: true },
      ),
      kit.field(
        'URL',
        kit.input({
          value: draft.url,
          placeholder: 'https://hooks.example.com/abc',
          onInput: debounce((v) => {
            draft.url = v;
            checkPermission();
          }, 300),
        }),
        {
          required: true,
          hint: 'Each event is sent here as a JSON POST.',
        },
      ),
      permWrap,
      kit.field(
        'Send when',
        kit.multiSelect({
          options: WEBHOOK_EVENTS.map((e) => ({ value: e.id, label: e.label })),
          value: draft.events,
          placeholder: 'Choose events',
          onChange: (v) => { draft.events = v; },
        }),
        { required: true },
      ),
      kit.field(
        'HTTP method',
        kit.select(
          ['POST', 'PUT', 'PATCH'],
          draft.method || 'POST',
          (v) => { draft.method = v; },
        ),
      ),
      kit.field(
        'Signing secret (optional)',
        kit.input({
          value: draft.secret,
          placeholder: 'Used to sign each request',
          onInput: (v) => { draft.secret = v; },
        }),
        {
          hint: 'When set, every request has an X-WACRM-Signature header (HMAC SHA-256 of the body).',
        },
      ),
      kit.field('Extra headers', headersWrap),
      kit.field(
        'Status',
        h(
          'div',
          { class: 'wc-inline' },
          kit.toggle(draft.enabled, (v) => { draft.enabled = v; }, 'On'),
          h('span', { class: 'wc-muted' }, 'When off, nothing is sent.'),
        ),
      ),
      errorEl,
    ),
    footer: h(
      'div',
      { class: 'wc-modal-actions' },
      kit.button('Cancel', { variant: 'dark', onClick: () => modal.close() }),
      kit.button('Save', {
        variant: 'primary',
        onClick: async () => {
          if (!draft.name.trim()) {
            errorEl.textContent = 'Give the webhook a name.';
            return;
          }
          if (!/^https?:\/\/\S+/i.test(draft.url.trim())) {
            errorEl.textContent = 'Enter a valid URL starting with http:// or https://.';
            return;
          }
          if (!draft.events.length) {
            errorEl.textContent = 'Choose at least one event.';
            return;
          }
          await app.store.put(
            'webhooks',
            Object.assign({}, draft, {
              name: draft.name.trim(),
              url: draft.url.trim(),
            }),
          );
          modal.close();
          kit.toast('Webhook saved', 'success');
        },
      }),
    ),
  });

  renderHeaders();
  checkPermission();
}

// ─── Delivery History modal ──────────────────────────────────────────────────
function openHistory(app, webhookId) {
  // webhookId = undefined → global (all webhooks) view
  const isGlobal = !webhookId;

  const contentWrap = h('div', { class: 'wc-stack' });

  // Global view: filter by webhook
  let filterWebhookId = webhookId || '';
  let filterEl = null;

  if (isGlobal) {
    const webhooks = app.store.all('webhooks');
    const options = [
      { value: '', label: 'All webhooks' },
      ...webhooks.map((w) => ({ value: w.id, label: w.name })),
    ];
    filterEl = kit.multiSelect({
      options,
      value: filterWebhookId,
      placeholder: 'Filter by webhook',
      single: true,
      onChange: (v) => {
        filterWebhookId = v;
        renderTable();
      },
    });
  }

  // ── Payload inline viewer ──
  function makePayloadViewer(entry) {
    if (!entry.payload) return null;
    let open = false;
    const pre = h('pre', { class: 'wc-payload-pre', hidden: true },
      JSON.stringify(entry.payload, null, 2),
    );
    const btn = kit.button('View payload', {
      size: 'sm',
      icon: 'code',
      onClick: () => {
        open = !open;
        pre.hidden = !open;
        btn.querySelector('span').textContent = open ? 'Hide payload' : 'View payload';
      },
    });
    return h('div', { class: 'wc-stack' }, btn, pre);
  }

  // ── Table renderer ──
  function renderTable() {
    clear(contentWrap);

    const entries = app.webhooks
      .logFor(filterWebhookId || undefined)
      .slice(0, 100);

    const columns = isGlobal
      ? ['Time', 'Webhook', 'Event', 'Result', 'Actions']
      : ['Time', 'Event', 'Result', 'Actions'];

    const rows = entries.map((entry) => {
      const resultChip = entry.ok
        ? kit.chip('OK ' + entry.status, 'ok')
        : kit.chip(entry.status ? 'Failed ' + entry.status : 'Failed', 'danger');

      const actionsCell = h(
        'div',
        { class: 'wc-row-actions' },
        entry.error
          ? h('span', { class: 'wc-muted wc-small', title: entry.error },
              truncate(entry.error, 30),
            )
          : null,
        entry.payload ? makePayloadViewer(entry) : null,
        kit.iconButton('refresh-cw', 'Send again', async () => {
          await app.webhooks
            .resend(entry.id)
            .catch((err) => kit.toast(err.message, 'error'));
          renderTable();
        }),
      );

      if (isGlobal) {
        return [
          fmtDateTime(entry.createdAt),
          entry.webhookName,
          entry.event,
          resultChip,
          actionsCell,
        ];
      }
      return [
        fmtDateTime(entry.createdAt),
        entry.event,
        resultChip,
        actionsCell,
      ];
    });

    contentWrap.appendChild(
      kit.table(
        columns,
        rows,
        {
          empty: kit.emptyState(
            'history',
            'Nothing has been delivered yet',
          ),
        },
      ),
    );
  }

  const bodyEl = h(
    'div',
    { class: 'wc-stack' },
    filterEl,
    contentWrap,
  );

  const modal = kit.openModal({
    title: isGlobal ? 'Delivery history (all)' : 'Delivery history',
    width: isGlobal ? 780 : 680,
    body: bodyEl,
  });

  // Auto-refresh when new log entries arrive
  const unsubscribe = app.store.on(
    'webhookLog',
    debounce(renderTable, 80),
  );
  // Clean up listener when modal closes (monkey-patch close)
  const origClose = modal.close.bind(modal);
  modal.close = () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    origClose();
  };

  renderTable();
  return modal;
}

// ─── Copy to clipboard helper ────────────────────────────────────────────────
function copyText(text) {
  try {
    navigator.clipboard.writeText(text).catch(() => {});
  } catch (_) {}
}

// ─── Webhook card renderer ───────────────────────────────────────────────────
function makeWebhookCard(app, wh, refresh) {
  // Test button with loading state
  let testing = false;
  const testBtn = kit.iconButton('play', 'Send a test', async () => {
    if (testing) return;
    testing = true;
    testBtn.disabled = true;
    testBtn.title = 'Sending…';
    try {
      const result = await app.webhooks.test(wh.id);
      kit.toast(
        result.ok
          ? 'Test delivered (' + result.status + ')'
          : 'Test failed: ' + (result.error || result.status),
        result.ok ? 'success' : 'error',
      );
    } catch (err) {
      kit.toast(err.message, 'error');
    } finally {
      testing = false;
      testBtn.disabled = false;
      testBtn.title = 'Send a test';
    }
  });

  // Last delivery status badge
  const lastDelivery = wh.lastAt
    ? h(
        'span',
        { class: 'wc-inline wc-whcard-delivery' },
        kit.chip(wh.lastOk ? 'OK' : 'Failed', wh.lastOk ? 'ok' : 'danger'),
        h('span', { class: 'wc-muted wc-small' }, fmtDateTime(wh.lastAt)),
      )
    : h('span', { class: 'wc-muted wc-small' }, 'Never delivered');

  // Events chips (max 3, then +N)
  const events = (wh.events || []);
  const visibleEvents = events.slice(0, 3);
  const moreCount = events.length - visibleEvents.length;
  const eventsEl = h(
    'div',
    { class: 'wc-tags' },
    visibleEvents.map((evId) =>
      kit.chip(
        (WEBHOOK_EVENTS.find((e) => e.id === evId) || { label: evId }).label,
        'accent',
      ),
    ),
    moreCount > 0 ? kit.chip('+' + moreCount, 'neutral') : null,
  );

  // URL row with copy button
  const urlEl = h(
    'div',
    { class: 'wc-whcard-url' },
    h('span', { class: 'wc-mono wc-whcard-urltext', title: wh.url }, wh.url),
    kit.iconButton('copy', 'Copy URL', () => {
      copyText(wh.url);
      kit.toast('URL copied', 'success');
    }),
  );

  const card = h(
    'article',
    { class: 'wc-card wc-whcard' },
    // ── Card header ──
    h(
      'div',
      { class: 'wc-whcard-head' },
      h(
        'div',
        { class: 'wc-whcard-title-row' },
        h('strong', { class: 'wc-whcard-name' }, wh.name),
        wh.enabled !== false
          ? kit.chip('Active', 'ok')
          : kit.chip('Paused', 'neutral'),
      ),
      h(
        'div',
        { class: 'wc-row-actions' },
        kit.toggle(
          wh.enabled !== false,
          (val) => app.store.patch('webhooks', wh.id, { enabled: val }),
          'Active',
        ),
        testBtn,
        kit.iconButton('history', 'Delivery history', () => openHistory(app, wh.id)),
        kit.iconButton('pencil', 'Edit', () => openEditor(app, wh)),
        kit.iconButton(
          'trash-2',
          'Delete',
          async () => {
            if (
              await kit.confirmDialog('Delete this webhook?', {
                danger: true,
                confirmLabel: 'Delete',
              })
            ) {
              app.store.remove('webhooks', wh.id);
            }
          },
          'is-danger',
        ),
      ),
    ),
    // ── URL ──
    urlEl,
    // ── Events + last delivery ──
    h(
      'div',
      { class: 'wc-whcard-foot' },
      eventsEl,
      lastDelivery,
    ),
  );

  return card;
}

// ─── Panel export ────────────────────────────────────────────────────────────
export default {
  id: 'webhooks',
  title: 'Webhook',
  subtitle:
    'Send events such as new messages, stage changes and reminders to the tools you already use.',
  icon: 'webhook',
  render(ctx) {
    const { app } = ctx;
    const listWrap = h('div', { class: 'wc-stack' });

    function refresh() {
      clear(listWrap);

      // Info banner
      listWrap.appendChild(
        kit.banner(
          'Each webhook sends a JSON request to your URL when the chosen event happens. ' +
          'Chrome asks for permission the first time you use a new website.',
          'info',
        ),
      );

      const webhooks = app.store.all('webhooks');

      if (!webhooks.length) {
        listWrap.appendChild(
          kit.emptyState(
            'webhook',
            'No webhooks yet',
            'Add one to start sending events to your tools.',
            kit.button('Add webhook', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openEditor(app),
            }),
          ),
        );
        return;
      }

      // Render a card per webhook
      for (const wh of webhooks) {
        listWrap.appendChild(makeWebhookCard(app, wh, refresh));
      }
    }

    // ── Header action buttons ──
    ctx.setActions([
      kit.button('History', {
        icon: 'history',
        onClick: () => openHistory(app),
      }),
      kit.button('Add webhook', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openEditor(app),
      }),
    ]);

    // ── Reactive: re-render on data changes ──
    ctx.onDispose(
      app.store.on('webhooks', debounce(refresh, 50)),
    );

    refresh();

    return h('div', { class: 'wc-screen' }, listWrap);
  },
};
