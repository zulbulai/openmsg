import * as _0x3be07b from '../ui/kit.js';
import { newMessage, summarizeMessage } from '../core/messages.js';
import { renderTemplate } from '../core/variables.js';
import { clone } from '../core/util.js';
export function newQuickReply() {
  return {
    title: '',
    shortcut: '',
    pinned: false,
    editBeforeSend: false,
    confirmBeforeSend: false,
    mentionAll: false,
    enabled: true,
    funnel: false,
    delay: {
      min: 3,
      max: 6,
    },
    messages: [newMessage('none')],
    post: null,
  };
}
export function validateQuickReply(_0x2ee0b7, _0x56246b) {
  if (!String(_0x2ee0b7.title || '').trim()) {
    return 'Title is required.';
  }
  if (_0x2ee0b7.title.length > 80) {
    return 'Title is too long.';
  }
  const _0x302c0d = String(_0x2ee0b7.shortcut || '').trim();
  if (_0x302c0d && !/^[a-z0-9_-]{1,24}$/i.test(_0x302c0d)) {
    return 'The shortcut can only use letters, numbers, dashes and underscores.';
  }
  if (
    _0x302c0d &&
    _0x56246b.some(
      (_0x4bde38) =>
        _0x4bde38.id !== _0x2ee0b7.id &&
        String(_0x4bde38.shortcut || '').toLowerCase() ===
          _0x302c0d.toLowerCase(),
    )
  ) {
    return 'Another canned response already uses that shortcut.';
  }
  if (!_0x2ee0b7.messages.length) {
    return 'Add at least one message.';
  }
  return '';
}
export function isTextOnly(_0x572dd2) {
  return (
    _0x572dd2.messages.length === 1 && _0x572dd2.messages[0].kind === 'none'
  );
}
export async function sendCanned(
  _0x5b344d,
  _0x23ebc4,
  _0x1b2e90,
  _0x2eab48 = {},
) {
  if (!_0x1b2e90) {
    _0x3be07b.toast('Open a chat first.', 'info');
    return false;
  }
  const _0x21dbda = _0x5b344d.crm.vars(_0x1b2e90);
  if (
    (_0x23ebc4.editBeforeSend || _0x2eab48.insertOnly) &&
    isTextOnly(_0x23ebc4)
  ) {
    await _0x5b344d.wa.setInput(
      renderTemplate(_0x23ebc4.messages[0].text, _0x21dbda),
      _0x1b2e90,
    );
    return true;
  }
  if (_0x23ebc4.confirmBeforeSend && !_0x2eab48.skipConfirm) {
    const _0x558ba7 = await _0x3be07b.confirmDialog(
      'Send "' +
        _0x23ebc4.title +
        '" to ' +
        _0x5b344d.crm.displayName(_0x1b2e90) +
        '?',
      {
        title: 'Start sending',
        confirmLabel: 'Yes, send',
        cancelLabel: 'No',
      },
    );
    if (!_0x558ba7) {
      return false;
    }
  }
  const _0x5b9845 = {
    aborted: false,
  };
  let _0x308796 = null;
  const _0x154ee5 = _0x23ebc4.messages.length;
  if (_0x154ee5 > 1 && _0x3be07b.layers.toast) {
    _0x308796 = _0x3be07b.toast('Sending 1/' + _0x154ee5, 'info', {
      ttl: 60000,
      action: {
        label: 'Cancel',
        onClick: () => {
          _0x5b9845.aborted = true;
        },
      },
    });
  }
  const _0x98d0d7 = _0x23ebc4.messages.map((_0x1f7d40) => clone(_0x1f7d40));
  const _0x108724 = await _0x5b344d.sender.send(_0x1b2e90, _0x98d0d7, {
    automated: false,
    signal: _0x5b9845,
    typing: false,
    mentionAll: !!_0x23ebc4.mentionAll && /@g\.us$/.test(_0x1b2e90),
    delay: _0x154ee5 > 1 ? _0x23ebc4.delay : undefined,
    onProgress: (_0x5a0b81, _0x51f9b3) => {
      if (_0x308796) {
        const _0xb56aca = _0x308796.querySelector('.wc-toast-text');
        if (_0xb56aca) {
          _0xb56aca.textContent =
            'Sending ' + Math.min(_0x5a0b81 + 1, _0x51f9b3) + '/' + _0x51f9b3;
        }
      }
    },
  });
  if (_0x308796) {
    _0x308796.remove();
  }
  if (_0x108724.failed) {
    _0x3be07b.toast(
      'Some messages were not sent: ' +
        (_0x108724.errors[0] && _0x108724.errors[0].error),
      'error',
    );
  } else if (_0x108724.aborted) {
    _0x3be07b.toast('Sending was cancelled.', 'info');
  } else if (_0x108724.sent) {
    _0x3be07b.toast(_0x154ee5 > 1 ? 'Funnel sent.' : 'Sent.', 'success');
  }
  if (_0x108724.sent && _0x23ebc4.post) {
    await _0x5b344d.actions.run(_0x1b2e90, _0x23ebc4.post, {
      source: 'canned response',
      name: _0x23ebc4.title,
    });
  }
  await _0x5b344d.activity.log('canned_sent', {
    chatId: _0x1b2e90,
    text: _0x23ebc4.title,
  });
  return _0x108724.sent > 0;
}
export function quickReplySummary(_0x471d37) {
  if (_0x471d37.messages.length > 1) {
    return _0x471d37.messages.length + ' messages (funnel)';
  }
  return summarizeMessage(_0x471d37.messages[0]);
}
