import { h, icon, clear } from './dom.js';
import * as _0x263bca from './kit.js';
import {
  newMessage,
  MESSAGE_KINDS,
  BUTTON_TYPES,
  MAX_FILE_BYTES,
  fileKind,
  acceptFor,
  summarizeMessage,
  kindLabel,
  buttonsMode,
} from '../core/messages.js';
import { SYSTEM_VARIABLES } from '../core/variables.js';
import { fileToDataUrl, bytesToSize, clone } from '../core/util.js';
const EMOJIS = [
  '😀',
  '😊',
  '😍',
  '👍',
  '🙏',
  '🎉',
  '🔥',
  '✅',
  '⭐',
  '❤️',
  '😉',
  '🤝',
  '📞',
  '📍',
  '🕘',
  '💬',
  '🛒',
  '🎁',
  '💰',
  '👋',
  '🙌',
  '😅',
  '📢',
  '🚀',
];
function insertAtCaret(_0x504f5a, _0xe20e5d, _0x3116e7 = '') {
  const _0x276c00 = _0x504f5a.selectionStart;
  const _0x50dd11 = _0x504f5a.selectionEnd;
  const _0x2a4899 = _0x504f5a.value.slice(_0x276c00, _0x50dd11);
  _0x504f5a.value =
    _0x504f5a.value.slice(0, _0x276c00) +
    _0xe20e5d +
    _0x2a4899 +
    _0x3116e7 +
    _0x504f5a.value.slice(_0x50dd11);
  const _0x3b9a4d = _0x276c00 + _0xe20e5d.length + _0x2a4899.length;
  _0x504f5a.focus();
  _0x504f5a.setSelectionRange(
    _0x2a4899 ? _0x3b9a4d + _0x3116e7.length : _0x276c00 + _0xe20e5d.length,
    _0x2a4899 ? _0x3b9a4d + _0x3116e7.length : _0x276c00 + _0xe20e5d.length,
  );
  _0x504f5a.dispatchEvent(
    new Event('input', {
      bubbles: true,
    }),
  );
}
function textBox(_0x4e3fe4, _0x1e79ce, _0x10dede) {
  const _0x4f8733 = _0x263bca.textarea({
    value: _0x4e3fe4.text,
    rows: 4,
    placeholder: _0x1e79ce.placeholder || 'Type your message',
    onInput: (_0x39b6b2) => {
      _0x4e3fe4.text = _0x39b6b2;
      _0x10dede();
    },
  });
  const _0x4b6893 = SYSTEM_VARIABLES.concat(
    (_0x1e79ce.extraVariables || []).map((_0x598e7c) => ({
      key: _0x598e7c,
      label: _0x598e7c,
    })),
  );
  const _0x5860e4 = h(
    'div',
    {
      class: 'wc-fmtbar',
    },
    _0x263bca.iconButton('bold', 'Bold', () =>
      insertAtCaret(_0x4f8733, '*', '*'),
    ),
    _0x263bca.iconButton('italic', 'Italic', () =>
      insertAtCaret(_0x4f8733, '_', '_'),
    ),
    _0x263bca.iconButton('strikethrough', 'Strikethrough', () =>
      insertAtCaret(_0x4f8733, '~', '~'),
    ),
    _0x263bca.iconButton('smile', 'Emoji', (_0x4eca1a) => {
      const _0x2b4b28 = h(
        'div',
        {
          class: 'wc-emoji-grid',
        },
        EMOJIS.map((_0x3b475b) =>
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                insertAtCaret(_0x4f8733, _0x3b475b);
              },
            },
            _0x3b475b,
          ),
        ),
      );
      _0x263bca.openPopover(_0x4eca1a.currentTarget, _0x2b4b28, {
        width: 264,
      });
    }),
    _0x263bca.iconButton('variable', 'Insert a variable', (_0x181933) => {
      _0x263bca.openMenu(
        _0x181933.currentTarget,
        _0x4b6893.map((_0x52bd88) => ({
          label: _0x52bd88.label,
          meta: '{{' + _0x52bd88.key + '}}',
          onClick: () => insertAtCaret(_0x4f8733, '{{' + _0x52bd88.key + '}}'),
        })),
        {
          align: 'start',
          width: 300,
        },
      );
    }),
    h(
      'span',
      {
        class: 'wc-muted wc-fmtbar-count',
      },
      '',
    ),
  );
  return h(
    'div',
    {
      class: 'wc-textbox',
    },
    _0x5860e4,
    _0x4f8733,
  );
}
async function attachFiles(_0x386a62, _0x9a7e71, _0x5c285c, _0x5e0287) {
  for (const _0x250eae of _0x5c285c) {
    if (_0x250eae.size > MAX_FILE_BYTES) {
      _0x263bca.toast(
        '"' +
          _0x250eae.name +
          '" is larger than ' +
          bytesToSize(MAX_FILE_BYTES) +
          ', so it was not added.',
        'error',
      );
      continue;
    }
    const _0x14b111 = await fileToDataUrl(_0x250eae);
    const _0x2670fb = await _0x386a62.store.putBlob(_0x14b111, {
      name: _0x250eae.name,
      mime: _0x250eae.type,
      size: _0x250eae.size,
    });
    const _0x4452b6 =
      _0x5e0287 === 'document' ? 'document' : fileKind(_0x250eae.type);
    _0x9a7e71.files.push({
      blobId: _0x2670fb,
      name: _0x250eae.name,
      mime: _0x250eae.type || 'application/octet-stream',
      size: _0x250eae.size,
      kind: _0x4452b6,
      caption: '',
    });
  }
}
async function recordAudio(_0x389903, _0x589e69, _0x43d9e1) {
  let _0x44c92a;
  try {
    _0x44c92a = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  } catch (_0x44c8ce) {
    _0x263bca.toast(
      'Could not use the microphone. Check the browser permission and try again.',
      'error',
    );
    return;
  }
  const _0x237205 = [];
  const _0x360534 = new MediaRecorder(_0x44c92a);
  _0x360534.ondataavailable = (_0x51b1b1) => {
    if (_0x51b1b1.data.size) {
      _0x237205.push(_0x51b1b1.data);
    }
  };
  const _0x210893 = () => {
    if (_0x360534.state !== 'inactive') {
      _0x360534.stop();
    }
  };
  let _0x4bd33d;
  _0x360534.onstop = async () => {
    _0x44c92a.getTracks().forEach((_0x2d45e7) => _0x2d45e7.stop());
    _0x4bd33d.close();
    if (!_0x237205.length) {
      return;
    }
    const _0x10aa00 = new Blob(_0x237205, {
      type: _0x360534.mimeType || 'audio/webm',
    });
    const _0x4d7852 = await fileToDataUrl(_0x10aa00);
    const _0x30a22b = await _0x389903.store.putBlob(_0x4d7852, {
      name: 'voice-note.webm',
      mime: _0x10aa00.type,
      size: _0x10aa00.size,
    });
    _0x589e69.files.push({
      blobId: _0x30a22b,
      name: 'voice-note.webm',
      mime: _0x10aa00.type,
      size: _0x10aa00.size,
      kind: 'audio',
      ptt: true,
      caption: '',
    });
    _0x43d9e1();
  };
  _0x4bd33d = _0x263bca.openModal({
    title: 'Recording...',
    width: 360,
    dismissable: false,
    body: h(
      'div',
      {
        class: 'wc-recording',
      },
      h('span', {
        class: 'wc-rec-dot',
      }),
      h('span', null, 'Speak now. Press stop when you are done.'),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x263bca.button('Discard', {
        variant: 'dark',
        onClick: () => {
          _0x237205.length = 0;
          _0x210893();
        },
      }),
      _0x263bca.button('Stop and save', {
        variant: 'primary',
        icon: 'circle-stop',
        onClick: _0x210893,
      }),
    ),
  });
  _0x360534.start();
}
function filesEditor(_0x4d9756, _0x4a4cc7, _0x41eb9d, _0x3bee75) {
  const _0x2ddc40 = h('div', {
    class: 'wc-attach',
  });
  const _0x9531ca = acceptFor(_0x4a4cc7.kind);
  const _0x46bfe3 = h(
    'div',
    {
      class: 'wc-attach-list',
    },
    _0x4a4cc7.files.map((_0x4d2163, _0x5f25e7) =>
      h(
        'div',
        {
          class: 'wc-attach-item',
        },
        h(
          'span',
          {
            class: 'wc-attach-icon',
          },
          icon(
            _0x4d2163.kind === 'image'
              ? 'image'
              : _0x4d2163.kind === 'video'
                ? 'video'
                : _0x4d2163.kind === 'audio'
                  ? 'mic'
                  : 'file-text',
            18,
          ),
        ),
        h(
          'div',
          {
            class: 'wc-attach-main',
          },
          h('strong', null, _0x4d2163.name),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            '' +
              bytesToSize(_0x4d2163.size) +
              (_0x4d2163.ptt ? ' · voice note' : ''),
          ),
          _0x4a4cc7.kind === 'media'
            ? _0x263bca.input({
                value: _0x4d2163.caption,
                placeholder: 'Caption for this file (optional)',
                onInput: (_0x822aad) => {
                  _0x4d2163.caption = _0x822aad;
                  _0x3bee75();
                },
              })
            : null,
        ),
        _0x263bca.iconButton(
          'trash-2',
          'Remove file',
          () => {
            _0x4d9756.store.removeBlob(_0x4d2163.blobId);
            _0x4a4cc7.files.splice(_0x5f25e7, 1);
            _0x3bee75();
            _0x41eb9d();
          },
          'is-danger',
        ),
      ),
    ),
  );
  const _0x2a5197 = h(
    'button',
    {
      type: 'button',
      class: 'wc-dropzone',
      onClick: async () => {
        const _0xc4b9c8 = await _0x263bca.pickFiles(_0x9531ca, true);
        await attachFiles(_0x4d9756, _0x4a4cc7, _0xc4b9c8, _0x4a4cc7.kind);
        _0x3bee75();
        _0x41eb9d();
      },
    },
    icon('upload', 20),
    h(
      'strong',
      null,
      _0x4a4cc7.kind === 'audio'
        ? 'Add an audio file'
        : _0x4a4cc7.kind === 'document'
          ? 'Add documents'
          : 'Add images or videos',
    ),
    h(
      'span',
      {
        class: 'wc-muted',
      },
      'Click to browse. Up to ' + bytesToSize(MAX_FILE_BYTES) + ' each.',
    ),
  );
  _0x2ddc40.appendChild(_0x46bfe3);
  _0x2ddc40.appendChild(_0x2a5197);
  if (_0x4a4cc7.kind === 'audio' && typeof MediaRecorder !== 'undefined') {
    _0x2ddc40.appendChild(
      _0x263bca.button('Record a voice note', {
        icon: 'mic',
        size: 'sm',
        onClick: () =>
          recordAudio(_0x4d9756, _0x4a4cc7, () => {
            _0x3bee75();
            _0x41eb9d();
          }),
      }),
    );
  }
  return _0x2ddc40;
}
function contactsEditor(_0x41d367, _0x3fcf36, _0x17c173) {
  return h(
    'div',
    {
      class: 'wc-stack',
    },
    _0x41d367.contacts.map((_0x26c685, _0x23687a) =>
      h(
        'div',
        {
          class: 'wc-form-row wc-row-remove',
        },
        _0x263bca.input({
          value: _0x26c685.name,
          placeholder: 'Contact name',
          onInput: (_0x32f491) => {
            _0x26c685.name = _0x32f491;
            _0x17c173();
          },
        }),
        _0x263bca.input({
          value: _0x26c685.phone,
          placeholder: 'Phone with country code',
          onInput: (_0x37a124) => {
            _0x26c685.phone = _0x37a124;
            _0x17c173();
          },
        }),
        _0x263bca.iconButton(
          'trash-2',
          'Remove contact',
          () => {
            _0x41d367.contacts.splice(_0x23687a, 1);
            _0x17c173();
            _0x3fcf36();
          },
          'is-danger',
        ),
      ),
    ),
    _0x263bca.button('Add contact', {
      icon: 'user-plus',
      size: 'sm',
      onClick: () => {
        _0x41d367.contacts.push({
          name: '',
          phone: '',
        });
        _0x17c173();
        _0x3fcf36();
      },
    }),
  );
}
function pollEditor(_0x181ec7, _0x25c49c, _0x369fcd) {
  const _0x42ace9 = _0x181ec7.poll;
  return h(
    'div',
    {
      class: 'wc-stack',
    },
    _0x263bca.field(
      'Question',
      _0x263bca.input({
        value: _0x42ace9.question,
        placeholder: 'Ask something',
        onInput: (_0x4fef2d) => {
          _0x42ace9.question = _0x4fef2d;
          _0x369fcd();
        },
      }),
    ),
    _0x42ace9.options.map((_0x2567cf, _0x5c2946) =>
      h(
        'div',
        {
          class: 'wc-form-row wc-row-remove',
        },
        _0x263bca.input({
          value: _0x2567cf,
          placeholder: 'Option ' + (_0x5c2946 + 1),
          onInput: (_0x48b8e2) => {
            _0x42ace9.options[_0x5c2946] = _0x48b8e2;
            _0x369fcd();
          },
        }),
        _0x42ace9.options.length > 2
          ? _0x263bca.iconButton(
              'trash-2',
              'Remove option',
              () => {
                _0x42ace9.options.splice(_0x5c2946, 1);
                _0x369fcd();
                _0x25c49c();
              },
              'is-danger',
            )
          : h('span'),
      ),
    ),
    _0x42ace9.options.length < 12
      ? _0x263bca.button('Add option', {
          icon: 'plus',
          size: 'sm',
          onClick: () => {
            _0x42ace9.options.push('');
            _0x369fcd();
            _0x25c49c();
          },
        })
      : h(
          'span',
          {
            class: 'wc-muted',
          },
          'Maximum of 12 options reached.',
        ),
    _0x263bca.checkbox(
      _0x42ace9.multi,
      (_0x22404f) => {
        _0x42ace9.multi = _0x22404f;
        _0x369fcd();
      },
      'Allow multiple answers',
    ),
  );
}
function listEditor(_0xd6a1fe, _0xf47a0c, _0x128dc0) {
  const _0x54a62a = _0xd6a1fe.list;
  return h(
    'div',
    {
      class: 'wc-stack',
    },
    _0x263bca.row(
      _0x263bca.field(
        'Title (optional)',
        _0x263bca.input({
          value: _0x54a62a.title,
          onInput: (_0x3383bd) => {
            _0x54a62a.title = _0x3383bd;
            _0x128dc0();
          },
        }),
      ),
      _0x263bca.field(
        'Button text',
        _0x263bca.input({
          value: _0x54a62a.buttonText,
          onInput: (_0x49293f) => {
            _0x54a62a.buttonText = _0x49293f;
            _0x128dc0();
          },
        }),
      ),
    ),
    _0x263bca.field(
      'Footer (optional)',
      _0x263bca.input({
        value: _0x54a62a.footer,
        onInput: (_0x3552ac) => {
          _0x54a62a.footer = _0x3552ac;
          _0x128dc0();
        },
      }),
    ),
    _0x54a62a.sections.map((_0x39f4ef, _0x4864dc) =>
      h(
        'div',
        {
          class: 'wc-subcard',
        },
        h(
          'div',
          {
            class: 'wc-row-remove wc-form-row',
          },
          _0x263bca.field(
            'Section ' + (_0x4864dc + 1) + ' name',
            _0x263bca.input({
              value: _0x39f4ef.title,
              onInput: (_0x10f36b) => {
                _0x39f4ef.title = _0x10f36b;
                _0x128dc0();
              },
            }),
          ),
          _0x54a62a.sections.length > 1
            ? _0x263bca.iconButton(
                'trash-2',
                'Remove section',
                () => {
                  _0x54a62a.sections.splice(_0x4864dc, 1);
                  _0x128dc0();
                  _0xf47a0c();
                },
                'is-danger',
              )
            : h('span'),
        ),
        _0x39f4ef.rows.map((_0x158c3f, _0x4f1cf8) =>
          h(
            'div',
            {
              class: 'wc-form-row wc-row-remove',
            },
            _0x263bca.input({
              value: _0x158c3f.title,
              placeholder: 'Row title',
              onInput: (_0x32a258) => {
                _0x158c3f.title = _0x32a258;
                _0x128dc0();
              },
            }),
            _0x263bca.input({
              value: _0x158c3f.description,
              placeholder: 'Description (optional)',
              onInput: (_0x2da538) => {
                _0x158c3f.description = _0x2da538;
                _0x128dc0();
              },
            }),
            _0x39f4ef.rows.length > 1
              ? _0x263bca.iconButton(
                  'trash-2',
                  'Remove row',
                  () => {
                    _0x39f4ef.rows.splice(_0x4f1cf8, 1);
                    _0x128dc0();
                    _0xf47a0c();
                  },
                  'is-danger',
                )
              : h('span'),
          ),
        ),
        _0x263bca.button('Add row', {
          icon: 'plus',
          size: 'sm',
          onClick: () => {
            _0x39f4ef.rows.push({
              title: '',
              description: '',
            });
            _0x128dc0();
            _0xf47a0c();
          },
        }),
      ),
    ),
    _0x263bca.button('Add section', {
      icon: 'plus',
      size: 'sm',
      onClick: () => {
        _0x54a62a.sections.push({
          title: '',
          rows: [
            {
              title: '',
              description: '',
            },
          ],
        });
        _0x128dc0();
        _0xf47a0c();
      },
    }),
    _0x263bca.banner(
      'Lists appear as a numbered menu in groups and whenever WhatsApp cannot show them. Customers can reply with the number.',
      'info',
    ),
  );
}
function buttonsHint(_0x467f14, _0x5ea3eb) {
  const _0x3b70b5 = _0x467f14.items.filter((_0x4c9881) =>
    _0x4c9881.text.trim(),
  );
  const _0x59645b = _0x3b70b5.filter(
    (_0x3d2efc) => _0x3d2efc.type === 'reply',
  ).length;
  const _0x11caa0 = _0x3b70b5.length - _0x59645b;
  if (_0x5ea3eb === 'text') {
    if (_0x11caa0) {
      return _0x263bca.banner(
        'Link, call and copy buttons are written as lines under the numbered menu.',
        'warn',
      );
    } else {
      return null;
    }
  }
  if (_0x5ea3eb === 'native') {
    if (_0x59645b && _0x11caa0) {
      return _0x263bca.banner(
        'WhatsApp does not allow reply buttons together with link, call or copy buttons. The reply buttons are shown as buttons and the others are written as lines under the message.',
        'warn',
      );
    }
    if (Math.max(_0x59645b, _0x11caa0) > 3) {
      return _0x263bca.banner(
        'WhatsApp shows at most three buttons. With more, the whole message is sent as a numbered menu.',
        'warn',
      );
    }
    return null;
  }
  if (_0x59645b > 10) {
    return _0x263bca.banner(
      'A WhatsApp list holds at most ten options. With more, the whole message is sent as a numbered menu.',
      'warn',
    );
  }
  if (_0x11caa0) {
    return _0x263bca.banner(
      _0x59645b
        ? 'Link, call and copy buttons cannot be options in a list. They are written as lines under the message.'
        : 'A list needs at least one reply button. Link, call and copy buttons alone are written as lines under the message.',
      'warn',
    );
  }
  return null;
}
const BUTTONS_INFO = {
  list: 'Reply buttons are sent as a WhatsApp list: the customer taps "Choose an option" and picks one. WhatsApp Web cannot deliver real buttons to most accounts, and a list reaches every customer. In groups, or if WhatsApp does not accept the list, it goes as a numbered menu.',
  text: 'Buttons are sent as a numbered text menu, as chosen in Module settings.',
  native:
    'Real buttons are switched on in Module settings. WhatsApp often shows them on your screen with one tick and never delivers them, so send one to your own number first. Groups and anything WhatsApp refuses go as a numbered menu.',
};
function buttonsEditor(_0x58418b, _0x47f0f6, _0x482fef, _0x57a7d9) {
  const _0x448e2e = _0x58418b.buttons;
  const _0x1897f1 = h('div');
  const _0x110ef6 = () => {
    clear(_0x1897f1);
    const _0x3a1721 = buttonsHint(_0x448e2e, _0x57a7d9);
    if (_0x3a1721) {
      _0x1897f1.appendChild(_0x3a1721);
    }
  };
  const _0x5b3aab = () => {
    _0x482fef();
    _0x110ef6();
  };
  _0x110ef6();
  return h(
    'div',
    {
      class: 'wc-stack',
    },
    _0x448e2e.items.map((_0x2da1ba, _0x350e31) =>
      h(
        'div',
        {
          class: 'wc-form-row wc-row-remove wc-row-3',
        },
        _0x263bca.select(
          BUTTON_TYPES.map((_0x818ff2) => ({
            value: _0x818ff2.id,
            label: _0x818ff2.label,
          })),
          _0x2da1ba.type,
          (_0x5a554f) => {
            _0x2da1ba.type = _0x5a554f;
            _0x5b3aab();
            _0x47f0f6();
          },
        ),
        _0x263bca.input({
          value: _0x2da1ba.text,
          placeholder: 'Button text',
          onInput: (_0x185483) => {
            _0x2da1ba.text = _0x185483;
            _0x5b3aab();
          },
        }),
        _0x2da1ba.type === 'reply'
          ? h('span')
          : _0x263bca.input({
              value: _0x2da1ba.value,
              placeholder:
                _0x2da1ba.type === 'url'
                  ? 'https://example.com'
                  : _0x2da1ba.type === 'call'
                    ? 'Phone number'
                    : 'Code to copy',
              onInput: (_0x306a9d) => {
                _0x2da1ba.value = _0x306a9d;
                _0x5b3aab();
              },
            }),
        _0x448e2e.items.length > 1
          ? _0x263bca.iconButton(
              'trash-2',
              'Remove button',
              () => {
                _0x448e2e.items.splice(_0x350e31, 1);
                _0x5b3aab();
                _0x47f0f6();
              },
              'is-danger',
            )
          : h('span'),
      ),
    ),
    _0x448e2e.items.length < 10
      ? _0x263bca.button('Add button', {
          icon: 'plus',
          size: 'sm',
          onClick: () => {
            _0x448e2e.items.push({
              type: 'reply',
              text: '',
              value: '',
            });
            _0x5b3aab();
            _0x47f0f6();
          },
        })
      : null,
    _0x263bca.field(
      'Footer (optional)',
      _0x263bca.input({
        value: _0x448e2e.footer,
        onInput: (_0x3c191b) => {
          _0x448e2e.footer = _0x3c191b;
          _0x5b3aab();
        },
      }),
    ),
    _0x1897f1,
    _0x263bca.banner(BUTTONS_INFO[_0x57a7d9], 'info'),
  );
}
function delayRow(_0x365b17, _0x2bb79e) {
  const _0x200995 = _0x365b17.delay;
  const _0x52fd12 = h(
    'span',
    {
      class: 'wc-field-hint wc-warn-text',
    },
    '',
  );
  const _0x45e9e2 = () => {
    _0x52fd12.textContent =
      _0x200995.max > 0 && _0x200995.min < 3
        ? 'Setting a delay below 3 seconds may cause WhatsApp to flag rapid sending.'
        : '';
  };
  _0x45e9e2();
  return h(
    'div',
    {
      class: 'wc-delay',
    },
    h(
      'span',
      {
        class: 'wc-field-label',
      },
      'Wait before sending this message',
    ),
    h(
      'div',
      {
        class: 'wc-form-row',
      },
      _0x263bca.field(
        'Minimum seconds',
        _0x263bca.input({
          type: 'number',
          value: _0x200995.min,
          min: 0,
          onInput: (_0x4eb1fb) => {
            _0x200995.min = Number(_0x4eb1fb) || 0;
            if (_0x200995.max < _0x200995.min) {
              _0x200995.max = _0x200995.min;
            }
            _0x2bb79e();
            _0x45e9e2();
          },
        }),
      ),
      _0x263bca.field(
        'Maximum seconds',
        _0x263bca.input({
          type: 'number',
          value: _0x200995.max,
          min: 0,
          onInput: (_0x2eef1c) => {
            _0x200995.max = Number(_0x2eef1c) || 0;
            _0x2bb79e();
            _0x45e9e2();
          },
        }),
      ),
    ),
    _0x52fd12,
  );
}
export function messageEditor(_0x7f5322) {
  const { app: _0x44f841 } = _0x7f5322;
  const _0x1a2cdd = _0x7f5322.messages;
  const _0xb85368 = h('div', {
    class: 'wc-msgs',
  });
  const _0xa34a8a = new Set();
  const _0x14cd1d = () => _0x7f5322.onChange && _0x7f5322.onChange(_0x1a2cdd);
  const _0x1a80fd = _0x7f5322.single ? 1 : _0x7f5322.maxMessages || 10;
  function _0x27cf0f(_0x15f0ff, _0x5be3b8) {
    const _0x16ac40 = () => _0x4c07f3();
    const _0x113349 = !_0xa34a8a.has(_0x15f0ff.id);
    const _0x507042 = h(
      'div',
      {
        class: 'wc-msg-head',
      },
      _0x7f5322.single
        ? h('strong', null, 'Message')
        : h(
            'span',
            {
              class: 'wc-msg-num',
            },
            String(_0x5be3b8 + 1),
          ),
      h(
        'div',
        {
          class: 'wc-msg-kind',
        },
        _0x263bca.select(
          MESSAGE_KINDS.map((_0x1114a4) => ({
            value: _0x1114a4.id,
            label: _0x1114a4.label,
          })),
          _0x15f0ff.kind,
          (_0x4ec34f) => {
            _0x15f0ff.kind = _0x4ec34f;
            if (['media', 'document', 'audio'].includes(_0x4ec34f)) {
              _0x15f0ff.files = _0x15f0ff.files.filter((_0x5e8a99) =>
                _0x4ec34f === 'audio'
                  ? _0x5e8a99.kind === 'audio'
                  : _0x4ec34f === 'document'
                    ? true
                    : _0x5e8a99.kind !== 'audio',
              );
            }
            _0x14cd1d();
            _0x16ac40();
          },
          {
            label: 'Message type',
          },
        ),
      ),
      h(
        'span',
        {
          class: 'wc-msg-summary',
        },
        _0x113349 ? '' : summarizeMessage(_0x15f0ff),
      ),
      h(
        'div',
        {
          class: 'wc-row-actions',
        },
        _0x7f5322.single
          ? null
          : _0x263bca.iconButton('chevron-up', 'Move up', () => {
              if (_0x5be3b8 > 0) {
                [_0x1a2cdd[_0x5be3b8 - 1], _0x1a2cdd[_0x5be3b8]] = [
                  _0x1a2cdd[_0x5be3b8],
                  _0x1a2cdd[_0x5be3b8 - 1],
                ];
                _0x14cd1d();
                _0x4c07f3();
              }
            }),
        _0x7f5322.single
          ? null
          : _0x263bca.iconButton('chevron-down', 'Move down', () => {
              if (_0x5be3b8 < _0x1a2cdd.length - 1) {
                [_0x1a2cdd[_0x5be3b8 + 1], _0x1a2cdd[_0x5be3b8]] = [
                  _0x1a2cdd[_0x5be3b8],
                  _0x1a2cdd[_0x5be3b8 + 1],
                ];
                _0x14cd1d();
                _0x4c07f3();
              }
            }),
        _0x7f5322.single
          ? null
          : _0x263bca.iconButton(
              _0x113349 ? 'minimize' : 'maximize',
              _0x113349 ? 'Collapse' : 'Expand',
              () => {
                if (_0x113349) {
                  _0xa34a8a.add(_0x15f0ff.id);
                } else {
                  _0xa34a8a.delete(_0x15f0ff.id);
                }
                _0x4c07f3();
              },
            ),
        _0x7f5322.single
          ? null
          : _0x263bca.iconButton('copy', 'Duplicate message', () => {
              const _0x37c8f8 = clone(_0x15f0ff);
              _0x37c8f8.id = Math.random().toString(36).slice(2);
              _0x1a2cdd.splice(_0x5be3b8 + 1, 0, _0x37c8f8);
              _0x14cd1d();
              _0x4c07f3();
            }),
        !_0x7f5322.single && _0x1a2cdd.length > 1
          ? _0x263bca.iconButton(
              'trash-2',
              'Remove message',
              async () => {
                if (
                  await _0x263bca.confirmDialog('Remove this message?', {
                    danger: true,
                    confirmLabel: 'Remove',
                  })
                ) {
                  _0x1a2cdd.splice(_0x5be3b8, 1);
                  _0x14cd1d();
                  _0x4c07f3();
                }
              },
              'is-danger',
            )
          : null,
      ),
    );
    const _0x38856e = h('div', {
      class: 'wc-msg-body',
    });
    if (_0x113349) {
      const _0x1c6de1 = {
        none: 'Message',
        media: 'Caption',
        document: 'Message',
        audio: 'Message',
        contact: 'Message',
        poll: 'Message',
        list: 'Message above the list',
        buttons: 'Message above the buttons',
      }[_0x15f0ff.kind];
      if (
        _0x15f0ff.kind === 'media' ||
        _0x15f0ff.kind === 'document' ||
        _0x15f0ff.kind === 'audio'
      ) {
        _0x38856e.appendChild(
          filesEditor(_0x44f841, _0x15f0ff, _0x16ac40, _0x14cd1d),
        );
      }
      _0x38856e.appendChild(
        _0x263bca.field(
          _0x1c6de1 + (['none'].includes(_0x15f0ff.kind) ? '' : ' (optional)'),
          textBox(_0x15f0ff, _0x7f5322, _0x14cd1d),
        ),
      );
      if (_0x15f0ff.kind === 'contact') {
        _0x38856e.appendChild(contactsEditor(_0x15f0ff, _0x16ac40, _0x14cd1d));
      }
      if (_0x15f0ff.kind === 'poll') {
        _0x38856e.appendChild(pollEditor(_0x15f0ff, _0x16ac40, _0x14cd1d));
      }
      if (_0x15f0ff.kind === 'list') {
        _0x38856e.appendChild(listEditor(_0x15f0ff, _0x16ac40, _0x14cd1d));
      }
      if (_0x15f0ff.kind === 'buttons') {
        _0x38856e.appendChild(
          buttonsEditor(
            _0x15f0ff,
            _0x16ac40,
            _0x14cd1d,
            buttonsMode(_0x44f841.store.setting('buttonsMode')),
          ),
        );
      }
      if (_0x7f5322.allowDelay && !_0x7f5322.single && _0x5be3b8 >= 0) {
        _0x38856e.appendChild(delayRow(_0x15f0ff, _0x14cd1d));
      }
    }
    return h(
      'div',
      {
        class: 'wc-msg wc-card',
      },
      _0x507042,
      _0x113349 ? _0x38856e : null,
    );
  }
  function _0x50e4ae(_0x3670ff) {
    const _0x5f0b62 = _0x44f841.store.all('templates');
    if (!_0x5f0b62.length) {
      _0x263bca.toast(
        'You have no templates yet. Create some in Templates first.',
        'info',
      );
      return;
    }
    _0x263bca.openMenu(
      _0x3670ff,
      _0x5f0b62.map((_0x14d653) => ({
        label: _0x14d653.title,
        meta: kindLabel(_0x14d653.message.kind),
        onClick: () => {
          const _0x2c352c = clone(_0x14d653.message);
          _0x2c352c.id = Math.random().toString(36).slice(2);
          const _0x57810b = _0x1a2cdd[_0x1a2cdd.length - 1];
          if (
            _0x57810b &&
            _0x57810b.kind === 'none' &&
            !String(_0x57810b.text || '').trim()
          ) {
            _0x1a2cdd[_0x1a2cdd.length - 1] = _0x2c352c;
          } else {
            _0x1a2cdd.push(_0x2c352c);
          }
          _0x14cd1d();
          _0x4c07f3();
        },
      })),
      {
        align: 'start',
        width: 320,
      },
    );
  }
  function _0x4c07f3() {
    clear(_0xb85368);
    _0x1a2cdd.forEach((_0x146005, _0x7a3a39) =>
      _0xb85368.appendChild(_0x27cf0f(_0x146005, _0x7a3a39)),
    );
    if (!_0x7f5322.single) {
      _0xb85368.appendChild(
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x1a2cdd.length < _0x1a80fd
            ? _0x263bca.button('Add message', {
                icon: 'plus',
                size: 'sm',
                onClick: () => {
                  _0x1a2cdd.push(newMessage('none'));
                  _0x14cd1d();
                  _0x4c07f3();
                },
              })
            : h(
                'span',
                {
                  class: 'wc-muted',
                },
                'Maximum of ' + _0x1a80fd + ' messages reached.',
              ),
          _0x7f5322.templates === false
            ? null
            : _0x263bca.button('Use a template', {
                icon: 'layout-template',
                size: 'sm',
                onClick: (_0x26f6e4) => _0x50e4ae(_0x26f6e4.currentTarget),
              }),
        ),
      );
    }
  }
  _0x4c07f3();
  _0xb85368.repaint = _0x4c07f3;
  return _0xb85368;
}
export function formattedTextarea({
  value: _0x14ee6f,
  onInput: _0x46d4c5,
  extraVariables: _0x1ad6e1,
  placeholder: _0x7d5193,
  rows: _0x5a1ffb,
}) {
  const _0x181ce = {
    text: _0x14ee6f || '',
  };
  const _0x5f1466 = textBox(
    _0x181ce,
    {
      placeholder: _0x7d5193,
      extraVariables: _0x1ad6e1,
    },
    () => _0x46d4c5(_0x181ce.text),
  );
  if (_0x5a1ffb) {
    _0x5f1466.querySelector('textarea').rows = _0x5a1ffb;
  }
  return _0x5f1466;
}
export function mediaPicker(
  _0x1c89d3,
  { kind: _0x306d4f, files: _0x1f8493, onChange: _0x133467 },
) {
  const _0x918574 = {
    kind:
      _0x306d4f === 'document'
        ? 'document'
        : _0x306d4f === 'audio'
          ? 'audio'
          : 'media',
    files: (_0x1f8493 || []).slice(),
  };
  const _0x5dafc4 = h('div');
  const _0x2a2a32 = () => {
    clear(_0x5dafc4);
    _0x5dafc4.appendChild(
      filesEditor(_0x1c89d3, _0x918574, _0x2a2a32, () =>
        _0x133467(_0x918574.files.slice()),
      ),
    );
  };
  _0x2a2a32();
  return _0x5dafc4;
}
