import { h, icon, clear } from '../ui/dom.js';
import * as kit from '../ui/kit.js';

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
    title: 'Tags & Custom Fields',
    text: 'Define what you track about each contact.',
  },
  {
    panel: 'blur',
    icon: 'eye-off',
    title: 'Blur / Privacy',
    text: 'Hide names, photos and messages on screen.',
  },
  {
    panel: 'validator',
    icon: 'phone-call',
    title: 'Number Validator',
    text: 'Check which numbers are on WhatsApp.',
  },
  {
    panel: 'export-contacts',
    icon: 'download',
    title: 'Export Contacts',
    text: 'Download chats, contacts and group members.',
  },
  {
    panel: 'import-export',
    icon: 'file-spreadsheet',
    title: 'Import / Export',
    text: 'Back up everything or import contacts from CSV.',
  },
  {
    panel: 'group-tools',
    icon: 'users',
    title: 'Group Tools',
    text: 'Clone groups, find duplicates, add people in bulk.',
  },
  {
    panel: 'link-generator',
    icon: 'qr-code',
    title: 'Click-to-Chat Link',
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
    title: 'Module Settings',
    text: 'Safety limits, signature, notifications and activity.',
  },
];

export default {
  id: 'tools',
  title: 'Free Tools',
  subtitle: 'Handy utilities for lists, groups and links.',
  icon: 'wrench',
  render(ctx) {
    const { shell } = ctx;
    let query = '';

    const grid = h('div', { class: 'wc-grid wc-grid-3' });

    function renderTools() {
      clear(grid);
      const q = query.toLowerCase().trim();
      const filtered = TOOLS.filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q),
      );

      if (!filtered.length) {
        grid.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
              style: {
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '32px 16px',
              },
            },
            'No tools matching "' + query + '".',
          ),
        );
        return;
      }

      filtered.forEach((tool) => {
        grid.appendChild(
          h(
            'button',
            {
              class: 'wc-card wc-tool',
              type: 'button',
              'aria-label': tool.title,
              onClick: () => {
                if (shell && typeof shell.openPanel === 'function') {
                  shell.openPanel(tool.panel);
                }
              },
            },
            h('span', { class: 'wc-tool-icon' }, icon(tool.icon, 22)),
            h('strong', null, tool.title),
            h('span', null, tool.text),
          ),
        );
      });
    }

    renderTools();

    const search = kit.searchInput('Search tools...', (val) => {
      query = val;
      renderTools();
    });

    return h(
      'div',
      { class: 'wc-screen' },
      h('div', { class: 'wc-toolbar' }, search),
      grid,
    );
  },
};
