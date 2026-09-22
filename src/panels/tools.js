import { h, icon } from '../ui/dom.js';
const TOOLS = [
  {
    panel: 'notes',
    icon: 'notebook-pen',
    title: 'Notes',
    text: 'Every note you have written about a contact.',
  },
  {
    panel: 'reminders',
    icon: 'bell-ring',
    title: 'Reminders',
    text: 'Follow-ups you set, with notifications when due.',
  },
  {
    panel: 'crm-settings',
    icon: 'tags',
    title: 'Tags and custom fields',
    text: 'Define what you track about each contact.',
  },
  {
    panel: 'blur',
    icon: 'eye-off',
    title: 'Blur settings',
    text: 'Hide names, photos and messages on screen.',
  },
  {
    panel: 'validator',
    icon: 'phone-call',
    title: 'Number validator',
    text: 'Check which numbers are on WhatsApp.',
  },
  {
    panel: 'export-contacts',
    icon: 'download',
    title: 'Export contacts',
    text: 'Download chats, contacts and group members.',
  },
  {
    panel: 'import-export',
    icon: 'file-spreadsheet',
    title: 'Import and export data',
    text: 'Back up everything or import contacts from CSV.',
  },
  {
    panel: 'group-tools',
    icon: 'users',
    title: 'Group tools',
    text: 'Clone groups, find duplicates, add people in bulk.',
  },
  {
    panel: 'link-generator',
    icon: 'qr-code',
    title: 'Click-to-chat link',
    text: 'Generate wa.me links and QR codes.',
  },
  {
    panel: 'status-posts',
    icon: 'circle-play',
    title: 'Scheduled Status',
    text: 'Post to your Status at the right time.',
  },
  {
    panel: 'settings',
    icon: 'settings',
    title: 'Module settings',
    text: 'Safety limits, signature, notifications and activity.',
  },
];
export default {
  id: 'tools',
  title: 'Free Tools',
  subtitle: 'Handy utilities for lists, groups and links.',
  icon: 'wrench',
  render(_0x751f30) {
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      h(
        'div',
        {
          class: 'wc-grid wc-grid-4',
        },
        TOOLS.map((_0x14181b) =>
          h(
            'button',
            {
              class: 'wc-card wc-tool',
              type: 'button',
              onClick: () => _0x751f30.shell.openPanel(_0x14181b.panel),
            },
            h(
              'span',
              {
                class: 'wc-tool-icon',
              },
              icon(_0x14181b.icon, 22),
            ),
            h('strong', null, _0x14181b.title),
            h('span', null, _0x14181b.text),
          ),
        ),
      ),
    );
  },
};
