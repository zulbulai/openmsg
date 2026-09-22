import { h, icon, clear } from '../ui/dom.js';
import * as _0x3aecd5 from '../ui/kit.js';
import { WEBHOOK_EVENTS } from '../core/webhooks.js';
import { fmtDateTime, clone, debounce, truncate } from '../core/util.js';
function openEditor(_0xd50b69, _0x1e5ce8) {
  const _0x4d836d = _0x1e5ce8
    ? clone(_0x1e5ce8)
    : {
        name: '',
        url: '',
        method: 'POST',
        events: ['message_received'],
        headers: [],
        secret: '',
        enabled: true,
      };
  const _0x34786a = h('div', {
    class: 'wc-field-error',
  });
  const _0x2c5d3a = h('div', {
    class: 'wc-stack',
  });
  function _0x122e4c() {
    clear(_0x2c5d3a);
    _0x4d836d.headers.forEach((_0x3948e7, _0x5b262b) =>
      _0x2c5d3a.appendChild(
        h(
          'div',
          {
            class: 'wc-form-row wc-row-remove',
          },
          _0x3aecd5.input({
            value: _0x3948e7.name,
            placeholder: 'Header name',
            onInput: (_0x5978e5) => {
              _0x3948e7.name = _0x5978e5;
            },
          }),
          _0x3aecd5.input({
            value: _0x3948e7.value,
            placeholder: 'Value',
            onInput: (_0x21faf5) => {
              _0x3948e7.value = _0x21faf5;
            },
          }),
          _0x3aecd5.iconButton(
            'trash-2',
            'Remove',
            () => {
              _0x4d836d.headers.splice(_0x5b262b, 1);
              _0x122e4c();
            },
            'is-danger',
          ),
        ),
      ),
    );
    _0x2c5d3a.appendChild(
      _0x3aecd5.button('Add header', {
        icon: 'plus',
        size: 'sm',
        onClick: () => {
          _0x4d836d.headers.push({
            name: '',
            value: '',
          });
          _0x122e4c();
        },
      }),
    );
  }
  const _0x3f2e91 = h('div', {
    class: 'wc-stack',
  });
  async function _0x27a0cb() {
    clear(_0x3f2e91);
    if (!/^https?:\/\//i.test(_0x4d836d.url)) {
      return;
    }
    const _0x1ba1a8 = await _0xd50b69.http
      .hasAccess(_0x4d836d.url)
      .catch(() => true);
    if (!_0x1ba1a8) {
      _0x3f2e91.appendChild(
        h(
          'div',
          {
            class: 'wc-callout wc-callout-warn',
          },
          icon('shield-check', 16),
          h(
            'span',
            null,
            'Chrome needs your permission to reach ' +
              _0xd50b69.http.originOf(_0x4d836d.url) +
              '.',
          ),
          _0x3aecd5.button('Allow', {
            size: 'sm',
            variant: 'primary',
            onClick: () =>
              _0xd50b69.http.grant(_0xd50b69.http.originOf(_0x4d836d.url)),
          }),
        ),
      );
    }
  }
  const _0x8b983e = _0x3aecd5.openDrawer({
    title: _0x1e5ce8 ? 'Edit webhook' : 'Add webhook',
    width: 560,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x3aecd5.field(
        'Name',
        _0x3aecd5.input({
          value: _0x4d836d.name,
          placeholder: 'e.g. Send new leads to my spreadsheet',
          onInput: (_0x512e7f) => {
            _0x4d836d.name = _0x512e7f;
          },
        }),
        {
          required: true,
        },
      ),
      _0x3aecd5.field(
        'URL',
        _0x3aecd5.input({
          value: _0x4d836d.url,
          placeholder: 'https://hooks.example.com/abc',
          onInput: debounce((_0x2868d1) => {
            _0x4d836d.url = _0x2868d1;
            _0x27a0cb();
          }, 300),
        }),
        {
          required: true,
          hint: 'Each event is sent here as a JSON POST.',
        },
      ),
      _0x3f2e91,
      _0x3aecd5.field(
        'Send when',
        _0x3aecd5.multiSelect({
          options: WEBHOOK_EVENTS.map((_0x2992d6) => ({
            value: _0x2992d6.id,
            label: _0x2992d6.label,
          })),
          value: _0x4d836d.events,
          placeholder: 'Choose events',
          onChange: (_0x40bbd3) => {
            _0x4d836d.events = _0x40bbd3;
          },
        }),
        {
          required: true,
        },
      ),
      _0x3aecd5.field(
        'Signing secret (optional)',
        _0x3aecd5.input({
          value: _0x4d836d.secret,
          placeholder: 'Used to sign each request',
          onInput: (_0x107421) => {
            _0x4d836d.secret = _0x107421;
          },
        }),
        {
          hint: 'When set, every request has an X-WACRM-Signature header (HMAC SHA-256 of the body).',
        },
      ),
      _0x3aecd5.field('Extra headers', _0x2c5d3a),
      _0x3aecd5.field(
        'Status',
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x3aecd5.toggle(
            _0x4d836d.enabled,
            (_0x319ae0) => {
              _0x4d836d.enabled = _0x319ae0;
            },
            'On',
          ),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'When off, nothing is sent.',
          ),
        ),
      ),
      _0x34786a,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x3aecd5.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x8b983e.close(),
      }),
      _0x3aecd5.button('Save', {
        variant: 'primary',
        onClick: async () => {
          if (!_0x4d836d.name.trim()) {
            _0x34786a.textContent = 'Give the webhook a name.';
            return;
          }
          if (!/^https?:\/\/\S+/i.test(_0x4d836d.url.trim())) {
            _0x34786a.textContent =
              'Enter a valid URL starting with http:// or https://.';
            return;
          }
          if (!_0x4d836d.events.length) {
            _0x34786a.textContent = 'Choose at least one event.';
            return;
          }
          await _0xd50b69.store.put(
            'webhooks',
            Object.assign({}, _0x4d836d, {
              name: _0x4d836d.name.trim(),
              url: _0x4d836d.url.trim(),
            }),
          );
          _0x8b983e.close();
          _0x3aecd5.toast('Webhook saved', 'success');
        },
      }),
    ),
  });
  _0x122e4c();
  _0x27a0cb();
}
function openHistory(_0x142c9b, _0x43c836) {
  const _0x2cc235 = h('div', {
    class: 'wc-stack',
  });
  function _0x19227d() {
    clear(_0x2cc235);
    const _0x2c3ced = _0x142c9b.webhooks.logFor(_0x43c836).slice(0, 100);
    _0x2cc235.appendChild(
      _0x3aecd5.table(
        ['Time', 'Webhook', 'Event', 'Result', ''],
        _0x2c3ced.map((_0x3eaf37) => [
          fmtDateTime(_0x3eaf37.createdAt),
          _0x3eaf37.webhookName,
          _0x3eaf37.event,
          _0x3eaf37.ok
            ? _0x3aecd5.chip('OK ' + _0x3eaf37.status, 'ok')
            : _0x3aecd5.chip(
                _0x3eaf37.status ? 'Failed ' + _0x3eaf37.status : 'Failed',
                'danger',
              ),
          h(
            'div',
            {
              class: 'wc-row-actions',
            },
            _0x3eaf37.error
              ? h(
                  'span',
                  {
                    class: 'wc-muted wc-small',
                    title: _0x3eaf37.error,
                  },
                  truncate(_0x3eaf37.error, 30),
                )
              : null,
            _0x3aecd5.iconButton('refresh-cw', 'Send again', async () => {
              await _0x142c9b.webhooks
                .resend(_0x3eaf37.id)
                .catch((_0x1ed9ac) =>
                  _0x3aecd5.toast(_0x1ed9ac.message, 'error'),
                );
              _0x19227d();
            }),
          ),
        ]),
        {
          empty: _0x3aecd5.emptyState(
            'history',
            'Nothing has been delivered yet',
          ),
        },
      ),
    );
  }
  const _0x1c9e11 = _0x3aecd5.openModal({
    title: 'Delivery history',
    width: 720,
    body: _0x2cc235,
  });
  _0x19227d();
  return _0x1c9e11;
}
export default {
  id: 'webhooks',
  title: 'Webhook',
  subtitle:
    'Send events such as new messages, stage changes and reminders to the tools you already use.',
  icon: 'webhook',
  render(_0x79fe28) {
    const { app: _0x8a806e } = _0x79fe28;
    const _0x44ccc5 = h('div', {
      class: 'wc-stack',
    });
    function _0x13cd09() {
      clear(_0x44ccc5);
      const _0x4fdcf1 = _0x8a806e.store.all('webhooks');
      _0x44ccc5.appendChild(
        _0x3aecd5.banner(
          'Each webhook sends a JSON request to your URL when the chosen event happens. Chrome asks for permission the first time you use a new website.',
          'info',
        ),
      );
      _0x44ccc5.appendChild(
        _0x3aecd5.table(
          ['Name', 'Events', 'URL', 'Last delivery', 'Active', ''],
          _0x4fdcf1.map((_0x34b572) => [
            h('strong', null, _0x34b572.name),
            h(
              'div',
              {
                class: 'wc-tags',
              },
              (_0x34b572.events || []).slice(0, 2).map((_0x59efd5) =>
                _0x3aecd5.chip(
                  (
                    WEBHOOK_EVENTS.find(
                      (_0x462b32) => _0x462b32.id === _0x59efd5,
                    ) || {
                      label: _0x59efd5,
                    }
                  ).label,
                  'accent',
                ),
              ),
              (_0x34b572.events || []).length > 2
                ? _0x3aecd5.chip('+' + (_0x34b572.events.length - 2), 'neutral')
                : null,
            ),
            h(
              'span',
              {
                class: 'wc-mono wc-cell-clip',
              },
              _0x34b572.url,
            ),
            _0x34b572.lastAt
              ? h(
                  'span',
                  {
                    class: 'wc-inline',
                  },
                  _0x3aecd5.chip(
                    _0x34b572.lastOk ? 'OK' : 'Failed',
                    _0x34b572.lastOk ? 'ok' : 'danger',
                  ),
                  h(
                    'span',
                    {
                      class: 'wc-muted',
                    },
                    fmtDateTime(_0x34b572.lastAt),
                  ),
                )
              : h(
                  'span',
                  {
                    class: 'wc-muted',
                  },
                  'Never',
                ),
            _0x3aecd5.toggle(
              _0x34b572.enabled !== false,
              (_0x4b6b88) =>
                _0x8a806e.store.patch('webhooks', _0x34b572.id, {
                  enabled: _0x4b6b88,
                }),
              'Active',
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x3aecd5.iconButton('play', 'Send a test', async () => {
                try {
                  const _0x3a38d6 = await _0x8a806e.webhooks.test(_0x34b572.id);
                  _0x3aecd5.toast(
                    _0x3a38d6.ok
                      ? 'Test delivered (' + _0x3a38d6.status + ')'
                      : 'Test failed: ' + (_0x3a38d6.error || _0x3a38d6.status),
                    _0x3a38d6.ok ? 'success' : 'error',
                  );
                } catch (_0x3bc5e9) {
                  _0x3aecd5.toast(_0x3bc5e9.message, 'error');
                }
              }),
              _0x3aecd5.iconButton('history', 'Delivery history', () =>
                openHistory(_0x8a806e, _0x34b572.id),
              ),
              _0x3aecd5.iconButton('pencil', 'Edit', () =>
                openEditor(_0x8a806e, _0x34b572),
              ),
              _0x3aecd5.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x3aecd5.confirmDialog('Delete this webhook?', {
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    _0x8a806e.store.remove('webhooks', _0x34b572.id);
                  }
                },
                'is-danger',
              ),
            ),
          ]),
          {
            empty: _0x3aecd5.emptyState(
              'webhook',
              'No webhooks yet',
              'Add one to start sending events.',
              _0x3aecd5.button('Add webhook', {
                icon: 'plus',
                variant: 'primary',
                onClick: () => openEditor(_0x8a806e),
              }),
            ),
          },
        ),
      );
    }
    _0x79fe28.setActions([
      _0x3aecd5.button('History', {
        icon: 'history',
        onClick: () => openHistory(_0x8a806e),
      }),
      _0x3aecd5.button('Add webhook', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openEditor(_0x8a806e),
      }),
    ]);
    _0x79fe28.onDispose(
      _0x8a806e.store.on('webhooks', debounce(_0x13cd09, 50)),
    );
    _0x13cd09();
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      _0x44ccc5,
    );
  },
};
