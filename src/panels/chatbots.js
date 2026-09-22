import { h, icon, clear } from '../ui/dom.js';
import * as _0x4bce10 from '../ui/kit.js';
import { MATCH_TYPES } from '../core/matcher.js';
import { newFlow } from '../core/chatbot.js';
import { CHATBOT_TEMPLATES, INDUSTRIES } from '../core/chatbot-templates.js';
import { renderBuilder } from './chatbot-builder.js';
import { clone } from '../core/util.js';
function triggerText(_0x41bcdd) {
  const _0x35a5ca = _0x41bcdd.trigger || {};
  if (_0x35a5ca.type === 'any_message') {
    return 'Starts on every new chat';
  }
  if (_0x35a5ca.type === 'manual') {
    return 'Started manually from a chat';
  }
  if (_0x35a5ca.keywords && _0x35a5ca.keywords.length) {
    return 'Triggers on: ' + _0x35a5ca.keywords.join(', ');
  } else {
    return 'No keywords yet';
  }
}
function keywordClash(_0x261967, _0x5b3fe7, _0x1db1be) {
  const _0x2d334f = _0x5b3fe7.map((_0x4441a6) => _0x4441a6.toLowerCase());
  for (const _0x595820 of _0x261967.store.all('chatbots')) {
    if (
      _0x595820.id === _0x1db1be ||
      !_0x595820.trigger ||
      _0x595820.trigger.type !== 'keyword'
    ) {
      continue;
    }
    const _0xb597c1 = (_0x595820.trigger.keywords || []).find((_0x4bef6d) =>
      _0x2d334f.includes(_0x4bef6d.toLowerCase()),
    );
    if (_0xb597c1) {
      return _0xb597c1;
    }
  }
  return '';
}
export function openFlowWizard(
  _0x73b93b,
  {
    flow: _0x1c2a5c,
    graph: _0x3e55c5,
    name: _0x1bf80f,
    trigger: _0x577b14,
    onCreated: _0x597cd0,
  },
) {
  const _0x258f07 = !!_0x1c2a5c && !!_0x1c2a5c.id;
  const _0x2d3b06 = (_0x1c2a5c && _0x1c2a5c.trigger) || _0x577b14 || {};
  const _0x49bb73 = {
    name: _0x1bf80f || (_0x1c2a5c && _0x1c2a5c.name) || '',
    type: _0x2d3b06.type || 'keyword',
    keywords: (_0x2d3b06.keywords || []).slice(),
    match: _0x2d3b06.match || 'contains',
    caseSensitive: !!_0x2d3b06.caseSensitive,
    enabled: _0x1c2a5c ? _0x1c2a5c.enabled : true,
  };
  const _0x5174f2 = _0x4bce10.input({
    value: _0x49bb73.name,
    placeholder: 'e.g. Appointment booking',
    maxLength: 60,
    onInput: (_0x1af0cc) => {
      _0x49bb73.name = _0x1af0cc;
    },
  });
  const _0x359755 = _0x4bce10.field('Chatbot name', _0x5174f2, {
    required: true,
  });
  const _0x2f3d66 = h('div', {
    class: 'wc-stack',
  });
  const _0x27e597 = _0x4bce10.field(
    'Keywords',
    _0x4bce10.tagInput({
      value: _0x49bb73.keywords,
      placeholder: 'Type a keyword and press Enter',
      onChange: (_0x393e1c) => {
        _0x49bb73.keywords = _0x393e1c;
      },
    }),
  );
  function _0x5b60ac() {
    clear(_0x2f3d66);
    if (_0x49bb73.type !== 'keyword') {
      return;
    }
    _0x2f3d66.appendChild(_0x27e597);
    _0x2f3d66.appendChild(
      _0x4bce10.row(
        _0x4bce10.field(
          'Match',
          _0x4bce10.select(
            MATCH_TYPES.map((_0x21c212) => ({
              value: _0x21c212.id,
              label: _0x21c212.label,
            })),
            _0x49bb73.match,
            (_0x1f94b3) => {
              _0x49bb73.match = _0x1f94b3;
            },
          ),
        ),
        _0x4bce10.field(
          'Case',
          h(
            'div',
            {
              class: 'wc-field-pad',
            },
            _0x4bce10.checkbox(
              _0x49bb73.caseSensitive,
              (_0x149464) => {
                _0x49bb73.caseSensitive = _0x149464;
              },
              'Case sensitive',
            ),
          ),
        ),
      ),
    );
  }
  const _0x32197b = _0x4bce10.radioCards(
    'trigger',
    [
      {
        value: 'keyword',
        label: 'Someone sends a keyword',
        hint: 'Only messages with one of your words.',
      },
      {
        value: 'any_message',
        label: 'Every new chat',
        hint: 'The first message from someone new.',
      },
      {
        value: 'manual',
        label: 'I start it myself',
        hint: 'You start it from the chat tools of a conversation.',
      },
    ],
    _0x49bb73.type,
    (_0x5c35da) => {
      _0x49bb73.type = _0x5c35da;
      _0x5b60ac();
    },
  );
  const _0x2f182b = h('div', {
    class: 'wc-field-error',
  });
  const _0x5117d7 = _0x4bce10.openModal({
    title: _0x258f07 ? 'Chatbot settings' : 'New chatbot',
    subtitle: 'Give it a name and say what makes it start.',
    width: 520,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x359755,
      h(
        'div',
        {
          class: 'wc-field',
        },
        h(
          'span',
          {
            class: 'wc-field-label',
          },
          'What starts it',
        ),
        _0x32197b,
      ),
      _0x2f3d66,
      _0x4bce10.field(
        'Active',
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x4bce10.toggle(
            _0x49bb73.enabled,
            (_0x361780) => {
              _0x49bb73.enabled = _0x361780;
            },
            'Active',
          ),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'Starts replying as soon as it is published. Turn off to keep it as a draft.',
          ),
        ),
      ),
      _0x2f182b,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x4bce10.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x5117d7.close(),
      }),
      _0x4bce10.button(_0x258f07 ? 'Save' : 'Create chatbot', {
        variant: 'primary',
        onClick: async () => {
          _0x359755.setError('');
          if (!_0x49bb73.name.trim()) {
            _0x359755.setError('Give the chatbot a name.');
            return;
          }
          if (_0x49bb73.type === 'keyword') {
            if (!_0x49bb73.keywords.length) {
              _0x2f182b.textContent = 'Add at least one keyword.';
              return;
            }
            const _0x478d87 = keywordClash(
              _0x73b93b,
              _0x49bb73.keywords,
              _0x1c2a5c && _0x1c2a5c.id,
            );
            if (_0x478d87) {
              _0x2f182b.textContent =
                '"' +
                _0x478d87 +
                '" is already used by another chatbot. Pick a different word.';
              return;
            }
          }
          const _0x35c2c8 = _0x1c2a5c
            ? clone(_0x1c2a5c)
            : newFlow(_0x49bb73.name);
          const _0x5444c7 = Object.assign(_0x35c2c8, {
            name: _0x49bb73.name.trim(),
            enabled: _0x49bb73.enabled,
            trigger: {
              type: _0x49bb73.type,
              keywords: _0x49bb73.type === 'keyword' ? _0x49bb73.keywords : [],
              match: _0x49bb73.match,
              caseSensitive: _0x49bb73.caseSensitive,
            },
          });
          if (_0x3e55c5 && !_0x258f07) {
            _0x5444c7.draft = clone(_0x3e55c5);
          }
          const _0x179e69 = await _0x73b93b.store.put('chatbots', _0x5444c7);
          _0x5117d7.close();
          if (_0x597cd0) {
            _0x597cd0(_0x179e69);
          }
        },
      }),
    ),
  });
  _0x5b60ac();
  _0x5174f2.focus();
  return _0x5117d7;
}
export function openTemplateLibrary(_0x43e6d4, _0x216d1c) {
  let _0x126368 = 'all';
  let _0xc2955 = '';
  const _0x4e76cc = h('div', {
    class: 'wc-grid wc-grid-2',
  });
  function _0x592d83() {
    clear(_0x4e76cc);
    const _0x146715 = CHATBOT_TEMPLATES.filter(
      (_0x13766d) =>
        (_0x126368 === 'all' || _0x13766d.industry === _0x126368) &&
        (!_0xc2955 ||
          (_0x13766d.title + ' ' + _0x13766d.subtitle)
            .toLowerCase()
            .includes(_0xc2955.toLowerCase())),
    );
    if (!_0x146715.length) {
      _0x4e76cc.appendChild(
        h(
          'div',
          {
            class: 'wc-muted wc-pad',
          },
          'No template matches "' + _0xc2955 + '".',
        ),
      );
    }
    _0x146715.forEach((_0x51f698) =>
      _0x4e76cc.appendChild(
        h(
          'article',
          {
            class: 'wc-card wc-template',
          },
          h(
            'div',
            {
              class: 'wc-card-head',
            },
            h(
              'div',
              null,
              h(
                'h3',
                {
                  class: 'wc-card-title',
                },
                _0x51f698.title,
              ),
              h(
                'p',
                {
                  class: 'wc-card-sub',
                },
                _0x51f698.subtitle,
              ),
            ),
            _0x4bce10.chip(
              INDUSTRIES.find(
                (_0x1bc6f0) => _0x1bc6f0.id === _0x51f698.industry,
              ).label,
              'neutral',
            ),
          ),
          h(
            'div',
            {
              class: 'wc-card-foot',
            },
            _0x4bce10.button('Use this template', {
              icon: 'sparkles',
              size: 'sm',
              variant: 'primary',
              onClick: () => {
                _0x2b4188.close();
                _0x216d1c(_0x51f698);
              },
            }),
          ),
        ),
      ),
    );
  }
  const _0x2b4188 = _0x4bce10.openModal({
    title: 'Template library',
    subtitle:
      'Ready-made chatbots by industry. Start from one and make it yours.',
    width: 760,
    body: h(
      'div',
      {
        class: 'wc-stack',
      },
      h(
        'div',
        {
          class: 'wc-toolbar',
        },
        _0x4bce10.searchInput('Search templates...', (_0xc27d9) => {
          _0xc2955 = _0xc27d9.trim();
          _0x592d83();
        }),
        _0x4bce10.select(
          INDUSTRIES.map((_0x6de736) => ({
            value: _0x6de736.id,
            label: _0x6de736.label,
          })),
          _0x126368,
          (_0x15666f) => {
            _0x126368 = _0x15666f;
            _0x592d83();
          },
        ),
      ),
      _0x4e76cc,
    ),
  });
  _0x592d83();
  return _0x2b4188;
}
export default {
  id: 'chatbots',
  title: 'Chatbot Flows',
  subtitle: 'Guide customers through a conversation without lifting a finger.',
  icon: 'workflow',
  render(_0x355c93) {
    const { app: _0x14c61f, shell: _0x174474 } = _0x355c93;
    const _0x5941d6 = h('div', {
      class: 'wc-screen wc-chatbots',
    });
    const _0x535a78 = {
      query: '',
    };
    function _0x2e555c(_0x21dcd3) {
      _0x355c93.builderOpen = true;
      _0x174474.setBleed(true);
      clear(_0x5941d6);
      _0x5941d6.classList.add('is-builder');
      _0x5941d6.appendChild(
        renderBuilder(_0x355c93, _0x21dcd3, {
          onBack: _0x3c289d,
        }),
      );
    }
    function _0x3c289d() {
      _0x355c93.builderOpen = false;
      _0x174474.setBleed(false);
      _0x5941d6.classList.remove('is-builder');
      _0x355c93.setSubtitle(
        'Guide customers through a conversation without lifting a finger.',
      );
      _0x355c93.setActions([
        _0x4bce10.button('Templates', {
          icon: 'layout-template',
          onClick: _0x304975,
        }),
        _0x4bce10.button('New Chatbot', {
          icon: 'plus',
          variant: 'primary',
          onClick: () =>
            openFlowWizard(_0x14c61f, {
              onCreated: (_0x7fdd64) => _0x2e555c(_0x7fdd64.id),
            }),
        }),
      ]);
      _0x129253();
    }
    function _0x304975() {
      openTemplateLibrary(_0x14c61f, (_0x4f6baa) =>
        openFlowWizard(_0x14c61f, {
          name: _0x4f6baa.title,
          graph: _0x4f6baa.graph(),
          trigger: _0x4f6baa.trigger,
          onCreated: (_0x5c539f) => _0x2e555c(_0x5c539f.id),
        }),
      );
    }
    function _0x250d72(_0x2e595b) {
      const _0x3e109c = _0x14c61f.chatbots
        .activeSessions()
        .filter((_0x2a9a88) => _0x2a9a88.flowId === _0x2e595b.id).length;
      const _0x2053bc =
        _0x2e595b.published &&
        JSON.stringify(_0x2e595b.published) !== JSON.stringify(_0x2e595b.draft);
      return h(
        'article',
        {
          class: 'wc-card wc-flowcard',
        },
        h(
          'div',
          {
            class: 'wc-card-head',
          },
          h(
            'div',
            null,
            h(
              'h3',
              {
                class: 'wc-card-title',
              },
              _0x2e595b.name,
            ),
            h(
              'p',
              {
                class: 'wc-card-sub',
              },
              triggerText(_0x2e595b),
            ),
          ),
          _0x4bce10.toggle(
            !!_0x2e595b.enabled,
            async (_0xb647c3) => {
              if (_0xb647c3 && !_0x2e595b.published) {
                _0x4bce10.toast(
                  'Publish the chatbot in the builder first.',
                  'info',
                );
                _0x129253();
                return;
              }
              await _0x14c61f.store.patch('chatbots', _0x2e595b.id, {
                enabled: _0xb647c3,
              });
            },
            'Active',
          ),
        ),
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x2e595b.published
            ? _0x4bce10.chip(
                _0x2053bc ? 'Unpublished changes' : 'Published',
                _0x2053bc ? 'warn' : 'ok',
              )
            : _0x4bce10.chip('Draft', 'neutral'),
          _0x3e109c ? _0x4bce10.chip(_0x3e109c + ' running', 'accent') : null,
        ),
        h(
          'div',
          {
            class: 'wc-stats',
          },
          h(
            'div',
            null,
            h('strong', null, String((_0x2e595b.draft.nodes || []).length)),
            h('span', null, 'blocks'),
          ),
          h(
            'div',
            null,
            h('strong', null, String(_0x2e595b.runs || 0)),
            h('span', null, 'runs'),
          ),
        ),
        h(
          'div',
          {
            class: 'wc-card-foot',
          },
          _0x4bce10.button('Edit', {
            icon: 'pencil',
            size: 'sm',
            onClick: () => _0x2e555c(_0x2e595b.id),
          }),
          h(
            'div',
            {
              class: 'wc-row-actions',
            },
            _0x4bce10.iconButton('settings-2', 'Chatbot settings', () =>
              openFlowWizard(_0x14c61f, {
                flow: _0x2e595b,
              }),
            ),
            _0x3e109c
              ? _0x4bce10.iconButton(
                  'circle-stop',
                  'Stop running chats',
                  async () => {
                    for (const _0x3779d5 of _0x14c61f.chatbots
                      .activeSessions()
                      .filter(
                        (_0x399e72) => _0x399e72.flowId === _0x2e595b.id,
                      )) {
                      await _0x14c61f.chatbots.stop(_0x3779d5.chatId);
                    }
                    _0x4bce10.toast('Stopped', 'success');
                    _0x129253();
                  },
                )
              : null,
            _0x4bce10.iconButton('copy', 'Clone', async () => {
              const _0x5f333b = clone(_0x2e595b);
              delete _0x5f333b.id;
              delete _0x5f333b.createdAt;
              _0x5f333b.name += ' (copy)';
              _0x5f333b.enabled = false;
              _0x5f333b.published = null;
              _0x5f333b.runs = 0;
              _0x5f333b.trigger.keywords = [];
              await _0x14c61f.store.put('chatbots', _0x5f333b);
              _0x4bce10.toast(
                'Cloned. Add keywords in its settings.',
                'success',
              );
            }),
            _0x4bce10.iconButton(
              'trash-2',
              'Delete',
              async () => {
                if (
                  await _0x4bce10.confirmDialog(
                    'Delete "' + _0x2e595b.name + '"? This cannot be undone.',
                    {
                      danger: true,
                      confirmLabel: 'Delete',
                    },
                  )
                ) {
                  for (const _0x36f49 of _0x14c61f.chatbots
                    .activeSessions()
                    .filter((_0x52a0a3) => _0x52a0a3.flowId === _0x2e595b.id)) {
                    await _0x14c61f.chatbots.stop(_0x36f49.chatId);
                  }
                  await _0x14c61f.store.remove('chatbots', _0x2e595b.id);
                }
              },
              'is-danger',
            ),
          ),
        ),
      );
    }
    function _0x129253() {
      clear(_0x5941d6);
      const _0x1364f5 = _0x14c61f.store
        .all('chatbots')
        .filter(
          (_0x35b1df) =>
            !_0x535a78.query ||
            _0x35b1df.name
              .toLowerCase()
              .includes(_0x535a78.query.toLowerCase()),
        );
      _0x5941d6.appendChild(
        h(
          'div',
          {
            class: 'wc-toolbar',
          },
          _0x4bce10.searchInput('Search chatbots', (_0x4a0074) => {
            _0x535a78.query = _0x4a0074.trim();
            _0x129253();
          }),
        ),
      );
      if (!_0x14c61f.store.count('chatbots')) {
        _0x5941d6.appendChild(
          _0x4bce10.emptyState(
            'workflow',
            'No flows yet',
            'Create one to get started, or begin from a template.',
            h(
              'div',
              {
                class: 'wc-inline',
              },
              _0x4bce10.button('New Chatbot', {
                icon: 'plus',
                variant: 'primary',
                onClick: () =>
                  openFlowWizard(_0x14c61f, {
                    onCreated: (_0x4474e6) => _0x2e555c(_0x4474e6.id),
                  }),
              }),
              _0x4bce10.button('Browse templates', {
                icon: 'layout-template',
                onClick: _0x304975,
              }),
            ),
          ),
        );
        return;
      }
      _0x5941d6.appendChild(
        h(
          'div',
          {
            class: 'wc-grid wc-grid-3',
          },
          _0x1364f5.map(_0x250d72),
          h(
            'button',
            {
              class: 'wc-card wc-newcard',
              type: 'button',
              onClick: () =>
                openFlowWizard(_0x14c61f, {
                  onCreated: (_0x5a3029) => _0x2e555c(_0x5a3029.id),
                }),
            },
            h(
              'span',
              {
                class: 'wc-newcard-icon',
              },
              icon('plus', 22),
            ),
            h('strong', null, 'Create a chatbot'),
            h('span', null, 'Start blank or from a template'),
          ),
        ),
      );
    }
    _0x355c93.onDispose(
      _0x14c61f.store.on('chatbots', () => {
        if (!_0x355c93.builderOpen) {
          _0x129253();
        }
      }),
    );
    _0x355c93.onDispose(
      _0x14c61f.bus.on('chatbot:start', () => {
        if (!_0x355c93.builderOpen) {
          _0x129253();
        }
      }),
    );
    _0x355c93.onDispose(
      _0x14c61f.bus.on('chatbot:end', () => {
        if (!_0x355c93.builderOpen) {
          _0x129253();
        }
      }),
    );
    if (_0x355c93.params.flowId) {
      _0x2e555c(_0x355c93.params.flowId);
    } else {
      _0x3c289d();
    }
    if (_0x355c93.params.create) {
      openFlowWizard(_0x14c61f, {
        onCreated: (_0x42574f) => _0x2e555c(_0x42574f.id),
      });
    }
    return _0x5941d6;
  },
};
