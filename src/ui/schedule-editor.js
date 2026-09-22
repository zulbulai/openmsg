import { h, clear } from './dom.js';
import * as _0x2261ea from './kit.js';
import { nextRun, describeRule, WEEKDAYS } from '../core/timecalc.js';
import { fmtDateTime, toDateInput, pad2 } from '../core/util.js';
const UNITS = [
  {
    value: 'minute',
    label: 'minutes',
  },
  {
    value: 'hour',
    label: 'hours',
  },
  {
    value: 'daily',
    label: 'days',
  },
  {
    value: 'weekly',
    label: 'weeks',
  },
  {
    value: 'monthly',
    label: 'months',
  },
  {
    value: 'yearly',
    label: 'years',
  },
];
function dayChips(_0x472ad3, _0x4b793d) {
  const _0x5bc8f3 = h('div', {
    class: 'wc-daychips',
  });
  function _0x399cd7() {
    clear(_0x5bc8f3);
    WEEKDAYS.forEach((_0x455acd, _0x498e93) =>
      _0x5bc8f3.appendChild(
        h(
          'button',
          {
            type: 'button',
            class:
              'wc-daychip' + (_0x472ad3.includes(_0x498e93) ? ' is-on' : ''),
            'aria-pressed': _0x472ad3.includes(_0x498e93),
            onClick: () => {
              const _0x4254a6 = _0x472ad3.indexOf(_0x498e93);
              if (_0x4254a6 >= 0) {
                _0x472ad3.splice(_0x4254a6, 1);
              } else {
                _0x472ad3.push(_0x498e93);
              }
              _0x472ad3.sort();
              _0x399cd7();
              _0x4b793d(_0x472ad3.slice());
            },
          },
          _0x455acd,
        ),
      ),
    );
  }
  _0x399cd7();
  return _0x5bc8f3;
}
export function scheduleEditor({
  value: _0x5e9ee9,
  onChange: _0x167cb5,
  allowRepeat = true,
}) {
  const _0x1272df = _0x5e9ee9;
  if (!_0x1272df.startAt) {
    _0x1272df.startAt = Date.now() + 3600000;
  }
  const _0x265826 = h('div', {
    class: 'wc-stack',
  });
  const _0x314d08 = () => {
    if (_0x167cb5) {
      _0x167cb5(_0x1272df);
    }
    _0x42b851();
  };
  const _0x18703b = h('div', {
    class: 'wc-schedule-preview',
  });
  function _0x42b851() {
    clear(_0x18703b);
    const _0x1c04b5 = [];
    let _0x1412e1 = Date.now() - 1;
    for (let _0x3b23c7 = 0; _0x3b23c7 < 3; _0x3b23c7++) {
      const _0x3c5cc6 = nextRun(_0x1272df, _0x1412e1, _0x3b23c7);
      if (!_0x3c5cc6) {
        break;
      }
      _0x1c04b5.push(_0x3c5cc6);
      _0x1412e1 = _0x3c5cc6;
    }
    _0x18703b.appendChild(h('strong', null, describeRule(_0x1272df)));
    _0x18703b.appendChild(
      h(
        'span',
        {
          class: 'wc-muted',
        },
        _0x1c04b5.length
          ? 'Next: ' + _0x1c04b5.map(fmtDateTime).join('  ·  ')
          : _0x1272df.mode === 'once'
            ? 'Runs at the time above.'
            : 'No upcoming runs.',
      ),
    );
  }
  function _0x2341f3() {
    clear(_0x265826);
    if (allowRepeat) {
      _0x265826.appendChild(
        _0x2261ea.radioCards(
          'sched-mode',
          [
            {
              value: 'once',
              label: 'Once',
              hint: 'Send at one date and time.',
            },
            {
              value: 'repeat',
              label: 'Repeated',
              hint: 'Send again and again on a pattern.',
            },
          ],
          _0x1272df.mode || 'once',
          (_0x2e6df5) => {
            _0x1272df.mode = _0x2e6df5;
            if (_0x2e6df5 === 'repeat') {
              Object.assign(_0x1272df, {
                unit: _0x1272df.unit || 'daily',
                interval: _0x1272df.interval || 1,
                times:
                  _0x1272df.times && _0x1272df.times.length
                    ? _0x1272df.times
                    : [
                        pad2(new Date(_0x1272df.startAt).getHours()) +
                          ':' +
                          pad2(new Date(_0x1272df.startAt).getMinutes()),
                      ],
                endType: _0x1272df.endType || 'never',
                daysOfWeek: _0x1272df.daysOfWeek || [],
              });
            }
            _0x2341f3();
            _0x314d08();
          },
        ),
      );
    }
    _0x265826.appendChild(
      _0x2261ea.field(
        _0x1272df.mode === 'repeat' ? 'Start on' : 'Date and time',
        _0x2261ea.datetimeInput(_0x1272df.startAt, (_0x962e00) => {
          _0x1272df.startAt = _0x962e00;
          _0x314d08();
        }),
      ),
    );
    if (_0x1272df.mode === 'repeat') {
      _0x265826.appendChild(
        _0x2261ea.row(
          _0x2261ea.field(
            'Repeat every',
            _0x2261ea.input({
              type: 'number',
              min: 1,
              value: _0x1272df.interval,
              onInput: (_0x341830) => {
                _0x1272df.interval = Math.max(1, Number(_0x341830) || 1);
                _0x314d08();
              },
            }),
          ),
          _0x2261ea.field(
            'Unit',
            _0x2261ea.select(UNITS, _0x1272df.unit, (_0x49a972) => {
              _0x1272df.unit = _0x49a972;
              _0x2341f3();
              _0x314d08();
            }),
          ),
        ),
      );
      if (_0x1272df.unit === 'weekly') {
        _0x265826.appendChild(
          _0x2261ea.field(
            'On these days',
            dayChips((_0x1272df.daysOfWeek ||= []), (_0x142956) => {
              _0x1272df.daysOfWeek = _0x142956;
              _0x314d08();
            }),
          ),
        );
      }
      if (_0x1272df.unit === 'monthly') {
        _0x265826.appendChild(
          _0x2261ea.checkbox(
            !!_0x1272df.lastDayOfMonth,
            (_0x246661) => {
              _0x1272df.lastDayOfMonth = _0x246661;
              _0x314d08();
            },
            'Run on the last day of the month',
          ),
        );
      }
      if (['daily', 'weekly', 'monthly', 'yearly'].includes(_0x1272df.unit)) {
        const _0xf485d7 = h('div', {
          class: 'wc-stack',
        });
        const _0x31d074 = () => {
          clear(_0xf485d7);
          (_0x1272df.times || []).forEach((_0x4a3a7c, _0x11016b) =>
            _0xf485d7.appendChild(
              h(
                'div',
                {
                  class: 'wc-form-row wc-row-remove',
                },
                h('input', {
                  class: 'wc-input',
                  type: 'time',
                  value: _0x4a3a7c,
                  onInput: (_0x3c7f68) => {
                    _0x1272df.times[_0x11016b] = _0x3c7f68.target.value;
                    _0x314d08();
                  },
                }),
                _0x1272df.times.length > 1
                  ? _0x2261ea.iconButton(
                      'trash-2',
                      'Remove time',
                      () => {
                        _0x1272df.times.splice(_0x11016b, 1);
                        _0x31d074();
                        _0x314d08();
                      },
                      'is-danger',
                    )
                  : h('span'),
              ),
            ),
          );
          _0xf485d7.appendChild(
            _0x2261ea.button('Add a time', {
              icon: 'plus',
              size: 'sm',
              onClick: () => {
                (_0x1272df.times = _0x1272df.times || []).push('12:00');
                _0x31d074();
                _0x314d08();
              },
            }),
          );
        };
        _0x31d074();
        _0x265826.appendChild(_0x2261ea.field('Times of day', _0xf485d7));
      } else {
        const _0x509502 = !!_0x1272df.window && !!_0x1272df.window.from;
        _0x265826.appendChild(
          _0x2261ea.checkbox(
            _0x509502,
            (_0x11395b) => {
              _0x1272df.window = _0x11395b
                ? {
                    from: '09:00',
                    to: '18:00',
                  }
                : null;
              _0x2341f3();
              _0x314d08();
            },
            'Only run between certain hours',
          ),
        );
        if (_0x509502) {
          _0x265826.appendChild(
            _0x2261ea.row(
              _0x2261ea.field(
                'From',
                h('input', {
                  class: 'wc-input',
                  type: 'time',
                  value: _0x1272df.window.from,
                  onInput: (_0x15a0a0) => {
                    _0x1272df.window.from = _0x15a0a0.target.value;
                    _0x314d08();
                  },
                }),
              ),
              _0x2261ea.field(
                'To',
                h('input', {
                  class: 'wc-input',
                  type: 'time',
                  value: _0x1272df.window.to,
                  onInput: (_0xf88119) => {
                    _0x1272df.window.to = _0xf88119.target.value;
                    _0x314d08();
                  },
                }),
              ),
            ),
          );
        }
        _0x265826.appendChild(
          _0x2261ea.field(
            'Only on these days (leave empty for every day)',
            dayChips((_0x1272df.allowedDays ||= []), (_0x4ed63d) => {
              _0x1272df.allowedDays = _0x4ed63d;
              _0x314d08();
            }),
          ),
        );
      }
      _0x265826.appendChild(
        _0x2261ea.row(
          _0x2261ea.field(
            'Stop repeating',
            _0x2261ea.select(
              [
                {
                  value: 'never',
                  label: 'Never',
                },
                {
                  value: 'count',
                  label: 'After a number of times',
                },
                {
                  value: 'date',
                  label: 'On a date',
                },
              ],
              _0x1272df.endType || 'never',
              (_0x4e2e3c) => {
                _0x1272df.endType = _0x4e2e3c;
                _0x2341f3();
                _0x314d08();
              },
            ),
          ),
          _0x1272df.endType === 'count'
            ? _0x2261ea.field(
                'Times',
                _0x2261ea.input({
                  type: 'number',
                  min: 1,
                  value: _0x1272df.endCount || 5,
                  onInput: (_0x47c04f) => {
                    _0x1272df.endCount = Math.max(1, Number(_0x47c04f) || 1);
                    _0x314d08();
                  },
                }),
              )
            : _0x1272df.endType === 'date'
              ? _0x2261ea.field(
                  'Last date',
                  h('input', {
                    class: 'wc-input',
                    type: 'date',
                    value: _0x1272df.endDate
                      ? toDateInput(_0x1272df.endDate)
                      : '',
                    onInput: (_0xf8252d) => {
                      _0x1272df.endDate = _0xf8252d.target.value
                        ? new Date(
                            _0xf8252d.target.value + 'T23:59:59',
                          ).getTime()
                        : 0;
                      _0x314d08();
                    },
                  }),
                )
              : h('span'),
        ),
      );
    }
    _0x265826.appendChild(_0x18703b);
    _0x42b851();
  }
  _0x2341f3();
  return _0x265826;
}
