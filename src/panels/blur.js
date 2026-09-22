import { h } from '../ui/dom.js';
import * as _0x3c02b2 from '../ui/kit.js';
import { BLUR_STRENGTH } from '../features/blur.js';
import { brand } from '../core/brand.js';
function sample(_0x5c9437) {
  const _0x4eb3e6 = BLUR_STRENGTH[_0x5c9437.strength] || BLUR_STRENGTH.medium;
  const _0x3f2870 = (_0x11ab3c) =>
    _0x5c9437.enabled && (_0x11ab3c || _0x5c9437.everything)
      ? {
          filter: 'blur(' + _0x4eb3e6 + 'px)',
        }
      : {};
  return h(
    'div',
    {
      class: 'wc-blur-sample',
      'aria-label': 'Preview of the blur',
    },
    h(
      'div',
      {
        class: 'wc-blur-row',
      },
      h('span', {
        class: 'wc-blur-avatar',
        style: _0x3f2870(_0x5c9437.photos),
      }),
      h(
        'div',
        {
          class: 'wc-blur-text',
        },
        h(
          'strong',
          {
            style: _0x3f2870(_0x5c9437.names),
          },
          'Riya Kapoor',
        ),
        h(
          'span',
          {
            style: _0x3f2870(_0x5c9437.messages),
          },
          'Hi, can you send me the pricing for 20 seats?',
        ),
      ),
    ),
    h(
      'div',
      {
        class: 'wc-blur-chat',
      },
      h(
        'div',
        {
          class: 'wc-blur-bubble',
          style: _0x3f2870(_0x5c9437.conversation),
        },
        'Sure, one moment. I will send it now.',
      ),
      h(
        'div',
        {
          class: 'wc-blur-bubble is-me',
          style: _0x3f2870(_0x5c9437.conversation),
        },
        'Thanks. Please include the yearly discount.',
      ),
    ),
    _0x5c9437.enabled && _0x5c9437.conversation && _0x5c9437.hover
      ? h(
          'span',
          {
            class: 'wc-muted wc-small',
          },
          'In WhatsApp, point at a message to read it.',
        )
      : null,
  );
}
export default {
  id: 'blur',
  title: 'Blur Settings',
  subtitle: 'Blurring private information from the screen.',
  icon: 'eye-off',
  render(_0x48eed9) {
    const { shell: _0x591456 } = _0x48eed9;
    const _0x5890f5 = _0x591456.blur;
    const _0x58ed2c = (
      _0x57c301,
      _0x5d1259,
      _0x2c69bf,
      _0x4c7f52,
      _0x501c13 = {},
    ) =>
      h(
        'div',
        {
          class: 'wc-blur-option' + (_0x501c13.nested ? ' is-nested' : ''),
        },
        _0x3c02b2.toggle(
          _0x2c69bf,
          (_0x2af532) =>
            _0x5890f5.set({
              [_0x4c7f52]: _0x2af532,
            }),
          _0x57c301,
        ),
        h(
          'div',
          null,
          h('strong', null, _0x57c301),
          h(
            'div',
            {
              class: 'wc-muted',
            },
            _0x5d1259,
          ),
        ),
      );
    const _0x355f4b = _0x3c02b2.live(
      _0x48eed9,
      _0x48eed9.app,
      ['settings'],
      () => {
        const _0x1811d5 = _0x5890f5.config();
        return h(
          'div',
          {
            class: 'wc-form',
          },
          _0x3c02b2.banner(
            'Only WhatsApp Web is blurred, and only on this screen. Nothing is uploaded and no message is changed. ' +
              brand() +
              "'s own screens are not blurred.",
            'info',
            'eye-off',
          ),
          _0x3c02b2.section(
            'Privacy screen',
            [
              h(
                'div',
                {
                  class: 'wc-blur-option is-master',
                },
                _0x3c02b2.toggle(
                  _0x1811d5.enabled,
                  (_0xcdd50b) =>
                    _0x5890f5.set({
                      enabled: _0xcdd50b,
                    }),
                  'Hide private information',
                ),
                h(
                  'div',
                  null,
                  h(
                    'strong',
                    null,
                    _0x1811d5.enabled ? 'Blur is on' : 'Blur is off',
                  ),
                  h(
                    'div',
                    {
                      class: 'wc-muted',
                    },
                    'You can also switch it on or off from the settings menu in the top bar.',
                  ),
                ),
              ),
            ],
            {
              card: true,
            },
          ),
          _0x3c02b2.section(
            'What to blur',
            [
              _0x58ed2c(
                'Blur Messages',
                'The last message shown under each name in the chat list.',
                _0x1811d5.messages,
                'messages',
              ),
              _0x58ed2c(
                'Blur Profile Names',
                'Contact and group names, phone numbers in the chat header and sender names in groups.',
                _0x1811d5.names,
                'names',
              ),
              _0x58ed2c(
                'Blur Display Photos (DP)',
                'Profile pictures in the chat list, the chat header and the contact info panel.',
                _0x1811d5.photos,
                'photos',
              ),
              _0x58ed2c(
                'Blur Conversation',
                'Every message, photo and video inside the open chat.',
                _0x1811d5.conversation,
                'conversation',
              ),
              _0x58ed2c(
                'Show Conversation on Hover',
                'Point at a message to read it. It blurs again when you move away.',
                _0x1811d5.hover,
                'hover',
                {
                  nested: true,
                },
              ),
              _0x58ed2c(
                'Blur everything',
                'Blurs the whole chat list and the whole open chat. Turn this on if a part is missed after a WhatsApp update.',
                _0x1811d5.everything,
                'everything',
              ),
              _0x3c02b2.field(
                'Blur strength',
                _0x3c02b2.select(
                  [
                    {
                      value: 'light',
                      label: 'Light',
                    },
                    {
                      value: 'medium',
                      label: 'Medium',
                    },
                    {
                      value: 'strong',
                      label: 'Strong',
                    },
                  ],
                  _0x1811d5.strength,
                  (_0x477e96) =>
                    _0x5890f5.set({
                      strength: _0x477e96,
                    }),
                ),
              ),
            ],
            {
              card: true,
            },
          ),
          _0x3c02b2.section('Preview', [sample(_0x1811d5)], {
            card: true,
          }),
        );
      },
    );
    return h(
      'div',
      {
        class: 'wc-screen wc-narrow',
      },
      _0x355f4b,
    );
  },
};
