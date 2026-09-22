import { newGraph, newNode, NODE_TYPES } from './chatbot.js';
import { uid } from './util.js';
export const INDUSTRIES = [
  {
    id: 'all',
    label: 'All',
  },
  {
    id: 'general',
    label: 'Any business',
  },
  {
    id: 'store',
    label: 'Online store',
  },
  {
    id: 'clinic',
    label: 'Health and clinics',
  },
  {
    id: 'services',
    label: 'Services',
  },
  {
    id: 'logistics',
    label: 'Delivery and logistics',
  },
  {
    id: 'salon',
    label: 'Salons and spas',
  },
];
export function buildGraph(_0x2ab83c, _0x1caa8f) {
  const _0x3d6548 = newGraph();
  if (_0x1caa8f) {
    Object.assign(_0x3d6548.settings, _0x1caa8f);
  }
  const _0x283845 = _0x3d6548.nodes[0];
  const _0x35ba19 = new Map();
  const _0x2d9095 = _0x2ab83c.map((_0x1d1f8d) => {
    const _0x3cfcee = newNode(_0x1d1f8d.t);
    Object.assign(_0x3cfcee.data, _0x1d1f8d.d || {});
    if (_0x1d1f8d.title) {
      _0x3cfcee.title = _0x1d1f8d.title;
    }
    _0x35ba19.set(_0x1d1f8d.k, _0x3cfcee);
    return _0x3cfcee;
  });
  const _0x474063 = [];
  const _0x46d4cf = (_0x492dce, _0x1a8859, _0x3ba77a) => {
    if (_0x3ba77a && _0x35ba19.get(_0x3ba77a)) {
      _0x474063.push({
        id: uid('e'),
        from: _0x492dce.id,
        handle: _0x1a8859,
        to: _0x35ba19.get(_0x3ba77a).id,
      });
    }
  };
  _0x46d4cf(_0x283845, 'next', _0x2ab83c[0].k);
  _0x2ab83c.forEach((_0x29ab7b, _0x1efb91) => {
    const _0x1cac78 = _0x2d9095[_0x1efb91];
    _0x46d4cf(_0x1cac78, 'next', _0x29ab7b.to);
    for (const [_0x2a365f, _0x43960f] of Object.entries(
      _0x29ab7b.routes || {},
    )) {
      _0x46d4cf(_0x1cac78, _0x2a365f, _0x43960f);
    }
  });
  const _0xcbfbf4 = new Map([[_0x283845.id, 0]]);
  const _0x400f34 = [_0x283845];
  for (let _0x2ee2d4 = 0; _0x2ee2d4 < _0x400f34.length; _0x2ee2d4++) {
    for (const _0x146ae2 of _0x474063.filter(
      (_0x25117a) => _0x25117a.from === _0x400f34[_0x2ee2d4].id,
    )) {
      const _0x5b932f = [_0x283845, ..._0x2d9095].find(
        (_0x5b3e55) => _0x5b3e55.id === _0x146ae2.to,
      );
      if (_0x5b932f && !_0xcbfbf4.has(_0x5b932f.id)) {
        _0xcbfbf4.set(_0x5b932f.id, _0xcbfbf4.get(_0x400f34[_0x2ee2d4].id) + 1);
        _0x400f34.push(_0x5b932f);
      }
    }
  }
  const _0x186b37 = {};
  for (const _0x1fe5bb of [_0x283845, ..._0x2d9095]) {
    const _0x50d49e = _0xcbfbf4.has(_0x1fe5bb.id)
      ? _0xcbfbf4.get(_0x1fe5bb.id)
      : 0;
    _0x186b37[_0x50d49e] = _0x186b37[_0x50d49e] || 0;
    _0x1fe5bb.x = 60 + _0x50d49e * 320;
    _0x1fe5bb.y = 80 + _0x186b37[_0x50d49e] * 230;
    _0x186b37[_0x50d49e]++;
  }
  _0x3d6548.nodes = [_0x283845, ..._0x2d9095];
  _0x3d6548.edges = _0x474063;
  return _0x3d6548;
}
const text = (_0x2d7696, _0x125d76) =>
  Object.assign(
    {
      text: _0x2d7696,
    },
    _0x125d76 || {},
  );
