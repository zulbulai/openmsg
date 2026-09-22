import { h, clear } from '../ui/dom.js';
import * as _0x5da966 from '../ui/kit.js';
import { scheduleEditor } from '../ui/schedule-editor.js';
import { newCampaign } from '../core/scheduler.js';
import { validateMessage } from '../core/messages.js';
import { fmtDateTime } from '../core/util.js';
import { stepTarget, stepMessage, announceStarted } from './broadcasts.js';
export default {
  id: 'send-message',
  title: 'Send Message',
  subtitle: 'Write once and send to many chats, now or later.',
  icon: 'send',
  render(_0x4b10b3) {
    const { app: _0x121fc2, shell: _0x216a26 } = _0x4b10b3;
    const _0x423422 = newCampaign('broadcast');
    _0x423422.name = 'Quick send ' + new Date().toLocaleString();
    _0x423422.startMode = 'now';
    const _0x422bd2 = h('div', {
      class: 'wc-field-error',
    });
    const _0x49c45f = h('div', {
      class: 'wc-screen wc-form wc-narrow',
    });
    const _0x3a00f3 = h('div', {
      class: 'wc-form',
    });
    const _0x17aba4 = h('div', {
      class: 'wc-savebar',
    });
    let _0x53deb5 = false;
    async function _0x10f993() {
      if (_0x53deb5) {
        return;
      }
      _0x422bd2.textContent = '';
      for (const _0x38d88f of _0x423422.messages) {
        const _0x578e17 = validateMessage(_0x38d88f);
        if (_0x578e17.length) {
          _0x422bd2.textContent = _0x578e17[0];
          return;
        }
      }
      if (
        _0x423422.startMode === 'schedule' &&
        _0x423422.schedule.mode !== 'repeat' &&
        _0x423422.schedule.startAt <= Date.now()
      ) {
        _0x422bd2.textContent = 'Pick a time in the future.';
        return;
      }
      _0x53deb5 = true;
      let _0x27e329 = null;
      try {
        _0x27e329 = await _0x121fc2.scheduler.save(
          Object.assign({}, _0x423422, {
            name: _0x423422.name.trim() || 'Quick send',
          }),
        );
        const _0x46d942 =
          _0x423422.startMode === 'now'
            ? await _0x121fc2.scheduler.startNow(_0x27e329.id)
            : null;
        _0x216a26.openPanel('send-message');
        if (_0x46d942) {
          announceStarted(_0x121fc2, _0x46d942);
        } else {
          _0x5da966.toast(
            'Scheduled for ' +
              fmtDateTime(_0x27e329.nextRunAt) +
              '. WhatsApp Web must be open then.',
            'success',
            {
              ttl: 7000,
              action: {
                label: 'View',
                onClick: () => _0x216a26.openPanel('schedules'),
              },
            },
          );
        }
      } catch (_0x4c6be2) {
        if (_0x27e329 && _0x423422.startMode === 'now') {
          await _0x121fc2.scheduler.remove(_0x27e329.id).catch(() => {});
        }
        _0x422bd2.textContent = _0x4c6be2.message;
        _0x53deb5 = false;
      }
    }
    function _0x9faaee() {
      clear(_0x3a00f3);
      clear(_0x17aba4);
      _0x3a00f3.appendChild(
        _0x5da966.radioCards(
          'sm-start',
          [
            {
              value: 'now',
              label: 'Send now',
              hint: 'Starts right away and keeps going in the background, so you can close this panel.',
            },
            {
              value: 'schedule',
              label: 'Schedule',
              hint: 'Pick a date and time, or repeat. WhatsApp Web must be open then.',
            },
          ],
          _0x423422.startMode,
          (_0x45ae00) => {
            _0x423422.startMode = _0x45ae00;
            _0x9faaee();
          },
        ),
      );
      if (_0x423422.startMode === 'schedule') {
        if (!_0x423422.schedule.startAt) {
          _0x423422.schedule.startAt = Date.now() + 3600000;
        }
        const _0x1d1091 = h('div', {
          class: 'wc-subform',
        });
        _0x1d1091.appendChild(
          scheduleEditor({
            value: _0x423422.schedule,
            allowRepeat: true,
            onChange: () => {},
          }),
        );
        _0x1d1091.appendChild(
          _0x5da966.checkbox(
            _0x423422.options.autoSendIfMissed,
            (_0x9e50e8) => {
              _0x423422.options.autoSendIfMissed = _0x9e50e8;
            },
            'Send automatically even if the scheduled time has passed',
          ),
        );
        _0x3a00f3.appendChild(_0x1d1091);
      }
      _0x17aba4.appendChild(
        _0x5da966.button(
          _0x423422.startMode === 'now' ? 'Send now' : 'Schedule',
          {
            icon: _0x423422.startMode === 'now' ? 'send' : 'calendar-clock',
            variant: 'primary',
            onClick: _0x10f993,
          },
        ),
      );
    }
    _0x49c45f.appendChild(
      _0x5da966.section('Who gets it', [stepTarget(_0x121fc2, _0x423422)], {
        card: true,
      }),
    );
    _0x49c45f.appendChild(
      _0x5da966.section('Your message', [stepMessage(_0x121fc2, _0x423422)], {
        card: true,
      }),
    );
    _0x49c45f.appendChild(
      _0x5da966.section('When to send', [_0x3a00f3], {
        card: true,
      }),
    );
    _0x49c45f.appendChild(_0x422bd2);
    _0x49c45f.appendChild(_0x17aba4);
    _0x9faaee();
    _0x4b10b3.setActions([]);
    return _0x49c45f;
  },
};
