import { uid, truncate, digits } from './util.js';
export const MESSAGE_KINDS = [
  {
    id: 'none',
    label: 'Message',
    icon: 'message-square-text',
  },
  {
    id: 'media',
    label: 'Message + Images / Videos',
    icon: 'image',
  },
  {
    id: 'document',
    label: 'Message + Documents',
    icon: 'file-text',
  },
  {
    id: 'audio',
    label: 'Message + Audio',
    icon: 'mic',
  },
  {
    id: 'contact',
    label: 'Message + Contacts',
    icon: 'contact-round',
  },
  {
    id: 'poll',
    label: 'Message + Poll',
    icon: 'list-checks',
  },
  {
    id: 'list',
    label: 'Message + List',
    icon: 'list',
  },
  {
    id: 'buttons',
    label: 'Message + Buttons',
    icon: 'mouse-pointer-click',
  },
];
export const BUTTON_TYPES = [
  {
    id: 'reply',
    label: 'Quick reply',
  },
  {
    id: 'url',
    label: 'Open link',
  },
  {
    id: 'call',
    label: 'Call number',
  },
  {
    id: 'copy',
    label: 'Copy code',
  },
];
export const MAX_FILE_BYTES = 16777216;
export function newMessage(_0x23325a = 'none') {
  return {
    id: uid('m'),
    kind: _0x23325a,
    text: '',
    files: [],
    contacts: [],
    poll: {
      question: '',
      options: ['', ''],
      multi: false,
    },
    list: {
      title: '',
      description: '',
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
    },
    buttons: {
      footer: '',
      items: [
        {
          type: 'reply',
          text: '',
          value: '',
        },
      ],
    },
    delay: {
      min: 0,
      max: 0,
    },
  };
}
export function fileKind(_0x27d8e9) {
  const _0x45b7c8 = String(_0x27d8e9 || '');
  if (_0x45b7c8.startsWith('image/')) {
    return 'image';
  }
  if (_0x45b7c8.startsWith('video/')) {
    return 'video';
  }
  if (_0x45b7c8.startsWith('audio/')) {
    return 'audio';
  }
  return 'document';
}
export function acceptFor(_0x37372a) {
  if (_0x37372a === 'media') {
    return 'image/*,video/*';
  }
  if (_0x37372a === 'audio') {
    return 'audio/*';
  }
  return '';
}
export function validateMessage(_0x3651b8) {
  const _0x3b4e9e = [];
  const _0x3dad28 = (_0x3651b8.text || '').trim();
  switch (_0x3651b8.kind) {
    case 'none':
      if (!_0x3dad28) {
        _0x3b4e9e.push('Message text is required.');
      }
      break;
    case 'media':
    case 'document':
    case 'audio':
      if (!_0x3651b8.files.length) {
        _0x3b4e9e.push('Attach at least one file.');
      }
      break;
    case 'contact':
      if (!_0x3651b8.contacts.length) {
        _0x3b4e9e.push('Add at least one contact.');
      } else if (
        _0x3651b8.contacts.some((_0x4f7da4) => !digits(_0x4f7da4.phone))
      ) {
        _0x3b4e9e.push('Every contact needs a phone number.');
      }
      break;
    case 'poll': {
      const _0x2c9c37 = _0x3651b8.poll.options
        .map((_0x45ac5) => _0x45ac5.trim())
        .filter(Boolean);
      if (!_0x3651b8.poll.question.trim()) {
        _0x3b4e9e.push('The poll needs a question.');
      }
      if (_0x2c9c37.length < 2) {
        _0x3b4e9e.push('A poll needs at least two options.');
      }
      if (
        new Set(_0x2c9c37.map((_0x45a782) => _0x45a782.toLowerCase())).size !==
        _0x2c9c37.length
      ) {
        _0x3b4e9e.push('Poll options must be different.');
      }
      break;
    }
    case 'list': {
      if (!_0x3dad28 && !_0x3651b8.list.description.trim()) {
        _0x3b4e9e.push('The list needs a message.');
      }
      if (!_0x3651b8.list.buttonText.trim()) {
        _0x3b4e9e.push('The list needs a button text.');
      }
      const _0x628e0a = _0x3651b8.list.sections.reduce(
        (_0x441cfc, _0x1c393a) =>
          _0x441cfc +
          _0x1c393a.rows.filter((_0x1acf63) => _0x1acf63.title.trim()).length,
        0,
      );
      if (!_0x628e0a) {
        _0x3b4e9e.push('Add at least one list row.');
      }
      break;
    }
    case 'buttons': {
      if (!_0x3dad28) {
        _0x3b4e9e.push('The message above the buttons is required.');
      }
      const _0x400490 = _0x3651b8.buttons.items.filter((_0x45d8ca) =>
        _0x45d8ca.text.trim(),
      );
      if (!_0x400490.length) {
        _0x3b4e9e.push('Add at least one button.');
      }
      if (
        _0x400490.some(
          (_0x261216) =>
            ['url', 'call', 'copy'].includes(_0x261216.type) &&
            !String(_0x261216.value || '').trim(),
        )
      ) {
        _0x3b4e9e.push('Link, call and copy buttons need a value.');
      }
      break;
    }
    default:
      break;
  }
  return _0x3b4e9e;
}
export function summarizeMessage(_0x2f3715) {
  const _0x47c718 = truncate(
    (_0x2f3715.text || '').replace(/\s+/g, ' ').trim(),
    80,
  );
  switch (_0x2f3715.kind) {
    case 'media':
    case 'document':
    case 'audio':
      return (
        _0x2f3715.files.length +
        ' file' +
        (_0x2f3715.files.length === 1 ? '' : 's') +
        (_0x47c718 ? ' · ' + _0x47c718 : '')
      );
    case 'contact':
      return (
        _0x2f3715.contacts.length +
        ' contact' +
        (_0x2f3715.contacts.length === 1 ? '' : 's') +
        (_0x47c718 ? ' · ' + _0x47c718 : '')
      );
    case 'poll':
      return 'Poll: ' + truncate(_0x2f3715.poll.question, 60);
    case 'list':
      return (
        'List: ' + truncate(_0x2f3715.list.description || _0x2f3715.text, 60)
      );
    case 'buttons':
      return _0x2f3715.buttons.items.length + ' buttons · ' + _0x47c718;
    default:
      return _0x47c718 || '(empty)';
  }
}
export function kindLabel(_0x924a0e) {
  const _0x262dbe = MESSAGE_KINDS.find(
    (_0x90915c) => _0x90915c.id === _0x924a0e,
  );
  if (_0x262dbe) {
    return _0x262dbe.label;
  } else {
    return 'Message';
  }
}
export function buttonsMode(_0xb11e1d) {
  if (_0xb11e1d === 'native' || _0xb11e1d === 'text') {
    return _0xb11e1d;
  } else {
    return 'list';
  }
}
export function menuText(_0x3ac0ad, _0x1b1ac7, _0xae2584) {
  const _0x3cf808 = _0x1b1ac7.map(
    (_0x139f0e, _0x2086f9) => _0x2086f9 + 1 + '. ' + _0x139f0e,
  );
  return [
    _0x3ac0ad && _0x3ac0ad.trim(),
    _0x3cf808.join('\n'),
    _0xae2584 ||
      (_0x1b1ac7.length
        ? 'Reply with ' +
          (_0x1b1ac7.length === 1 ? '1' : '1 to ' + _0x1b1ac7.length) +
          '.'
        : ''),
  ]
    .filter(Boolean)
    .join('\n\n');
}
export function parseMenuChoice(_0x2b7d72, _0x49a083) {
  const _0x174901 = String(_0x2b7d72 || '')
    .trim()
    .toLowerCase();
  if (!_0x174901) {
    return -1;
  }
  const _0x1d7f23 = _0x174901.match(/^(\d{1,2})[.)]?$/);
  if (_0x1d7f23) {
    const _0x4690db = parseInt(_0x1d7f23[1], 10) - 1;
    if (_0x4690db >= 0 && _0x4690db < _0x49a083.length) {
      return _0x4690db;
    } else {
      return -1;
    }
  }
  const _0x2afb40 = _0x49a083.findIndex(
    (_0x256688) => String(_0x256688).trim().toLowerCase() === _0x174901,
  );
  if (_0x2afb40 >= 0) {
    return _0x2afb40;
  }
  const _0x54d3ee = _0x49a083.findIndex(
    (_0xdf2cde) =>
      String(_0xdf2cde).trim().toLowerCase().startsWith(_0x174901) &&
      _0x174901.length >= 3,
  );
  return _0x54d3ee;
}