const ask = (_0x3d6692, _0x1971d3, _0x29ed65) => ({
  text: _0x3d6692,
  wait: true,
  saveAs: _0x1971d3,
  format: _0x29ed65 || 'any',
});
export const CHATBOT_TEMPLATES = [
  {
    id: 'welcome',
    industry: 'general',
    title: 'Welcome message',
    subtitle:
      'Greets anyone who writes in for the first time and offers a menu.',
    trigger: {
      type: 'any_message',
      keywords: [],
    },
    graph: () =>
      buildGraph([
        {
          k: 'hi',
          t: 'text',
          d: text(
            'Hi {{firstname}}, thanks for contacting us! How can we help?',
          ),
          to: 'menu',
        },
        {
          k: 'menu',
          t: 'buttons',
          d: {
            text: 'Please choose an option:',
            footer: '',
            buttons: [
              {
                text: 'Opening hours',
              },
              {
                text: 'Talk to a person',
              },
              {
                text: 'Our website',
              },
            ],
            saveAs: 'topic',
            timeoutEnabled: false,
            timeoutValue: 5,
            timeoutUnit: 'minutes',
          },
          routes: {
            'option:0': 'hours',
            'option:1': 'human',
            'option:2': 'site',
          },
        },
        {
          k: 'hours',
          t: 'text',
          d: text('We are open Monday to Saturday, 9 am to 6 pm.'),
          to: 'end',
        },
        {
          k: 'site',
          t: 'text',
          d: text('You can find everything at https://example.com'),
          to: 'end',
        },
        {
          k: 'human',
          t: 'handoff',
          d: {
            customerMessage: 'One moment, a colleague will join you shortly.',
            agentPhone: '',
            agentMessage: 'A customer ({{mob_no}}) asked to talk to a person.',
          },
        },
        {
          k: 'end',
          t: 'end',
          d: {
            message: 'Anything else? Just send us a message.',
          },
        },
      ]),
  },
  {
    id: 'lead',
    industry: 'general',
    title: 'Lead capture',
    subtitle: 'Collects a name, an email and what the person is interested in.',
    trigger: {
      type: 'keyword',
      keywords: ['start', 'info'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'name',
          t: 'text',
          d: ask('Great to meet you! What is your name?', 'name'),
          to: 'email',
        },
        {
          k: 'email',
          t: 'text',
          d: ask(
            'Thanks {{name}}. What is your email address?',
            'email',
            'email',
          ),
          to: 'interest',
        },
        {
          k: 'interest',
          t: 'buttons',
          d: {
            text: 'What are you interested in?',
            footer: '',
            buttons: [
              {
                text: 'Pricing',
              },
              {
                text: 'A demo',
              },
              {
                text: 'Support',
              },
            ],
            saveAs: 'interest',
            timeoutEnabled: false,
            timeoutValue: 5,
            timeoutUnit: 'minutes',
          },
          routes: {
            'option:0': 'set',
            'option:1': 'set',
            'option:2': 'set',
          },
        },
        {
          k: 'set',
          t: 'setVariable',
          d: {
            entries: [
              {
                name: 'email',
                scope: 'contact',
                value: '@email',
              },
            ],
          },
          to: 'thanks',
        },
        {
          k: 'thanks',
          t: 'text',
          d: text(
            'Thanks {{name}}! We will reach out about {{interest}} very soon.',
          ),
          to: 'end',
        },
        {
          k: 'end',
          t: 'end',
          d: {
            message: '',
          },
        },
      ]),
  },
  {
    id: 'orderStatus',
    industry: 'store',
    title: 'Order status',
    subtitle: 'Asks for an order number so your team can look it up.',
    trigger: {
      type: 'keyword',
      keywords: ['order', 'order status'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'ask',
          t: 'text',
          d: ask(
            'Sure, I can help with your order. What is your order number?',
            'order',
          ),
          to: 'ok',
        },
        {
          k: 'ok',
          t: 'text',
          d: text(
            'Thank you. We are checking order {{order}} and will reply here in a few minutes.',
          ),
          to: 'human',
        },
        {
          k: 'human',
          t: 'handoff',
          d: {
            customerMessage: 'Thanks, a team member will reply here shortly.',
            agentPhone: '',
            agentMessage:
              'Order status request from {{mob_no}}: order {{order}}',
          },
        },
      ]),
  },
  {
    id: 'delivery',
    industry: 'logistics',
    title: 'Track a parcel',
    subtitle: 'Asks for a tracking number and takes it from there.',
    trigger: {
      type: 'keyword',
      keywords: ['track', 'tracking'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'ask',
          t: 'text',
          d: ask('Please send your tracking number.', 'tracking'),
          to: 'ok',
        },
        {
          k: 'ok',
          t: 'text',
          d: text(
            'Thanks! Tracking {{tracking}} is being checked. We will update you here shortly.',
          ),
          to: 'human',
        },
        {
          k: 'human',
          t: 'handoff',
          d: {
            customerMessage: 'Thanks, a team member will reply here shortly.',
            agentPhone: '',
            agentMessage: 'Tracking request from {{mob_no}}: {{tracking}}',
          },
        },
      ]),
  },
  {
    id: 'booking',
    industry: 'clinic',
    title: 'Book an appointment',
    subtitle: 'Collects a preferred day and time before you confirm a slot.',
    trigger: {
      type: 'keyword',
      keywords: ['book', 'appointment'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'name',
          t: 'text',
          d: ask('Happy to help you book. What is your full name?', 'name'),
          to: 'day',
        },
        {
          k: 'day',
          t: 'text',
          d: ask(
            'Thanks {{name}}. Which day works best for you? For example 2026-10-21.',
            'day',
            'date',
          ),
          to: 'time',
        },
        {
          k: 'time',
          t: 'buttons',
          d: {
            text: 'What time of day suits you?',
            footer: '',
            buttons: [
              {
                text: 'Morning',
              },
              {
                text: 'Afternoon',
              },
              {
                text: 'Evening',
              },
            ],
            saveAs: 'slot',
            timeoutEnabled: false,
            timeoutValue: 5,
            timeoutUnit: 'minutes',
          },
          routes: {
            'option:0': 'done',
            'option:1': 'done',
            'option:2': 'done',
          },
        },
        {
          k: 'done',
          t: 'text',
          d: text(
            'Noted: {{day}}, {{slot}}. We will confirm your slot shortly.',
          ),
          to: 'notify',
        },
        {
          k: 'notify',
          t: 'handoff',
          d: {
            customerMessage: 'Thanks, a team member will reply here shortly.',
            agentPhone: '',
            agentMessage:
              'Booking request from {{name}} ({{mob_no}}): {{day}}, {{slot}}',
          },
        },
      ]),
  },
  {
    id: 'salon',
    industry: 'salon',
    title: 'Salon menu',
    subtitle: 'Shows your services and asks which one the customer wants.',
    trigger: {
      type: 'keyword',
      keywords: ['menu', 'services'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'menu',
          t: 'list',
          d: {
            text: 'Here is what we offer. Which service would you like?',
            title: 'Services',
            buttonText: 'View services',
            footer: '',
            sections: [
              {
                title: 'Hair',
                rows: [
                  {
                    title: 'Haircut',
                    description: 'From $20',
                  },
                  {
                    title: 'Colour',
                    description: 'From $60',
                  },
                ],
              },
              {
                title: 'Skin',
                rows: [
                  {
                    title: 'Facial',
                    description: 'From $45',
                  },
                  {
                    title: 'Massage',
                    description: 'From $50',
                  },
                ],
              },
            ],
            saveAs: 'service',
            timeoutEnabled: false,
            timeoutValue: 5,
            timeoutUnit: 'minutes',
          },
          routes: {
            'option:0': 'ok',
            'option:1': 'ok',
            'option:2': 'ok',
            'option:3': 'ok',
          },
        },
        {
          k: 'ok',
          t: 'text',
          d: text(
            'Great choice: {{service}}. When would you like to come in?',
            {
              wait: true,
              saveAs: 'when',
              format: 'any',
            },
          ),
          to: 'thanks',
        },
        {
          k: 'thanks',
          t: 'text',
          d: text('Thanks! We will confirm {{service}} for {{when}} shortly.'),
          to: 'end',
        },
        {
          k: 'end',
          t: 'end',
          d: {
            message: '',
          },
        },
      ]),
  },
  {
    id: 'feedback',
    industry: 'services',
    title: 'Feedback survey',
    subtitle: 'Asks for a rating and follows up when someone is unhappy.',
    trigger: {
      type: 'keyword',
      keywords: ['feedback'],
    },
    graph: () =>
      buildGraph([
        {
          k: 'rate',
          t: 'text',
          d: ask('How would you rate us from 1 to 5?', 'rating', 'number'),
          to: 'check',
        },
        {
          k: 'check',
          t: 'condition',
          d: {
            branches: [
              {
                join: 'and',
                rules: [
                  {
                    variable: 'rating',
                    operator: 'gte',
                    value: '4',
                  },
                ],
              },
            ],
          },
          routes: {
            'cond:0': 'happy',
            otherwise: 'sorry',
          },
        },
        {
          k: 'happy',
          t: 'text',
          d: text(
            'Thank you for the {{rating}} stars! We really appreciate it.',
          ),
          to: 'end',
        },
        {
          k: 'sorry',
          t: 'text',
          d: ask(
            'We are sorry to hear that. What could we do better?',
            'issue',
          ),
          to: 'noted',
        },
        {
          k: 'noted',
          t: 'text',
          d: text('Thank you, we have passed this on to our team.'),
          to: 'end',
        },
        {
          k: 'end',
          t: 'end',
          d: {
            message: '',
          },
        },
      ]),
  },
];
export function templateById(_0x3d3db4) {
  return CHATBOT_TEMPLATES.find((_0x5f53cb) => _0x5f53cb.id === _0x3d3db4);
}
export { NODE_TYPES };
