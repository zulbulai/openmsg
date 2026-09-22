import { h, icon, clear } from '../ui/dom.js';
import * as _0x4cba01 from '../ui/kit.js';
import { relTime, truncate } from '../core/util.js';
import { buttonsMode } from '../core/messages.js';
import { signMessage } from '../core/sender.js';
import { brand } from '../core/brand.js';
const ACTIVITY_LABEL = {
  workflow_reply: 'Message bot',
  chatbot_start: 'Chatbot started',
  chatbot_end: 'Chatbot ended',
  chatbot_action_failed: 'Chatbot action failed',
  assistant_reply: 'AI reply',
  assistant_error: 'AI error',
  handoff: 'Handed to a person',
  campaign_done: 'Broadcast done',
  campaign_missed: 'Broadcast missed',
  campaign_error: 'Broadcast error',
  status_posted: 'Status posted',
  canned_sent: 'Canned response',
  action_failed: 'Action failed',
};
export default {
  id: 'settings',
  title: 'Module Settings',
  subtitle:
    'Safety limits, your signature, notifications and what the automations did.',
  icon: 'settings',
  render(_0xdde59b) {
    const { app: _0x381122 } = _0xdde59b;
    const _0x3951d2 = _0x381122.store;
    const _0x4aeddb = (_0x1f900c) => (_0xaf3910) =>
      _0x3951d2.setSetting(_0x1f900c, _0xaf3910);
    const _0x2bf4b0 = h('div', {
      class: 'wc-screen wc-form wc-narrow',
    });
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'Automation safety',
        [
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x4cba01.toggle(
              !!_0x3951d2.setting('automationPaused'),
              (_0x4c3eea) => {
                _0x3951d2.setSetting('automationPaused', _0x4c3eea);
                _0x4cba01.toast(
                  _0x4c3eea
                    ? 'All automations are paused.'
                    : 'Automations are running again.',
                  'info',
                );
              },
              'Pause all automations',
            ),
            h(
              'div',
              null,
              h('strong', null, 'Pause all automations'),
              h(
                'div',
                {
                  class: 'wc-muted',
                },
                'Stops chatbots, message bots, the AI assistant, broadcasts and schedules from sending. Your own sends still work.',
              ),
            ),
          ),
          _0x4cba01.row(
            _0x4cba01.field(
              'Most automatic messages per hour',
              _0x4cba01.input({
                type: 'number',
                min: 0,
                value: _0x3951d2.setting('maxSendsPerHour'),
                onInput: (_0x51fe80) =>
                  _0x3951d2.setSetting(
                    'maxSendsPerHour',
                    Math.max(0, Number(_0x51fe80) || 0),
                  ),
              }),
              {
                hint: 'A safety net that pauses sending when reached. 0 turns the limit off.',
              },
            ),
            _0x4cba01.field(
              'Show "typing..." before replies',
              h(
                'div',
                {
                  class: 'wc-field-pad',
                },
                _0x4cba01.toggle(
                  _0x3951d2.setting('showTyping') !== false,
                  _0x4aeddb('showTyping'),
                  'Typing indicator',
                ),
              ),
            ),
          ),
          _0x4cba01.banner(
            'WhatsApp can restrict numbers that send many similar messages quickly. Keep delays natural, message people who expect to hear from you, and start small.',
            'warn',
          ),
        ],
        {
          card: true,
        },
      ),
    );
    const _0x204589 = _0x4cba01.input({
      value: _0x3951d2.setting('agentName'),
      placeholder: 'e.g. Sam',
      onInput: () => _0x4a3a83(),
    });
    const _0x4fcabe = _0x4cba01.checkbox(
      !!_0x3951d2.setting('identifyAgent'),
      () => _0x4a3a83(),
      'Put my name in bold at the start of messages I send with ' + brand(),
    );
    const _0x539d12 = _0x4cba01.checkbox(
      !!_0x3951d2.setting('signatureEnabled'),
      () => _0x4a3a83(),
      'Add a signature line to messages',
    );
    const _0xb7588c = _0x4cba01.input({
      value: _0x3951d2.setting('signatureText'),
      placeholder: 'e.g. *Acme Support*',
      onInput: () => _0x4a3a83(),
    });
    const _0x4c4dc9 = _0x4cba01.checkbox(
      _0x3951d2.setting('signTyped') !== false,
      () => _0x4a3a83(),
      'Also add them to messages I type in the WhatsApp message box',
    );
    const _0x3966e7 = _0x4cba01.input({
      value: _0x3951d2.setting('deviceName'),
      onInput: () => _0x4a3a83(),
    });
    const _0x36493e = h('span', {
      class: 'wc-prewrap',
    });
    const _0x82d5c2 = () => ({
      agentName: _0x204589.value.trim(),
      identifyAgent: _0x4fcabe.input.checked,
      signatureEnabled: _0x539d12.input.checked,
      signatureText: _0xb7588c.value.trim(),
      signTyped: _0x4c4dc9.input.checked,
      deviceName: _0x3966e7.value.trim(),
    });
    const _0x37e194 = () => {
      _0x36493e.textContent = signMessage(
        'Hi Riya, thanks for getting in touch.',
        _0x82d5c2(),
      );
    };
    const _0x4a3a83 = () => {
      _0x37e194();
      _0x3951d2.setSettings(_0x82d5c2());
    };
    _0x37e194();
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'You',
        [
          _0x4cba01.field('Your name', _0x204589),
          _0x4fcabe,
          _0x539d12,
          _0x4cba01.field('Signature', _0xb7588c),
          _0x4c4dc9,
          _0x4cba01.field('This browser is called', _0x3966e7),
          _0x4cba01.field(
            'How a message will look',
            h(
              'div',
              {
                class: 'wc-bubble-preview',
              },
              h(
                'div',
                {
                  class: 'wc-bubble',
                },
                _0x36493e,
              ),
            ),
            {
              hint:
                'Used on what ' +
                brand() +
                ' sends for you: Send Message, broadcasts, schedules, canned responses, message bots and chatbots, and on messages you type in WhatsApp when the box above is ticked. AI assistant replies are left as they are.',
            },
          ),
          h(
            'div',
            {
              class: 'wc-inline wc-between',
            },
            h(
              'span',
              {
                class: 'wc-field-hint',
              },
              'Changes are saved as you type. Save writes them to storage.',
            ),
            _0x4cba01.button('Save', {
              icon: 'check',
              variant: 'primary',
              onClick: async () => {
                await _0x3951d2.setSettings(_0x82d5c2());
                await _0x3951d2.flush();
                _0x4cba01.toast(
                  'Saved. It applies to messages sent from now on.',
                  'success',
                );
              },
            }),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'Interface',
        [
          _0x4cba01.checkbox(
            _0x3951d2.setting('strapEnabled') !== false,
            _0x4aeddb('strapEnabled'),
            'Show the shortcut bar and / shortcuts above the message box',
          ),
          _0x4cba01.checkbox(
            _0x3951d2.setting('reminderNotify') !== false,
            _0x4aeddb('reminderNotify'),
            'Show notifications for reminders and appointments',
          ),
          _0x4cba01.field(
            'Buttons in messages',
            _0x4cba01.select(
              [
                {
                  value: 'list',
                  label: 'A list the customer opens and picks from',
                },
                {
                  value: 'text',
                  label: 'A numbered text menu',
                },
                {
                  value: 'native',
                  label: 'Real WhatsApp buttons (experimental)',
                },
              ],
              buttonsMode(_0x3951d2.setting('buttonsMode')),
              _0x4aeddb('buttonsMode'),
            ),
            {
              hint: 'Applies to messages that use Message + Buttons. WhatsApp Web often cannot deliver real buttons: they show on your screen with one tick and the customer receives nothing, so test them on your own number first. Groups always get the numbered menu.',
            },
          ),
          _0x4cba01.field(
            'Kanban opens in',
            _0x4cba01.select(
              [
                {
                  value: 'tab',
                  label: 'A separate full-screen tab',
                },
                {
                  value: 'panel',
                  label: 'A panel inside WhatsApp',
                },
              ],
              _0x3951d2.setting('kanbanOpen') || 'tab',
              _0x4aeddb('kanbanOpen'),
            ),
          ),
          _0x4cba01.field(
            'Recent chats shown in the Kanban Inbox',
            _0x4cba01.input({
              type: 'number',
              min: 5,
              max: 100,
              value: _0x3951d2.setting('inboxCount'),
              onInput: (_0x18b577) =>
                _0x3951d2.setSetting(
                  'inboxCount',
                  Math.min(100, Math.max(5, Number(_0x18b577) || 30)),
                ),
            }),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    const _0x33567d = h('div', {
      class: 'wc-stack',
    });
    async function _0x20c4cd() {
      clear(_0x33567d);
      _0x33567d.appendChild(
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Checking...',
        ),
      );
      const _0x86d5fb = await _0x381122.diagnostics();
      const _0x192de4 = _0x86d5fb.whatsapp || {};
      const _0x21992f = (_0x263336, _0x53ef1d, _0x5d8b56) =>
        h(
          'div',
          {
            class: 'wc-kv-row',
          },
          h(
            'span',
            {
              class: 'wc-kv-k',
            },
            _0x263336,
          ),
          h(
            'span',
            {
              class: 'wc-kv-v',
            },
            _0x5d8b56 === undefined
              ? _0x53ef1d
              : _0x4cba01.chip(_0x53ef1d, _0x5d8b56 ? 'ok' : 'danger'),
          ),
        );
      clear(_0x33567d);
      _0x33567d.appendChild(
        h(
          'div',
          {
            class: 'wc-kv',
          },
          _0x21992f(
            'WhatsApp tools loaded',
            _0x192de4.injected ? 'Yes' : 'No',
            !!_0x192de4.injected,
          ),
          _0x21992f(
            'WhatsApp ready',
            _0x192de4.fullReady ? 'Yes' : 'Not yet',
            !!_0x192de4.fullReady,
          ),
          _0x21992f(
            'Signed in',
            _0x192de4.authenticated ? 'Yes' : 'No',
            !!_0x192de4.authenticated,
          ),
          _0x21992f(
            'Your number',
            _0x192de4.me ? '+' + String(_0x192de4.me).split('@')[0] : 'Unknown',
          ),
          _0x21992f('Business account', _0x192de4.isBusiness ? 'Yes' : 'No'),
          _0x21992f('wa-js version', String(_0x192de4.version || 'Unknown')),
          _0x21992f(
            'Name and signature on typed messages',
            !_0x86d5fb.typedSigning.on
              ? 'Off, nothing to add'
              : !_0x86d5fb.typedSigning.status
                ? 'Unknown'
                : _0x86d5fb.typedSigning.status.hooked
                  ? 'Ready, ' +
                    _0x86d5fb.typedSigning.status.signed +
                    ' added so far'
                  : 'Not available: ' +
                    (_0x86d5fb.typedSigning.status.error || 'not set up yet'),
            _0x86d5fb.typedSigning.on && _0x86d5fb.typedSigning.status
              ? _0x86d5fb.typedSigning.status.hooked
              : undefined,
          ),
          _0x21992f(
            'Shortcut bar placement',
            {
              pane: 'Below the message box',
              page: 'Below the message box (page shortened)',
              above: 'Above the message box',
            }[_0xdde59b.shell.strap.mode()] || 'Unknown',
          ),
          _0x21992f(
            'Automatic messages in the last hour',
            '' +
              _0x86d5fb.sentLastHour +
              (_0x86d5fb.hourlyCap ? ' of ' + _0x86d5fb.hourlyCap : ''),
          ),
          _0x21992f(
            'Chatbot chats running',
            String(_0x86d5fb.activeChatbotSessions),
          ),
          _0x21992f(
            'Saved',
            Object.entries(_0x86d5fb.counts)
              .map(([_0x31b16a, _0x4737df]) => _0x4737df + ' ' + _0x31b16a)
              .join(', '),
          ),
        ),
      );
      if (!_0x192de4.injected) {
        _0x33567d.appendChild(
          _0x4cba01.banner(
            'The WhatsApp connection is not loaded. Reload WhatsApp Web. If it keeps happening, WhatsApp may have changed and the bundled library needs an update.',
            'warn',
          ),
        );
      }
    }
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'Diagnostics',
        [
          _0x33567d,
          _0x4cba01.button('Check again', {
            icon: 'refresh-cw',
            size: 'sm',
            onClick: _0x20c4cd,
          }),
        ],
        {
          card: true,
        },
      ),
    );
    _0x20c4cd();
    const _0x19a869 = h('div', {
      class: 'wc-stack',
    });
    function _0x53d58e() {
      clear(_0x19a869);
      const _0x524b4d = _0x381122.activity.recent(60);
      _0x19a869.appendChild(
        _0x524b4d.length
          ? h(
              'div',
              {
                class: 'wc-card wc-card-flush wc-list',
              },
              _0x524b4d.map((_0x5472b4) =>
                h(
                  'div',
                  {
                    class: 'wc-list-row',
                  },
                  h(
                    'div',
                    {
                      class: 'wc-list-main',
                    },
                    h(
                      'strong',
                      null,
                      ACTIVITY_LABEL[_0x5472b4.type] || _0x5472b4.type,
                    ),
                    h(
                      'span',
                      null,
                      truncate(
                        (_0x5472b4.chatId
                          ? _0x381122.crm.displayName(_0x5472b4.chatId) + ': '
                          : '') + (_0x5472b4.text || ''),
                        100,
                      ),
                    ),
                  ),
                  h(
                    'span',
                    {
                      class: 'wc-list-meta',
                    },
                    relTime(_0x5472b4.at),
                  ),
                ),
              ),
            )
          : h(
              'div',
              {
                class: 'wc-muted',
              },
              'Nothing yet. Bots, broadcasts and the assistant will appear here as they work.',
            ),
      );
    }
    _0xdde59b.onDispose(_0x381122.store.on('activityLog', () => _0x53d58e()));
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'Recent activity',
        [
          _0x19a869,
          _0x4cba01.button('Clear', {
            size: 'sm',
            icon: 'trash-2',
            onClick: async () => {
              await _0x381122.activity.clear();
            },
          }),
        ],
        {
          card: true,
        },
      ),
    );
    _0x53d58e();
    _0x2bf4b0.appendChild(
      _0x4cba01.section(
        'Data',
        [
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x4cba01.button('Backup and restore', {
              icon: 'file-spreadsheet',
              onClick: () => _0xdde59b.shell.openPanel('import-export'),
            }),
            _0x4cba01.button('Erase all ' + brand() + ' data', {
              icon: 'trash-2',
              variant: 'danger',
              onClick: async () => {
                if (
                  !(await _0x4cba01.confirmDialog(
                    'This permanently deletes every contact, note, bot, chatbot, campaign, template and setting saved by ' +
                      brand() +
                      ' in this browser. This cannot be undone.',
                    {
                      danger: true,
                      confirmLabel: 'Erase everything',
                      title: 'Erase all data?',
                    },
                  ))
                ) {
                  return;
                }
                for (const _0x5405d2 of [
                  'contacts',
                  'tags',
                  'fields',
                  'notes',
                  'reminders',
                  'appointments',
                  'tabs',
                  'kanbanDashboards',
                  'kanbanStages',
                  'kanbanCards',
                  'quickReplies',
                  'templates',
                  'workflows',
                  'chatbots',
                  'chatSessions',
                  'chatMemory',
                  'schedules',
                  'campaigns',
                  'statusPosts',
                  'webhooks',
                  'webhookLog',
                  'activityLog',
                  'counters',
                ]) {
                  await _0x381122.store.clear(_0x5405d2);
                }
                await _0x381122.store.setSetting('defaultsCreated', false);
                await _0x381122.crm.ensureDefaults();
                _0x4cba01.toast('All data erased.', 'success');
              },
            }),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    return _0x2bf4b0;
  },
};
