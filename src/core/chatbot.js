import { uid, sleep, digits, getPath } from './util.js';
import { renderTemplate } from './variables.js';
import { matchAny } from './matcher.js';
import { newMessage, menuText, parseMenuChoice } from './messages.js';
import { emptyActions } from './actions.js';
export const PALETTE_GROUPS = [
  {
    id: 'messages',
    label: 'Messages',
  },
  {
    id: 'interactive',
    label: 'Interactive',
  },
  {
    id: 'logic',
    label: 'Logic',
  },
  {
    id: 'flow',
    label: 'Flow control',
  },
  {
    id: 'actions',
    label: 'Actions',
  },
  {
    id: 'escalate',
    label: 'Escalate and end',
  },
];
const capture = () => ({
  wait: false,
  saveAs: '',
  format: 'any',
  timeoutEnabled: false,
  timeoutValue: 5,
  timeoutUnit: 'minutes',
});
export const NODE_TYPES = {
  start: {
    label: 'Start',
    group: null,
    icon: 'flag',
    hint: 'Where the conversation begins',
    color: '#86efac',
    data: () => ({}),
  },
  text: {
    label: 'Send Text',
    group: 'messages',
    icon: 'message-square-text',
    hint: 'A plain text message',
    color: '#7dd3fc',
    data: () => ({
      text: '',
      typingDelay: 1,
      ...capture(),
    }),
  },
  image: {
    label: 'Send Image',
    group: 'messages',
    icon: 'image',
    hint: 'A photo, with a caption',
    color: '#7dd3fc',
    data: () => ({
      files: [],
      caption: '',
      typingDelay: 1,
      ...capture(),
    }),
  },
  video: {
    label: 'Send Video',
    group: 'messages',
    icon: 'video',
    hint: 'A video, with a caption',
    color: '#7dd3fc',
    data: () => ({
      files: [],
      caption: '',
      typingDelay: 1,
      ...capture(),
    }),
  },
  audio: {
    label: 'Send Audio',
    group: 'messages',
    icon: 'mic',
    hint: 'A voice note or audio file',
    color: '#7dd3fc',
    data: () => ({
      files: [],
      typingDelay: 1,
      ...capture(),
    }),
  },
  document: {
    label: 'Send Document',
    group: 'messages',
    icon: 'file-text',
    hint: 'A PDF or other file',
    color: '#7dd3fc',
    data: () => ({
      files: [],
      caption: '',
      typingDelay: 1,
      ...capture(),
    }),
  },
  list: {
    label: 'Send List',
    group: 'interactive',
    icon: 'list',
    hint: 'A menu of options to pick from',
    color: '#c4b5fd',
    data: () => ({
      text: '',
      title: '',
      buttonText: 'View options',
      footer: '',
      sections: [
        {
          title: 'Options',
          rows: [
            {
              title: '',
              description: '',
            },
          ],
        },
      ],
      saveAs: '',
      timeoutEnabled: false,
      timeoutValue: 5,
      timeoutUnit: 'minutes',
    }),
  },
  buttons: {
    label: 'Buttons',
    group: 'interactive',
    icon: 'mouse-pointer-click',
    hint: 'A few tappable replies',
    color: '#c4b5fd',
    data: () => ({
      text: '',
      footer: '',
      buttons: [
        {
          text: '',
        },
        {
          text: '',
        },
      ],
      saveAs: '',
      timeoutEnabled: false,
      timeoutValue: 5,
      timeoutUnit: 'minutes',
    }),
  },
  condition: {
    label: 'Condition',
    group: 'logic',
    icon: 'git-branch',
    hint: 'Branch on a saved answer',
    color: '#ff4d4f',
    data: () => ({
      branches: [
        {
          join: 'and',
          rules: [
            {
              variable: '',
              operator: 'equals',
              value: '',
            },
          ],
        },
      ],
    }),
  },
  setVariable: {
    label: 'Set Variable',
    group: 'logic',
    icon: 'variable',
    hint: 'Store or change a value',
    color: '#ff4d4f',
    data: () => ({
      entries: [
        {
          name: '',
          scope: 'chatbot',
          value: '',
        },
      ],
    }),
  },
  delay: {
    label: 'Delay',
    group: 'flow',
    icon: 'timer',
    hint: 'Wait before the next block',
    color: '#fdba74',
    data: () => ({
      value: 5,
      unit: 'seconds',
    }),
  },
  jump: {
    label: 'Jump Next Step',
    group: 'flow',
    icon: 'arrow-right',
    hint: 'Go to another block',
    color: '#fdba74',
    data: () => ({
      targetId: '',
    }),
  },
  startNewFlow: {
    label: 'Start New Chatbot',
    group: 'flow',
    icon: 'workflow',
    hint: 'Hand the chat to another chatbot',
    color: '#fdba74',
    data: () => ({
      flowId: '',
    }),
  },
  tag: {
    label: 'Tag Contact',
    group: 'actions',
    icon: 'tags',
    hint: 'Add CRM tags to the contact',
    color: '#f9a8d4',
    data: () => ({
      add: [],
      remove: [],
    }),
  },
  action: {
    label: 'Action',
    group: 'actions',
    icon: 'zap',
    hint: 'Archive, block, or move in CRM',
    color: '#f9a8d4',
    data: () => ({
      actions: emptyActions(),
    }),
  },
  webhook: {
    label: 'API Request',
    group: 'actions',
    icon: 'webhook',
    hint: 'Call an outside service',
    color: '#f9a8d4',
    data: () => ({
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      bodyMode: 'fields',
      bodyFields: [],
      bodyRaw: '',
      timeoutSec: 15,
      retry: true,
      statusRoutes: [],
      mapping: [],
    }),
  },
  handoff: {
    label: 'Human Handoff',
    group: 'escalate',
    icon: 'headset',
    hint: 'Pass the chat to a person',
    color: '#fca5a5',
    data: () => ({
      customerMessage: 'One moment, a colleague is joining you now.',
      agentPhone: '',
      agentMessage: 'New chat needs a reply. Customer: {{mob_no}}',
    }),
  },
  end: {
    label: 'End Chatbot',
    group: 'escalate',
    icon: 'circle-check',
    hint: 'Finish the conversation',
    color: '#fca5a5',
    data: () => ({
      message: '',
    }),
  },
};
export const OPERATORS = [
  {
    id: 'equals',
    label: 'equals',
    needsValue: true,
  },
  {
    id: 'not_equals',
    label: 'not equals',
    needsValue: true,
  },
  {
    id: 'contains',
    label: 'contains',
    needsValue: true,
  },
  {
    id: 'not_contains',
    label: 'does not contain',
    needsValue: true,
  },
  {
    id: 'starts_with',
    label: 'starts with',
    needsValue: true,
  },
  {
    id: 'ends_with',
    label: 'ends with',
    needsValue: true,
  },
  {
    id: 'gt',
    label: 'greater than',
    needsValue: true,
  },
  {
    id: 'gte',
    label: 'greater than or equal',
    needsValue: true,
  },
  {
    id: 'lt',
    label: 'less than',
    needsValue: true,
  },
  {
    id: 'lte',
    label: 'less than or equal',
    needsValue: true,
  },
  {
    id: 'is_empty',
    label: 'is empty',
    needsValue: false,
  },
  {
    id: 'is_not_empty',
    label: 'is not empty',
    needsValue: false,
  },
];
export const FORMATS = [
  {
    id: 'any',
    label: 'Anything',
  },
  {
    id: 'text',
    label: 'Any text',
  },
  {
    id: 'number',
    label: 'A number',
  },
  {
    id: 'email',
    label: 'An email address',
  },
  {
    id: 'phone',
    label: 'A phone number',
  },
  {
    id: 'date',
    label: 'A date',
  },
];
export function choiceOptions(_0x39fe26) {
  if (_0x39fe26.type === 'buttons') {
    return (_0x39fe26.data.buttons || [])
      .map((_0x370d7d) => _0x370d7d.text.trim())
      .filter(Boolean);
  }
  if (_0x39fe26.type === 'list') {
    return (_0x39fe26.data.sections || []).flatMap((_0x2aa89e) =>
      _0x2aa89e.rows.map((_0x552a61) => _0x552a61.title.trim()).filter(Boolean),
    );
  }
  return [];
}
export function handlesOf(_0x4dd022) {
  const _0x1d4c97 = _0x4dd022.data || {};
  switch (_0x4dd022.type) {
    case 'start':
      return [
        {
          id: 'next',
          label: 'Next',
        },
      ];
    case 'text':
    case 'image':
    case 'video':
    case 'audio':
    case 'document':
      return [
        {
          id: 'next',
          label: _0x1d4c97.wait ? 'After reply' : 'Next',
        },
      ].concat(
        _0x1d4c97.wait && _0x1d4c97.timeoutEnabled
          ? [
              {
                id: 'timeout',
                label:
                  'No reply in ' +
                  _0x1d4c97.timeoutValue +
                  ' ' +
                  _0x1d4c97.timeoutUnit,
              },
            ]
          : [],
      );
    case 'list':
    case 'buttons':
      return choiceOptions(_0x4dd022)
        .map((_0x3b7d8c, _0x2403dd) => ({
          id: 'option:' + _0x2403dd,
          label: _0x3b7d8c,
        }))
        .concat([
          {
            id: 'default',
            label: 'Not understood',
          },
        ])
        .concat(
          _0x1d4c97.timeoutEnabled
            ? [
                {
                  id: 'timeout',
                  label:
                    'No reply in ' +
                    _0x1d4c97.timeoutValue +
                    ' ' +
                    _0x1d4c97.timeoutUnit,
                },
              ]
            : [],
        );
    case 'condition':
      return (_0x1d4c97.branches || [])
        .map((_0x47feae, _0x119c91) => ({
          id: 'cond:' + _0x119c91,
          label: 'Condition ' + (_0x119c91 + 1),
        }))
        .concat([
          {
            id: 'otherwise',
            label: 'Otherwise',
          },
        ]);
    case 'setVariable':
    case 'delay':
    case 'tag':
    case 'action':
      return [
        {
          id: 'next',
          label: 'Next',
        },
      ];
    case 'webhook':
      return [
        {
          id: 'next',
          label: 'Success',
        },
      ]
        .concat(
          (_0x1d4c97.statusRoutes || []).map((_0x587b3c) => ({
            id: 'status:' + _0x587b3c,
            label: 'Status ' + _0x587b3c,
          })),
        )
        .concat([
          {
            id: 'fallback',
            label: 'Fallback',
          },
        ]);
    default:
      return [];
  }
}
export function newNode(_0x23c10f, _0x2f5766 = 0, _0x2e2a37 = 0) {
  const _0x2db1de = NODE_TYPES[_0x23c10f];
  return {
    id: uid('n'),
    type: _0x23c10f,
    x: _0x2f5766,
    y: _0x2e2a37,
    title: '',
    data: _0x2db1de.data(),
  };
}
export function newGraph() {
  const _0x11b812 = newNode('start', 60, 120);
  return {
    nodes: [_0x11b812],
    edges: [],
    settings: {
      fallbackMessage: "Sorry, I didn't understand that.",
      optOutKeywords: ['stop', 'unsubscribe'],
      optOutMessage:
        'You have been unsubscribed. Send "start" any time to talk again.',
      interruptKeywords: [],
      sessionTtlHours: 24,
      maxRetries: 2,
    },
  };
}
export function newFlow(_0x1f7916 = '') {
  return {
    name: _0x1f7916,
    enabled: false,
    trigger: {
      type: 'keyword',
      keywords: [],
      match: 'contains',
      caseSensitive: false,
    },
    draft: newGraph(),
    published: null,
    publishedAt: 0,
    runs: 0,
  };
}
export function validateGraph(_0x4bbfd5, _0x1af661 = {}) {
  const _0x430696 = [];
  const _0x45a8f9 = new Map(
    _0x4bbfd5.nodes.map((_0x277699) => [_0x277699.id, _0x277699]),
  );
  const _0x29f1f2 = (_0x47994b, _0x494945) =>
    _0x430696.push({
      nodeId: _0x47994b,
      message: _0x494945,
    });
  const _0x49f7f0 = _0x4bbfd5.nodes.filter(
    (_0x5c8955) => _0x5c8955.type === 'start',
  );
  if (_0x49f7f0.length !== 1) {
    _0x29f1f2(null, 'A flow needs exactly one Start block.');
  } else if (
    !_0x4bbfd5.edges.some((_0x2d33a2) => _0x2d33a2.from === _0x49f7f0[0].id)
  ) {
    _0x29f1f2(_0x49f7f0[0].id, 'Connect the Start block to your first step.');
  }
  for (const _0x4d3359 of _0x4bbfd5.nodes) {
    const _0xbf5498 = _0x4d3359.data || {};
    switch (_0x4d3359.type) {
      case 'text':
        if (!String(_0xbf5498.text || '').trim()) {
          _0x29f1f2(_0x4d3359.id, 'Type the message to send.');
        }
        break;
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        if (!(_0xbf5498.files || []).length) {
          _0x29f1f2(_0x4d3359.id, 'Upload a file to send.');
        }
        break;
      case 'list':
        if (!String(_0xbf5498.text || '').trim()) {
          _0x29f1f2(_0x4d3359.id, 'Type the message shown above the list.');
        }
        if (!choiceOptions(_0x4d3359).length) {
          _0x29f1f2(_0x4d3359.id, 'Add at least one list row.');
        }
        break;
      case 'buttons':
        if (!String(_0xbf5498.text || '').trim()) {
          _0x29f1f2(_0x4d3359.id, 'Type the message shown above the buttons.');
        }
        if (!choiceOptions(_0x4d3359).length) {
          _0x29f1f2(_0x4d3359.id, 'Add at least one button.');
        }
        break;
      case 'condition':
        if (
          !(_0xbf5498.branches || []).length ||
          _0xbf5498.branches.some(
            (_0x94d586) =>
              !_0x94d586.rules.length ||
              _0x94d586.rules.some((_0x2117f3) => !_0x2117f3.variable.trim()),
          )
        ) {
          _0x29f1f2(_0x4d3359.id, 'Every condition needs a variable to check.');
        }
        break;
      case 'setVariable':
        if (
          !(_0xbf5498.entries || []).length ||
          _0xbf5498.entries.some((_0x4843d4) => !_0x4843d4.name.trim())
        ) {
          _0x29f1f2(_0x4d3359.id, 'Give every variable a name.');
        }
        break;
      case 'delay':
        if (!(Number(_0xbf5498.value) > 0)) {
          _0x29f1f2(_0x4d3359.id, 'Set how long to wait.');
        }
        break;
      case 'jump':
        if (!_0xbf5498.targetId || !_0x45a8f9.has(_0xbf5498.targetId)) {
          _0x29f1f2(_0x4d3359.id, 'Pick the block to jump to.');
        }
        break;
      case 'startNewFlow':
        if (!_0xbf5498.flowId) {
          _0x29f1f2(_0x4d3359.id, 'Pick the chatbot to hand over to.');
        }
        break;
      case 'tag':
        if (!(_0xbf5498.add || []).length && !(_0xbf5498.remove || []).length) {
          _0x29f1f2(_0x4d3359.id, 'Pick at least one tag.');
        }
        break;
      case 'webhook':
        if (!/^https?:\/\//i.test(String(_0xbf5498.url || '').trim())) {
          _0x29f1f2(
            _0x4d3359.id,
            'Enter the address to call, starting with http:// or https://.',
          );
        }
        break;
      case 'handoff':
        if (
          !String(_0xbf5498.customerMessage || '').trim() &&
          !String(_0xbf5498.agentPhone || '').trim()
        ) {
          _0x29f1f2(
            _0x4d3359.id,
            'Add a message for the customer or an agent number.',
          );
        }
        break;
      default:
        break;
    }
    if (
      ['text', 'image', 'video', 'audio', 'document'].includes(
        _0x4d3359.type,
      ) &&
      _0xbf5498.wait &&
      _0xbf5498.saveAs &&
      !/^[\w.\-]+$/.test(_0xbf5498.saveAs)
    ) {
      _0x29f1f2(
        _0x4d3359.id,
        'Variable names can only use letters, numbers, dots, dashes and underscores.',
      );
    }
  }
  for (const _0x19f0b7 of _0x4bbfd5.edges) {
    if (!_0x45a8f9.has(_0x19f0b7.from) || !_0x45a8f9.has(_0x19f0b7.to)) {
      _0x29f1f2(null, 'A connection points to a block that no longer exists.');
    }
  }
  if (_0x49f7f0.length === 1) {
    const _0x286cce = new Set([_0x49f7f0[0].id]);
    const _0x65e63 = [_0x49f7f0[0].id];
    while (_0x65e63.length) {
      const _0xf53b7e = _0x65e63.shift();
      const _0x801307 = _0x45a8f9.get(_0xf53b7e);
      for (const _0x337e29 of _0x4bbfd5.edges) {
        if (_0x337e29.from === _0xf53b7e && !_0x286cce.has(_0x337e29.to)) {
          _0x286cce.add(_0x337e29.to);
          _0x65e63.push(_0x337e29.to);
        }
      }
      if (
        _0x801307 &&
        _0x801307.type === 'jump' &&
        _0x801307.data.targetId &&
        !_0x286cce.has(_0x801307.data.targetId)
      ) {
        _0x286cce.add(_0x801307.data.targetId);
        _0x65e63.push(_0x801307.data.targetId);
      }
    }
    for (const _0x5341d9 of _0x4bbfd5.nodes) {
      if (!_0x286cce.has(_0x5341d9.id)) {
        _0x29f1f2(
          _0x5341d9.id,
          'Nothing leads to this block, so it will never run.',
        );
      }
    }
  }
  return _0x430696;
}
const FORMAT_CHECKS = {
  any: () => true,
  text: (_0x53f7f1) => _0x53f7f1.length > 0,
  number: (_0x37c3bd) => /^-?\d+([.,]\d+)?$/.test(_0x37c3bd.replace(/\s/g, '')),
  email: (_0x211d17) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(_0x211d17),
  phone: (_0x82cdde) =>
    digits(_0x82cdde).length >= 7 && digits(_0x82cdde).length <= 15,
  date: (_0x3572b1) =>
    !Number.isNaN(Date.parse(_0x3572b1)) ||
    /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(_0x3572b1),
};
export function validFormat(_0x52844a, _0x2805a4) {
  return (FORMAT_CHECKS[_0x52844a] || FORMAT_CHECKS.any)(
    String(_0x2805a4 || '').trim(),
  );
}
export function evalRule(_0x86ee68, _0x125b2c, _0x8a390d) {
  const _0x3edc36 =
    _0x125b2c === undefined || _0x125b2c === null
      ? ''
      : String(_0x125b2c).trim();
  const _0x52f244 = renderTemplate(_0x86ee68.value, _0x8a390d).trim();
  const _0x517125 = _0x3edc36.toLowerCase();
  const _0xc9f64d = _0x52f244.toLowerCase();
  const _0x39b690 = (_0x15336f) => Number(String(_0x15336f).replace(',', '.'));
  switch (_0x86ee68.operator) {
    case 'equals':
      return _0x517125 === _0xc9f64d;
    case 'not_equals':
      return _0x517125 !== _0xc9f64d;
    case 'contains':
      return _0x517125.includes(_0xc9f64d);
    case 'not_contains':
      return !_0x517125.includes(_0xc9f64d);
    case 'starts_with':
      return _0x517125.startsWith(_0xc9f64d);
    case 'ends_with':
      return _0x517125.endsWith(_0xc9f64d);
    case 'gt':
      return _0x39b690(_0x3edc36) > _0x39b690(_0x52f244);
    case 'gte':
      return _0x39b690(_0x3edc36) >= _0x39b690(_0x52f244);
    case 'lt':
      return _0x39b690(_0x3edc36) < _0x39b690(_0x52f244);
    case 'lte':
      return _0x39b690(_0x3edc36) <= _0x39b690(_0x52f244);
    case 'is_empty':
      return _0x3edc36 === '';
    case 'is_not_empty':
      return _0x3edc36 !== '';
    default:
      return false;
  }
}
const UNIT_MS = {
  seconds: 1000,
  minutes: 60000,
  hours: 3600000,
};
export const unitMs = (_0xafbcce, _0x42c0d2) =>
  Math.max(0, Number(_0xafbcce) || 0) * (UNIT_MS[_0x42c0d2] || 1000);
export function nodeToMessage(_0x157e6e) {
  const _0x2fbe22 = _0x157e6e.data;
  if (_0x157e6e.type === 'text') {
    return Object.assign(newMessage('none'), {
      text: _0x2fbe22.text,
    });
  }
  if (['image', 'video', 'document', 'audio'].includes(_0x157e6e.type)) {
    const _0x55542b = newMessage(
      _0x157e6e.type === 'audio'
        ? 'audio'
        : _0x157e6e.type === 'document'
          ? 'document'
          : 'media',
    );
    _0x55542b.text = _0x2fbe22.caption || '';
    _0x55542b.files = (_0x2fbe22.files || []).map((_0x3bde7c) =>
      Object.assign({}, _0x3bde7c),
    );
    return _0x55542b;
  }
  return null;
}
export function createChatbotEngine({
  store: _0x2a0037,
  sender: _0xa77f32,
  crm: _0x276e09,
  wa: _0x20a77f,
  http: _0x351e27,
  activity: _0x3b2cb1,
  webhooks: _0x3b8925,
  actions: _0x53ac23,
  emit: _0x1ad95c,
  now = Date.now,
  sleepFn = sleep,
}) {
  const _0x21a455 = (_0x481c9a, _0x51a45f) => {
    if (_0x1ad95c) {
      _0x1ad95c(_0x481c9a, _0x51a45f);
    }
  };
  const _0x5f3a06 = new Map();
  const _0x286812 = (_0x584066) =>
    _0x2a0037.get('chatMemory', _0x584066) || {
      id: _0x584066,
      optOut: false,
      runs: {},
    };
  const _0x5e3612 = (_0x44a497, _0x24ecdd) =>
    _0x44a497.nodes.find((_0x40047b) => _0x40047b.id === _0x24ecdd) || null;
  const _0x3cfa09 = (_0x526bbd, _0xa28b66, _0x314a28) => {
    const _0x247618 = _0x526bbd.edges.find(
      (_0x28472c) =>
        _0x28472c.from === _0xa28b66 && _0x28472c.handle === _0x314a28,
    );
    if (_0x247618) {
      return _0x247618.to;
    } else {
      return null;
    }
  };
  const _0x14b7e6 = () => _0x2a0037.all('chatSessions');
  const _0x494df1 = (_0x357303) =>
    _0x2a0037.find(
      'chatSessions',
      (_0x301189) =>
        _0x301189.chatId === _0x357303 && _0x301189.status !== 'ended',
    );
  const _0x13b4f9 = (_0x3906c1) => _0x2a0037.get('chatbots', _0x3906c1);
  function _0x1f6c67(_0x323dd8, _0x1dc304) {
    const _0x2f9eeb = _0x5f3a06.get(_0x323dd8) || Promise.resolve();
    const _0x304705 = _0x2f9eeb.then(_0x1dc304, _0x1dc304);
    _0x5f3a06.set(
      _0x323dd8,
      _0x304705.catch(() => {}),
    );
    return _0x304705;
  }
  function _0x24e6bd(_0x3f5011) {
    return _0x276e09.vars(_0x3f5011.chatId, _0x3f5011.vars);
  }
  function _0x45a3d7(_0x5cf654, _0x1f9a84) {
    if (_0x1f9a84 in _0x5cf654.vars) {
      return _0x5cf654.vars[_0x1f9a84];
    }
    const _0x37ad02 = _0x276e09.contact(_0x5cf654.chatId);
    if (_0x37ad02.attributes && _0x1f9a84 in _0x37ad02.attributes) {
      return _0x37ad02.attributes[_0x1f9a84];
    }
    const _0x1501d5 = _0x24e6bd(_0x5cf654);
    return _0x1501d5[_0x1f9a84];
  }
  async function _0x323146(_0x843fb5, _0x32b67c, _0x422491 = {}) {
    const _0x5b70b2 = [].concat(_0x32b67c).filter(Boolean);
    if (!_0x5b70b2.length) {
      return {
        ok: true,
      };
    }
    return _0xa77f32.send(
      _0x843fb5.chatId,
      _0x5b70b2,
      Object.assign(
        {
          automated: true,
          vars: _0x843fb5.vars,
        },
        _0x422491,
      ),
    );
  }
  async function _0x100b5f(_0x1c61b3) {
    _0x1c61b3.updatedAt = now();
    await _0x2a0037.put('chatSessions', _0x1c61b3);
  }
  async function _0x4b4592(_0x3e9f36, _0x5679a5) {
    _0x3e9f36.status = 'ended';
    _0x3e9f36.endedReason = _0x5679a5;
    _0x3e9f36.waiting = null;
    await _0x2a0037.remove('chatSessions', _0x3e9f36.id);
    if (_0x3b2cb1) {
      await _0x3b2cb1.log('chatbot_end', {
        chatId: _0x3e9f36.chatId,
        text:
          ((_0x13b4f9(_0x3e9f36.flowId) || {}).name || 'Chatbot') +
          ' ended: ' +
          _0x5679a5,
      });
    }
    if (_0x5679a5 === 'completed' && _0x3b8925) {
      _0x3b8925.emit('chatbot_completed', {
        chatId: _0x3e9f36.chatId,
        flow: (_0x13b4f9(_0x3e9f36.flowId) || {}).name,
        variables: _0x3e9f36.vars,
      });
    }
    _0x21a455('chatbot:end', {
      session: _0x3e9f36,
      reason: _0x5679a5,
    });
  }
  async function _0x1876c2(_0x2f9274, _0x509eee, _0x3f11c9, _0x3bacd8) {
    if (_0x3f11c9 === 'contact') {
      await _0x276e09.setAttribute(_0x2f9274.chatId, _0x509eee, _0x3bacd8);
    } else {
      _0x2f9274.vars[_0x509eee] = _0x3bacd8;
    }
  }
  function _0x3b1f3e(_0x458c89, _0x12af05) {
    const _0x498951 = String(_0x12af05 == null ? '' : _0x12af05);
    if (/^@[\w.\-]+$/.test(_0x498951)) {
      const _0x5deebf = _0x45a3d7(_0x458c89, _0x498951.slice(1));
      if (_0x5deebf === undefined) {
        return '';
      } else {
        return _0x5deebf;
      }
    }
    return renderTemplate(_0x498951, Object.assign({}, _0x24e6bd(_0x458c89)));
  }
  async function _0x299e49(_0x134e4d, _0x488b58) {
    const _0x5a761d = _0x488b58.data;
    const _0xd57abe = Object.assign({}, _0x24e6bd(_0x134e4d));
    let _0x4099ad;
    try {
      _0x4099ad = new URL(renderTemplate(_0x5a761d.url, _0xd57abe));
    } catch (_0x546554) {
      return {
        handle: 'fallback',
        error: 'Invalid address',
      };
    }
    for (const _0x487be0 of _0x5a761d.params || []) {
      if (_0x487be0.name) {
        _0x4099ad.searchParams.set(
          _0x487be0.name,
          renderTemplate(_0x487be0.value, _0xd57abe),
        );
      }
    }
    const _0xc5dc9c = {};
    for (const _0x38cc8d of _0x5a761d.headers || []) {
      if (_0x38cc8d.name) {
        _0xc5dc9c[_0x38cc8d.name] = renderTemplate(_0x38cc8d.value, _0xd57abe);
      }
    }
    const _0x2a9059 = {
      url: _0x4099ad.toString(),
      method: _0x5a761d.method,
      headers: _0xc5dc9c,
      timeoutMs: (Number(_0x5a761d.timeoutSec) || 15) * 1000,
    };
    if (!['GET', 'DELETE', 'HEAD'].includes(_0x5a761d.method)) {
      if (_0x5a761d.bodyMode === 'raw') {
        _0x2a9059.body = renderTemplate(_0x5a761d.bodyRaw, _0xd57abe);
        _0xc5dc9c['Content-Type'] =
          _0xc5dc9c['Content-Type'] || 'application/json';
      } else {
        const _0x1bbcb9 = {};
        for (const _0x48f376 of _0x5a761d.bodyFields || []) {
          if (_0x48f376.name) {
            _0x1bbcb9[_0x48f376.name] = renderTemplate(
              _0x48f376.value,
              _0xd57abe,
            );
          }
        }
        _0x2a9059.json = _0x1bbcb9;
      }
    }
    let _0x626a77 = null;
    for (
      let _0x5aa036 = 0;
      _0x5aa036 < (_0x5a761d.retry ? 2 : 1);
      _0x5aa036++
    ) {
      try {
        _0x626a77 = await _0x351e27.request(_0x2a9059);
        break;
      } catch (_0x23c6df) {
        _0x626a77 = {
          error: _0x23c6df,
        };
        if (_0x23c6df && _0x23c6df.name === 'PermissionError') {
          break;
        }
      }
    }
    if (!_0x626a77 || _0x626a77.error) {
      return {
        handle: 'fallback',
        error:
          (_0x626a77 && _0x626a77.error && _0x626a77.error.message) ||
          'The request failed',
      };
    }
    const _0x112f19 = _0x626a77.json();
    for (const _0x2aa5b1 of _0x5a761d.mapping || []) {
      if (_0x2aa5b1.path && _0x2aa5b1.variable) {
        _0x134e4d.vars[_0x2aa5b1.variable] = _0x112f19
          ? (getPath(_0x112f19, _0x2aa5b1.path) ?? '')
          : '';
      }
    }
    const _0x15b656 = String(_0x626a77.status);
    if ((_0x5a761d.statusRoutes || []).map(String).includes(_0x15b656)) {
      return {
        handle: 'status:' + _0x15b656,
      };
    }
    return {
      handle: _0x626a77.ok ? 'next' : 'fallback',
    };
  }
  async function _0x31fd34(_0x5031f3, _0x30026d, _0x2796a8) {
    const _0x562241 = _0x2796a8.data || {};
    switch (_0x2796a8.type) {
      case 'start':
        return {
          handle: 'next',
        };
      case 'text':
      case 'image':
      case 'video':
      case 'audio':
      case 'document': {
        const _0x51e4cf = nodeToMessage(_0x2796a8);
        const _0x412d9e = await _0x323146(_0x5031f3, _0x51e4cf, {
          typing: (Number(_0x562241.typingDelay) || 0) > 0,
          typingMs: (Number(_0x562241.typingDelay) || 0) * 1000,
        });
        if (!_0x412d9e.ok && !_0x412d9e.sent) {
          return {
            end:
              'send_failed: ' +
              ((_0x412d9e.errors[0] && _0x412d9e.errors[0].error) || 'unknown'),
          };
        }
        if (_0x562241.wait) {
          return {
            wait: {
              kind: 'reply',
              nodeId: _0x2796a8.id,
              saveAs: _0x562241.saveAs,
              format: _0x562241.format || 'any',
              retries: 0,
              timeoutAt: _0x562241.timeoutEnabled
                ? now() + unitMs(_0x562241.timeoutValue, _0x562241.timeoutUnit)
                : 0,
            },
          };
        }
        return {
          handle: 'next',
        };
      }
      case 'list':
      case 'buttons': {
        const _0x49deea = choiceOptions(_0x2796a8);
        const _0x10c6a0 = _0x24e6bd(_0x5031f3);
        const _0x111f91 = renderTemplate(_0x562241.text, _0x10c6a0);
        let _0x403e94;
        if (_0x2796a8.type === 'buttons') {
          _0x403e94 = menuText(
            _0x111f91,
            _0x49deea.map((_0x24930a) => renderTemplate(_0x24930a, _0x10c6a0)),
            renderTemplate(_0x562241.footer || '', _0x10c6a0),
          );
        } else {
          let _0x1a255e = 0;
          const _0x16d98d = [];
          const _0x26819c =
            (_0x562241.sections || []).filter((_0x29da84) =>
              _0x29da84.rows.some((_0x194318) => _0x194318.title.trim()),
            ).length > 1;
          for (const _0x2ebadf of _0x562241.sections || []) {
            const _0x178b69 = _0x2ebadf.rows.filter((_0x1be64c) =>
              _0x1be64c.title.trim(),
            );
            if (!_0x178b69.length) {
              continue;
            }
            if (_0x26819c && _0x2ebadf.title) {
              _0x16d98d.push(
                '*' + renderTemplate(_0x2ebadf.title, _0x10c6a0) + '*',
              );
            }
            for (const _0x1ce3bd of _0x178b69) {
              _0x1a255e++;
              _0x16d98d.push(
                _0x1a255e +
                  '. ' +
                  renderTemplate(_0x1ce3bd.title, _0x10c6a0) +
                  (_0x1ce3bd.description
                    ? ' - ' + renderTemplate(_0x1ce3bd.description, _0x10c6a0)
                    : ''),
              );
            }
          }
          _0x403e94 = [
            _0x111f91,
            _0x16d98d.join(String.fromCharCode(10)),
            renderTemplate(_0x562241.footer || '', _0x10c6a0) ||
              'Reply with ' + (_0x1a255e > 1 ? '1 to ' + _0x1a255e : '1') + '.',
          ]
            .filter(Boolean)
            .join(String.fromCharCode(10, 10));
        }
        const _0x231caa = await _0x323146(
          _0x5031f3,
          Object.assign(newMessage('none'), {
            text: _0x403e94,
          }),
          {
            typing: true,
          },
        );
        if (!_0x231caa.ok && !_0x231caa.sent) {
          return {
            end:
              'send_failed: ' +
              ((_0x231caa.errors[0] && _0x231caa.errors[0].error) || 'unknown'),
          };
        }
        return {
          wait: {
            kind: 'choice',
            nodeId: _0x2796a8.id,
            options: _0x49deea,
            intro: _0x111f91,
            saveAs: _0x562241.saveAs,
            retries: 0,
            timeoutAt: _0x562241.timeoutEnabled
              ? now() + unitMs(_0x562241.timeoutValue, _0x562241.timeoutUnit)
              : 0,
          },
        };
      }
      case 'condition': {
        const _0x4936a0 = _0x24e6bd(_0x5031f3);
        for (
          let _0x34ce4b = 0;
          _0x34ce4b < (_0x562241.branches || []).length;
          _0x34ce4b++
        ) {
          const _0x3c1fdd = _0x562241.branches[_0x34ce4b];
          const _0x4b405c = _0x3c1fdd.rules.map((_0xedefbc) =>
            evalRule(
              _0xedefbc,
              _0x45a3d7(_0x5031f3, _0xedefbc.variable),
              _0x4936a0,
            ),
          );
          const _0x4cb0a2 =
            _0x3c1fdd.join === 'or'
              ? _0x4b405c.some(Boolean)
              : _0x4b405c.every(Boolean);
          if (_0x4cb0a2) {
            return {
              handle: 'cond:' + _0x34ce4b,
            };
          }
        }
        return {
          handle: 'otherwise',
        };
      }
      case 'setVariable': {
        for (const _0x3de5c6 of _0x562241.entries || []) {
          if (_0x3de5c6.name) {
            await _0x1876c2(
              _0x5031f3,
              _0x3de5c6.name,
              _0x3de5c6.scope,
              _0x3b1f3e(_0x5031f3, _0x3de5c6.value),
            );
          }
        }
        return {
          handle: 'next',
        };
      }
      case 'delay':
        return {
          delay: unitMs(_0x562241.value, _0x562241.unit),
        };
      case 'jump':
        return {
          goto: _0x562241.targetId,
        };
      case 'startNewFlow':
        return {
          handover: _0x562241.flowId,
        };
      case 'tag': {
        if ((_0x562241.add || []).length) {
          await _0x276e09.addTags(_0x5031f3.chatId, _0x562241.add);
        }
        if ((_0x562241.remove || []).length) {
          await _0x276e09.removeTags(_0x5031f3.chatId, _0x562241.remove);
        }
        return {
          handle: 'next',
        };
      }
      case 'action': {
        const _0x220dd9 = await _0x53ac23.run(
          _0x5031f3.chatId,
          _0x562241.actions,
          {
            source: 'chatbot',
          },
        );
        if (_0x220dd9.length && _0x3b2cb1) {
          await _0x3b2cb1.log('chatbot_action_failed', {
            chatId: _0x5031f3.chatId,
            text: _0x220dd9.join(' | '),
          });
        }
        return {
          handle: 'next',
        };
      }
      case 'webhook':
        return _0x299e49(_0x5031f3, _0x2796a8);
      case 'handoff': {
        if (String(_0x562241.customerMessage || '').trim()) {
          await _0x323146(
            _0x5031f3,
            Object.assign(newMessage('none'), {
              text: _0x562241.customerMessage,
            }),
          );
        }
        await _0x276e09.saveContact(_0x5031f3.chatId, {
          botPaused: true,
          humanRequestedAt: now(),
        });
        if (String(_0x562241.agentPhone || '').trim()) {
          try {
            const _0x22feb5 = await _0x20a77f.resolveTarget(
              _0x562241.agentPhone,
            );
            if (_0x22feb5) {
              await _0xa77f32.send(
                _0x22feb5,
                Object.assign(newMessage('none'), {
                  text: renderTemplate(
                    _0x562241.agentMessage ||
                      'New chat needs a reply. Customer: {{mob_no}}',
                    _0x24e6bd(_0x5031f3),
                  ),
                }),
                {
                  automated: true,
                  typing: false,
                },
              );
            }
          } catch (_0x54a90a) {}
        }
        if (_0x3b8925) {
          _0x3b8925.emit('handoff', {
            chatId: _0x5031f3.chatId,
            name: _0x276e09.displayName(_0x5031f3.chatId),
            source: 'chatbot',
          });
        }
        _0x21a455('handoff', {
          chatId: _0x5031f3.chatId,
          source: 'chatbot',
        });
        return {
          end: 'handoff',
        };
      }
      case 'end': {
        if (String(_0x562241.message || '').trim()) {
          await _0x323146(
            _0x5031f3,
            Object.assign(newMessage('none'), {
              text: _0x562241.message,
            }),
          );
        }
        return {
          end: 'completed',
        };
      }
      default:
        return {
          end: 'unknown block',
        };
    }
  }
  async function _0xf0fe7(_0x5c89dc, _0x6d6417, _0x5e8538) {
    const _0x3ef545 = _0x6d6417.published;
    let _0x5218fd = _0x5e8538;
    if (!_0x5218fd) {
      await _0x4b4592(_0x5c89dc, 'completed');
      return;
    }
    for (let _0x11498d = 0; _0x5218fd && _0x11498d < 120; _0x11498d++) {
      const _0x597d31 = _0x5e3612(_0x3ef545, _0x5218fd);
      if (!_0x597d31) {
        await _0x4b4592(_0x5c89dc, 'missing block');
        return;
      }
      _0x5c89dc.nodeId = _0x5218fd;
      let _0x9e6480;
      try {
        _0x9e6480 = await _0x31fd34(_0x5c89dc, _0x3ef545, _0x597d31);
      } catch (_0x7a963b) {
        await _0x4b4592(
          _0x5c89dc,
          'error: ' + ((_0x7a963b && _0x7a963b.message) || _0x7a963b),
        );
        return;
      }
      if (_0x9e6480.end) {
        await _0x4b4592(_0x5c89dc, _0x9e6480.end);
        return;
      }
      if (_0x9e6480.handover) {
        const _0x245962 = _0x13b4f9(_0x9e6480.handover);
        await _0x4b4592(_0x5c89dc, 'handover');
        if (_0x245962 && _0x245962.published) {
          await _0x21c9c3(_0x245962, _0x5c89dc.chatId, null, {
            vars: _0x5c89dc.vars,
          });
        }
        return;
      }
      if (_0x9e6480.wait) {
        _0x5c89dc.waiting = _0x9e6480.wait;
        _0x5c89dc.status = 'waiting';
        await _0x100b5f(_0x5c89dc);
        return;
      }
      if (_0x9e6480.delay !== undefined) {
        _0x5c89dc.status = 'delayed';
        _0x5c89dc.resumeAt = now() + _0x9e6480.delay;
        _0x5c89dc.resumeNode = _0x3cfa09(_0x3ef545, _0x5218fd, 'next');
        await _0x100b5f(_0x5c89dc);
        if (!_0x5c89dc.resumeNode) {
          await _0x4b4592(_0x5c89dc, 'completed');
        }
        return;
      }
      _0x5218fd =
        _0x9e6480.goto ||
        _0x3cfa09(_0x3ef545, _0x5218fd, _0x9e6480.handle || 'next');
      if (!_0x5218fd) {
        await _0x4b4592(_0x5c89dc, 'completed');
        return;
      }
    }
    if (_0x5218fd) {
      await _0x4b4592(_0x5c89dc, 'loop limit reached');
    }
  }
  async function _0x21c9c3(_0xa5f9b9, _0x176f9f, _0x55a134, _0x2f96a6 = {}) {
    if (!_0xa5f9b9.published) {
      return null;
    }
    const _0xf671ae = _0x494df1(_0x176f9f);
    if (_0xf671ae) {
      await _0x4b4592(_0xf671ae, 'replaced');
    }
    const _0x9adbf3 = _0xa5f9b9.published;
    const _0x4f4e95 = _0x9adbf3.nodes.find(
      (_0x242b4c) => _0x242b4c.type === 'start',
    );
    if (!_0x4f4e95) {
      return null;
    }
    const _0x1218b4 = {
      id: uid('ss'),
      flowId: _0xa5f9b9.id,
      chatId: _0x176f9f,
      status: 'active',
      nodeId: _0x4f4e95.id,
      vars: Object.assign({}, _0x2f96a6.vars || {}),
      waiting: null,
      startedAt: now(),
    };
    if (_0x55a134 && _0x55a134.body) {
      _0x1218b4.vars.last_message = _0x55a134.body;
    }
    const _0x50f79c = _0x286812(_0x176f9f);
    await _0x2a0037.put(
      'chatMemory',
      Object.assign({}, _0x50f79c, {
        runs: Object.assign({}, _0x50f79c.runs, {
          [_0xa5f9b9.id]: ((_0x50f79c.runs || {})[_0xa5f9b9.id] || 0) + 1,
        }),
      }),
    );
    await _0x2a0037.patch('chatbots', _0xa5f9b9.id, {
      runs: (_0xa5f9b9.runs || 0) + 1,
    });
    await _0x100b5f(_0x1218b4);
    if (_0x3b2cb1) {
      await _0x3b2cb1.log('chatbot_start', {
        chatId: _0x176f9f,
        text: 'Started "' + _0xa5f9b9.name + '"',
      });
    }
    _0x21a455('chatbot:start', {
      session: _0x1218b4,
      flow: _0xa5f9b9,
    });
    await _0xf0fe7(_0x1218b4, _0xa5f9b9, _0x4f4e95.id);
    return _0x1218b4;
  }
  function _0x10e589(_0x3420b3, _0xba1d6, _0x4ceddd) {
    const _0x178aa1 = (_0xba1d6.published.settings || {}).maxRetries ?? 2;
    return _0x4ceddd.retries > _0x178aa1;
  }
  async function _0x5ad4e7(_0xedd3d0, _0x5a2b13, _0x428324) {
    const _0x2077de = _0x5a2b13.published;
    const _0x23e640 = _0x2077de.settings || {};
    const _0xdd3c3f = _0xedd3d0.waiting;
    const _0x372ef5 = _0x5e3612(_0x2077de, _0xdd3c3f.nodeId);
    const _0x13e459 = String(_0x428324.body || '').trim();
    const _0x209e8f =
      _0x23e640.fallbackMessage || "Sorry, I didn't understand that.";
    if (_0xdd3c3f.kind === 'reply') {
      if (!validFormat(_0xdd3c3f.format, _0x13e459)) {
        _0xdd3c3f.retries++;
        if (_0x10e589(_0xedd3d0, _0x5a2b13, _0xdd3c3f)) {
          await _0x323146(
            _0xedd3d0,
            Object.assign(newMessage('none'), {
              text: _0x209e8f,
            }),
          );
          await _0x4b4592(_0xedd3d0, 'no valid answer');
          return true;
        }
        const _0x5b48dd = {
          number: 'Please send a number.',
          email: 'Please send a valid email address.',
          phone: 'Please send a valid phone number.',
          date: 'Please send a date, for example 2026-10-21.',
        }[_0xdd3c3f.format];
        await _0x323146(
          _0xedd3d0,
          Object.assign(newMessage('none'), {
            text: _0x5b48dd || _0x209e8f,
          }),
        );
        await _0x100b5f(_0xedd3d0);
        return true;
      }
      if (_0xdd3c3f.saveAs) {
        _0xedd3d0.vars[_0xdd3c3f.saveAs] = _0x13e459;
      }
      _0xedd3d0.waiting = null;
      _0xedd3d0.status = 'active';
      await _0xf0fe7(
        _0xedd3d0,
        _0x5a2b13,
        _0x3cfa09(_0x2077de, _0x372ef5.id, 'next'),
      );
      return true;
    }
    const _0x49de54 = parseMenuChoice(_0x13e459, _0xdd3c3f.options);
    if (_0x49de54 < 0) {
      _0xdd3c3f.retries++;
      if (_0x10e589(_0xedd3d0, _0x5a2b13, _0xdd3c3f)) {
        const _0x5f49c5 = _0x3cfa09(_0x2077de, _0x372ef5.id, 'default');
        _0xedd3d0.waiting = null;
        _0xedd3d0.status = 'active';
        if (_0x5f49c5) {
          await _0x323146(
            _0xedd3d0,
            Object.assign(newMessage('none'), {
              text: _0x209e8f,
            }),
          );
          await _0xf0fe7(_0xedd3d0, _0x5a2b13, _0x5f49c5);
        } else {
          await _0x323146(
            _0xedd3d0,
            Object.assign(newMessage('none'), {
              text: _0x209e8f,
            }),
          );
          await _0x4b4592(_0xedd3d0, 'no valid choice');
        }
        return true;
      }
      await _0x323146(
        _0xedd3d0,
        Object.assign(newMessage('none'), {
          text: menuText(
            _0x209e8f + '\n' + (_0xdd3c3f.intro || ''),
            _0xdd3c3f.options,
          ),
        }),
      );
      await _0x100b5f(_0xedd3d0);
      return true;
    }
    if (_0xdd3c3f.saveAs) {
      _0xedd3d0.vars[_0xdd3c3f.saveAs] = _0xdd3c3f.options[_0x49de54];
    }
    _0xedd3d0.vars.last_choice = _0xdd3c3f.options[_0x49de54];
    _0xedd3d0.waiting = null;
    _0xedd3d0.status = 'active';
    const _0x28b50b = _0x3cfa09(_0x2077de, _0x372ef5.id, 'option:' + _0x49de54);
    if (!_0x28b50b) {
      await _0x4b4592(_0xedd3d0, 'completed');
      return true;
    }
    await _0xf0fe7(_0xedd3d0, _0x5a2b13, _0x28b50b);
    return true;
  }
  const _0x3b14b0 = {
    sessionFor: _0x494df1,
    activeSessions: _0x14b7e6,
    memory: _0x286812,
    isOptedOut(_0x4eaec1) {
      return !!_0x286812(_0x4eaec1).optOut;
    },
    async optIn(_0x3ca0da) {
      await _0x2a0037.put(
        'chatMemory',
        Object.assign({}, _0x286812(_0x3ca0da), {
          optOut: false,
        }),
      );
    },
    findTrigger(_0x36adeb, _0x23b2fd = {}) {
      if (_0x286812(_0x36adeb.chatId).optOut) {
        return null;
      }
      for (const _0x380e0f of _0x2a0037.all('chatbots')) {
        if (!_0x380e0f.enabled || !_0x380e0f.published) {
          continue;
        }
        const _0x55edd9 = _0x380e0f.trigger || {};
        if (_0x55edd9.type === 'manual') {
          continue;
        }
        if (_0x55edd9.type === 'any_message') {
          if (_0x23b2fd.isNewChat) {
            return _0x380e0f;
          }
          continue;
        }
        if (
          matchAny(
            _0x36adeb.body,
            _0x55edd9.keywords,
            _0x55edd9.match || 'contains',
            _0x55edd9.caseSensitive,
          )
        ) {
          return _0x380e0f;
        }
      }
      return null;
    },
    start: _0x21c9c3,
    handleIncoming(_0x5d3830) {
      return _0x1f6c67(_0x5d3830.chatId, async () => {
        const _0x368b9d = _0x494df1(_0x5d3830.chatId);
        if (!_0x368b9d) {
          return false;
        }
        const _0x3cf246 = _0x13b4f9(_0x368b9d.flowId);
        if (!_0x3cf246 || !_0x3cf246.published) {
          await _0x4b4592(_0x368b9d, 'flow removed');
          return false;
        }
        const _0x19d498 = _0x3cf246.published.settings || {};
        const _0x3294c4 = String(_0x5d3830.body || '').trim();
        if (
          matchAny(_0x3294c4, _0x19d498.optOutKeywords || [], 'full', false)
        ) {
          await _0x2a0037.put(
            'chatMemory',
            Object.assign({}, _0x286812(_0x5d3830.chatId), {
              optOut: true,
            }),
          );
          await _0x4b4592(_0x368b9d, 'opted out');
          if (_0x19d498.optOutMessage) {
            await _0x323146(
              _0x368b9d,
              Object.assign(newMessage('none'), {
                text: _0x19d498.optOutMessage,
              }),
            );
          }
          return true;
        }
        for (const _0x181197 of _0x19d498.interruptKeywords || []) {
          if (
            _0x181197.keyword &&
            _0x181197.targetNodeId &&
            matchAny(_0x3294c4, [_0x181197.keyword], 'full', false) &&
            _0x5e3612(_0x3cf246.published, _0x181197.targetNodeId)
          ) {
            _0x368b9d.waiting = null;
            _0x368b9d.status = 'active';
            await _0xf0fe7(_0x368b9d, _0x3cf246, _0x181197.targetNodeId);
            return true;
          }
        }
        if (_0x368b9d.status === 'waiting' && _0x368b9d.waiting) {
          return _0x5ad4e7(_0x368b9d, _0x3cf246, _0x5d3830);
        }
        return true;
      });
    },
    async tick() {
      const _0x124186 = now();
      for (const _0x95a679 of _0x14b7e6()) {
        const _0x390122 = _0x13b4f9(_0x95a679.flowId);
        if (!_0x390122 || !_0x390122.published) {
          await _0x4b4592(_0x95a679, 'flow removed');
          continue;
        }
        const _0x45a0f9 =
          ((_0x390122.published.settings || {}).sessionTtlHours || 24) *
          3600000;
        await _0x1f6c67(_0x95a679.chatId, async () => {
          const _0x1124e5 = _0x2a0037.get('chatSessions', _0x95a679.id);
          if (!_0x1124e5) {
            return;
          }
          if (
            _0x1124e5.status === 'delayed' &&
            _0x1124e5.resumeAt &&
            _0x1124e5.resumeAt <= _0x124186
          ) {
            _0x1124e5.status = 'active';
            const _0x105b17 = _0x1124e5.resumeNode;
            _0x1124e5.resumeAt = 0;
            _0x1124e5.resumeNode = null;
            await _0xf0fe7(_0x1124e5, _0x390122, _0x105b17);
          } else if (
            _0x1124e5.status === 'waiting' &&
            _0x1124e5.waiting &&
            _0x1124e5.waiting.timeoutAt &&
            _0x1124e5.waiting.timeoutAt <= _0x124186
          ) {
            const _0x4a9f9c = _0x3cfa09(
              _0x390122.published,
              _0x1124e5.waiting.nodeId,
              'timeout',
            );
            _0x1124e5.waiting = null;
            _0x1124e5.status = 'active';
            if (_0x4a9f9c) {
              await _0xf0fe7(_0x1124e5, _0x390122, _0x4a9f9c);
            } else {
              await _0x4b4592(_0x1124e5, 'timeout');
            }
          } else if (
            _0x124186 - (_0x1124e5.updatedAt || _0x1124e5.startedAt) >
            _0x45a0f9
          ) {
            await _0x4b4592(_0x1124e5, 'expired');
          }
        });
      }
    },
    async stop(_0x4b5b53, _0x3f2635 = 'stopped by agent') {
      const _0x300b6c = _0x494df1(_0x4b5b53);
      if (_0x300b6c) {
        await _0x4b4592(_0x300b6c, _0x3f2635);
      }
      return !!_0x300b6c;
    },
    async publish(_0x2f6a39) {
      const _0x51f509 = _0x13b4f9(_0x2f6a39);
      if (!_0x51f509) {
        throw new Error('Chatbot not found.');
      }
      const _0x1ca4a2 = validateGraph(_0x51f509.draft);
      if (_0x1ca4a2.length) {
        const _0x3217d3 = new Error(
          'Fix the highlighted problems before publishing.',
        );
        _0x3217d3.problems = _0x1ca4a2;
        throw _0x3217d3;
      }
      return _0x2a0037.patch('chatbots', _0x2f6a39, {
        published: JSON.parse(JSON.stringify(_0x51f509.draft)),
        publishedAt: now(),
      });
    },
  };
  return _0x3b14b0;
}
export async function createSimulator({
  graph: _0x38f8ae,
  flow: _0x48a6ba,
  chatbots = [],
  store: _0x13fa2b,
  crmFactory: _0x2e7198,
  http: _0x2c05ff,
  callApis = false,
  onSay: _0x1a31c2,
  tags = [],
}) {
  let _0xcdc9b = Date.now();
  const _0x2929f8 = 'simulator@c.us';
  const _0x4c986b = _0x2e7198(_0x13fa2b);
  const _0x308d56 = {
    async send(_0x408694, _0x1ebeb5, _0x4ddaa6 = {}) {
      const _0x5b41b2 = Object.assign(
        {},
        _0x4c986b.vars(_0x408694),
        _0x4ddaa6.vars || {},
      );
      for (const _0xc1a70e of [].concat(_0x1ebeb5)) {
        if (_0x1a31c2) {
          _0x1a31c2(
            Object.assign({}, _0xc1a70e, {
              text: renderTemplate(_0xc1a70e.text, _0x5b41b2),
            }),
          );
        }
      }
      return {
        ok: true,
        sent: [].concat(_0x1ebeb5).length,
        failed: 0,
        errors: [],
      };
    },
    isOurs() {
      return false;
    },
  };
  const _0x22e9f8 = {
    async run() {
      return [];
    },
  };
  const _0xce5e97 = callApis
    ? _0x2c05ff
    : {
        async request() {
          const _0x8512f6 = new Error(
            'API calls are switched off in the simulator.',
          );
          throw _0x8512f6;
        },
      };
  const _0x5c8d28 = createChatbotEngine({
    store: _0x13fa2b,
    sender: _0x308d56,
    crm: _0x4c986b,
    wa: {
      resolveTarget: async () => null,
    },
    http: _0xce5e97,
    activity: null,
    webhooks: null,
    actions: _0x22e9f8,
    now: () => _0xcdc9b,
  });
  const _0x15c675 = Object.assign({}, _0x48a6ba, {
    id: _0x48a6ba.id || 'sim',
    enabled: true,
    published: JSON.parse(JSON.stringify(_0x38f8ae)),
  });
  await _0x13fa2b.put('chatbots', _0x15c675);
  for (const _0xcd89fe of chatbots) {
    if (_0xcd89fe.id !== _0x15c675.id) {
      await _0x13fa2b.put('chatbots', _0xcd89fe);
    }
  }
  await _0x13fa2b.put('chatMemory', {
    id: _0x2929f8,
    optOut: false,
    runs: {},
  });
  return {
    engine: _0x5c8d28,
    chatId: _0x2929f8,
    async begin() {
      return _0x5c8d28.start(_0x15c675, _0x2929f8, {
        body: 'start',
        chatId: _0x2929f8,
      });
    },
    async reply(_0x4a1faa) {
      return _0x5c8d28.handleIncoming({
        chatId: _0x2929f8,
        body: _0x4a1faa,
        fromMe: false,
      });
    },
    async advance(_0x1ab9f1) {
      _0xcdc9b += _0x1ab9f1;
      await _0x5c8d28.tick();
    },
    session() {
      return _0x5c8d28.sessionFor(_0x2929f8);
    },
    vars() {
      const _0x5d06fa = _0x5c8d28.sessionFor(_0x2929f8);
      if (_0x5d06fa) {
        return _0x5d06fa.vars;
      } else {
        return {};
      }
    },
  };
}
