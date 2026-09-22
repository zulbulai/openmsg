import { h, icon, clear } from '../ui/dom.js';
import * as _0x133a25 from '../ui/kit.js';
import { numbersEditor, pickChats } from '../ui/pickers.js';
import { parseCsv, toCsv } from '../core/csv.js';
import { download, digits, sleep, bytesToSize, plural } from '../core/util.js';
import { qrcode } from '../../vendor/qrcode.mjs';
import { brand } from '../core/brand.js';
export const validatorPanel = {
  id: 'validator',
  title: 'Number Validator',
  subtitle:
    'Check which phone numbers are on WhatsApp before you message them.',
  icon: 'phone-call',
  render(_0x200a21) {
    const { app: _0x56cc85 } = _0x200a21;
    let _0x3a5b50 = [];
    const _0x56de9f = [];
    let _0x2eca5d = false;
    let _0x2715ce = false;
    const _0x1b1c0b = h('div', {
      class: 'wc-stack',
    });
    const _0x257f5d = h('div', {
      class: 'wc-stack',
    });
    function _0x2e1464() {
      clear(_0x1b1c0b);
      if (!_0x56de9f.length) {
        return;
      }
      const _0x4521ee = _0x56de9f.filter(
        (_0x42fdec) => _0x42fdec.exists,
      ).length;
      _0x1b1c0b.appendChild(
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x133a25.chip(_0x4521ee + ' on WhatsApp', 'ok'),
          _0x133a25.chip(_0x56de9f.length - _0x4521ee + ' not found', 'danger'),
          _0x133a25.button('Copy numbers on WhatsApp', {
            size: 'sm',
            icon: 'copy',
            onClick: () =>
              navigator.clipboard
                .writeText(
                  _0x56de9f
                    .filter((_0x166157) => _0x166157.exists)
                    .map((_0x5a517d) => _0x5a517d.phone)
                    .join('\n'),
                )
                .then(() => _0x133a25.toast('Copied', 'success')),
          }),
          _0x133a25.button('Download CSV', {
            size: 'sm',
            icon: 'file-down',
            onClick: () =>
              download(
                'number-check.csv',
                toCsv(
                  [['Phone', 'Name', 'On WhatsApp', 'Business']].concat(
                    _0x56de9f.map((_0x4af652) => [
                      _0x4af652.phone,
                      _0x4af652.name || '',
                      _0x4af652.exists ? 'Yes' : 'No',
                      _0x4af652.business ? 'Yes' : '',
                    ]),
                  ),
                ),
                'text/csv',
              ),
          }),
        ),
      );
      _0x1b1c0b.appendChild(
        _0x133a25.table(
          ['Number', 'Name', 'On WhatsApp'],
          _0x56de9f
            .slice()
            .reverse()
            .slice(0, 300)
            .map((_0x9af095) => [
              '+' + _0x9af095.phone,
              _0x9af095.name || '',
              _0x9af095.exists
                ? _0x133a25.chip(
                    _0x9af095.business ? 'Yes, business' : 'Yes',
                    'ok',
                  )
                : _0x133a25.chip('No', 'danger'),
            ]),
        ),
      );
    }
    async function _0x270874() {
      if (_0x2eca5d) {
        return;
      }
      if (!_0x3a5b50.length) {
        _0x133a25.toast('Add some numbers first.', 'info');
        return;
      }
      _0x2eca5d = true;
      _0x2715ce = false;
      _0x56de9f.length = 0;
      _0x2e1464();
      for (let _0x32da94 = 0; _0x32da94 < _0x3a5b50.length; _0x32da94++) {
        if (_0x2715ce) {
          break;
        }
        const _0x37714d = digits(_0x3a5b50[_0x32da94].phone);
        try {
          const _0xb4f605 = await _0x56cc85.wa.exists(_0x37714d);
          _0x56de9f.push({
            phone: _0x37714d,
            name: _0x3a5b50[_0x32da94].name,
            exists: !!_0xb4f605,
            business: _0xb4f605 && _0xb4f605.business,
          });
        } catch (_0x1ce1dd) {
          _0x133a25.toast(_0x1ce1dd.message, 'error');
          break;
        }
        clear(_0x257f5d);
        _0x257f5d.appendChild(
          _0x133a25.progress(
            Math.round(((_0x32da94 + 1) / _0x3a5b50.length) * 100),
          ),
        );
        _0x2e1464();
        await sleep(500 + Math.random() * 700);
      }
      _0x2eca5d = false;
      clear(_0x257f5d);
    }
    const _0x26f9fe = numbersEditor(_0x56cc85, {
      value: [],
      onChange: (_0xb7cf95) => {
        _0x3a5b50 = _0xb7cf95;
      },
    });
    _0x200a21.onDispose(() => {
      _0x2715ce = true;
    });
    return h(
      'div',
      {
        class: 'wc-screen wc-form wc-narrow',
      },
      _0x133a25.section(
        'Numbers to check',
        [
          _0x26f9fe,
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x133a25.button('Check numbers', {
              icon: 'play',
              variant: 'primary',
              onClick: _0x270874,
            }),
            _0x133a25.button('Stop', {
              icon: 'circle-stop',
              onClick: () => {
                _0x2715ce = true;
              },
            }),
          ),
          _0x257f5d,
        ],
        {
          card: true,
        },
      ),
      _0x1b1c0b,
    );
  },
};
export const exportPanel = {
  id: 'export-contacts',
  title: 'Export Contacts',
  subtitle: 'Download your chats and contacts as a spreadsheet.',
  icon: 'download',
  render(_0x1f0cdd) {
    const { app: _0x2bea92 } = _0x1f0cdd;
    const _0x26751a = {
      scope: 'chats',
      tabId: '',
      stageId: '',
      tagId: '',
      labelIds: [],
      groupIds: [],
      format: 'csv',
      sort: 'name',
    };
    const _0x251596 = h(
      'span',
      {
        class: 'wc-muted',
      },
      '',
    );
    async function _0x18c6d0() {
      const _0x15cd04 = await _0x2bea92.wa.listChats({});
      const _0x98c33a = new Map(
        (await _0x2bea92.wa.labels().catch(() => [])).map((_0x242ebc) => [
          String(_0x242ebc.id),
          _0x242ebc.name,
        ]),
      );
      let _0x196f17 = _0x15cd04.filter(
        (_0x56a2ce) => !_0x56a2ce.isBroadcast && !_0x56a2ce.isNewsletter,
      );
      if (_0x26751a.scope === 'chats') {
        _0x196f17 = _0x196f17.filter((_0x43f59a) => !_0x43f59a.isGroup);
      } else if (_0x26751a.scope === 'saved') {
        _0x196f17 = _0x196f17.filter(
          (_0x22552e) => !_0x22552e.isGroup && _0x22552e.isMyContact,
        );
      } else if (_0x26751a.scope === 'tab') {
        const _0x3b2b97 = _0x2bea92.store.get('tabs', _0x26751a.tabId);
        _0x196f17 = _0x196f17.filter(
          (_0x967b54) =>
            _0x3b2b97 && (_0x3b2b97.members || []).includes(_0x967b54.id),
        );
      } else if (_0x26751a.scope === 'stage') {
        const _0x4b99c1 = new Set(
          _0x2bea92.crm
            .cards(_0x26751a.stageId)
            .map((_0x2da68f) => _0x2da68f.chatId),
        );
        _0x196f17 = _0x196f17.filter((_0x4c4ca0) =>
          _0x4b99c1.has(_0x4c4ca0.id),
        );
      } else if (_0x26751a.scope === 'tag') {
        _0x196f17 = _0x196f17.filter((_0x19ddc7) =>
          (_0x2bea92.crm.contact(_0x19ddc7.id).tagIds || []).includes(
            _0x26751a.tagId,
          ),
        );
      } else if (_0x26751a.scope === 'label') {
        _0x196f17 = _0x196f17.filter((_0x17718e) =>
          (_0x17718e.labels || []).some((_0x430ead) =>
            _0x26751a.labelIds.includes(String(_0x430ead)),
          ),
        );
      }
      if (_0x26751a.sort === 'name') {
        _0x196f17 = _0x196f17.sort((_0xd5648, _0xb54e8b) =>
          String(_0xd5648.name).localeCompare(String(_0xb54e8b.name)),
        );
      }
      return _0x196f17.map((_0x2f988d) => {
        const _0x340907 = _0x2bea92.crm.contact(_0x2f988d.id);
        return {
          Name: _0x340907.fullName || _0x2f988d.name,
          Phone: _0x2f988d.phone ? '+' + _0x2f988d.phone : '',
          Email: _0x340907.email || '',
          Type: _0x2f988d.isGroup
            ? 'Group'
            : _0x2f988d.isBusiness
              ? 'Business'
              : 'Contact',
          Tags: _0x2bea92.crm
            .tagsOf(_0x2f988d.id)
            .map((_0x1d9305) => _0x1d9305.name)
            .join('; '),
          Labels: (_0x2f988d.labels || [])
            .map((_0x17971d) => _0x98c33a.get(String(_0x17971d)) || '')
            .filter(Boolean)
            .join('; '),
          Board: _0x2bea92.crm.boardLabel(_0x2f988d.id),
          Notes: String(_0x2bea92.crm.notes(_0x2f988d.id).length),
        };
      });
    }
    async function _0x2a5b17() {
      _0x251596.textContent = 'Preparing...';
      try {
        if (_0x26751a.scope === 'members') {
          if (!_0x26751a.groupIds.length) {
            _0x251596.textContent = 'Choose at least one group.';
            return;
          }
          const _0x305f99 = [];
          for (const _0x52c44c of _0x26751a.groupIds) {
            for (const _0x26cfe8 of await _0x2bea92.wa.participants(
              _0x52c44c,
            )) {
              _0x305f99.push({
                Group: _0x2bea92.wa.chatName(_0x52c44c),
                Name: _0x26cfe8.name || '',
                Phone: _0x26cfe8.phone ? '+' + _0x26cfe8.phone : '',
                Admin: _0x26cfe8.isAdmin ? 'Yes' : '',
              });
            }
          }
          download(
            'group-members.csv',
            toCsv(
              [
                Object.keys(
                  _0x305f99[0] || {
                    Group: '',
                    Name: '',
                    Phone: '',
                    Admin: '',
                  },
                ),
              ].concat(_0x305f99.map((_0x57a90c) => Object.values(_0x57a90c))),
            ),
            'text/csv',
          );
          _0x251596.textContent =
            plural(_0x305f99.length, 'member') + ' exported.';
          return;
        }
        if (_0x26751a.scope === 'label' && !_0x26751a.labelIds.length) {
          _0x251596.textContent = 'Choose at least one label.';
          return;
        }
        const _0x51083e = await _0x18c6d0();
        if (!_0x51083e.length) {
          _0x251596.textContent = 'Nothing matches those settings.';
          return;
        }
        if (_0x26751a.format === 'json') {
          download(
            'contacts.json',
            JSON.stringify(_0x51083e, null, 2),
            'application/json',
          );
        } else {
          download(
            'contacts.csv',
            toCsv(
              [Object.keys(_0x51083e[0])].concat(
                _0x51083e.map((_0xca33ae) => Object.values(_0xca33ae)),
              ),
            ),
            'text/csv',
          );
        }
        _0x251596.textContent = plural(_0x51083e.length, 'row') + ' exported.';
      } catch (_0x34662f) {
        _0x251596.textContent = _0x34662f.message;
      }
    }
    const _0x4ecbcc = h('div', {
      class: 'wc-stack',
    });
    function _0x37cf1c() {
      clear(_0x4ecbcc);
      if (_0x26751a.scope === 'tab') {
        _0x4ecbcc.appendChild(
          _0x133a25.field(
            'Tab',
            _0x133a25.select(
              [
                {
                  value: '',
                  label: 'Choose a tab',
                },
              ].concat(
                _0x2bea92.crm.tabs().map((_0x2e6c09) => ({
                  value: _0x2e6c09.id,
                  label: _0x2e6c09.title,
                })),
              ),
              _0x26751a.tabId,
              (_0x166b40) => {
                _0x26751a.tabId = _0x166b40;
              },
            ),
          ),
        );
      }
      if (_0x26751a.scope === 'stage') {
        _0x4ecbcc.appendChild(
          _0x133a25.field(
            'Kanban board',
            _0x133a25.select(
              [
                {
                  value: '',
                  label: 'Choose a board',
                },
              ].concat(
                _0x2bea92.crm.stageOptions().map((_0x3a5229) => ({
                  value: _0x3a5229.value,
                  label: _0x3a5229.label,
                })),
              ),
              _0x26751a.stageId,
              (_0x367ef5) => {
                _0x26751a.stageId = _0x367ef5;
              },
            ),
          ),
        );
      }
      if (_0x26751a.scope === 'tag') {
        _0x4ecbcc.appendChild(
          _0x133a25.field(
            'Tag',
            _0x133a25.select(
              [
                {
                  value: '',
                  label: 'Choose a tag',
                },
              ].concat(
                _0x2bea92.crm.tags().map((_0x2c9821) => ({
                  value: _0x2c9821.id,
                  label: _0x2c9821.name,
                })),
              ),
              _0x26751a.tagId,
              (_0x333997) => {
                _0x26751a.tagId = _0x333997;
              },
            ),
          ),
        );
      }
      if (_0x26751a.scope === 'label') {
        const _0x318b50 = _0x133a25.multiSelect({
          options: [],
          value: _0x26751a.labelIds,
          placeholder: 'Choose labels',
          emptyText: 'No labels found',
          onChange: (_0xd17fab) => {
            _0x26751a.labelIds = _0xd17fab;
          },
        });
        _0x2bea92.wa
          .labels()
          .then((_0x4fc11f) => {
            _0x318b50.setOptions(
              _0x4fc11f.map((_0x3f5c97) => ({
                value: String(_0x3f5c97.id),
                label: _0x3f5c97.name,
                color: _0x3f5c97.color,
              })),
            );
            if (!_0x4fc11f.length) {
              _0x251596.textContent =
                'No labels found. Labels are a WhatsApp Business feature.';
            }
          })
          .catch(() => {});
        _0x4ecbcc.appendChild(
          _0x133a25.field('Labels', _0x318b50, {
            hint: 'Chats with any of the labels you choose.',
          }),
        );
      }
      if (_0x26751a.scope === 'members') {
        _0x4ecbcc.appendChild(
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x133a25.button('Choose groups', {
              icon: 'users',
              onClick: async () => {
                const _0x3fbe16 = await pickChats(_0x2bea92, {
                  title: 'Choose groups',
                  users: false,
                  selected: _0x26751a.groupIds,
                });
                if (_0x3fbe16) {
                  _0x26751a.groupIds = _0x3fbe16;
                  _0x251596.textContent =
                    plural(_0x3fbe16.length, 'group') + ' chosen';
                }
              },
            }),
          ),
        );
      }
    }
    return h(
      'div',
      {
        class: 'wc-screen wc-form wc-narrow',
      },
      _0x133a25.section(
        'What to export',
        [
          _0x133a25.field(
            'Who',
            _0x133a25.select(
              [
                {
                  value: 'chats',
                  label: 'All one to one chats',
                },
                {
                  value: 'saved',
                  label: 'Saved contacts only',
                },
                {
                  value: 'tab',
                  label: 'Chats in a custom tab',
                },
                {
                  value: 'stage',
                  label: 'Chats on a Kanban board',
                },
                {
                  value: 'tag',
                  label: 'Contacts with a tag',
                },
                {
                  value: 'label',
                  label: 'Chats with a WhatsApp label',
                },
                {
                  value: 'members',
                  label: 'Members of groups',
                },
              ],
              _0x26751a.scope,
              (_0x51b0f8) => {
                _0x26751a.scope = _0x51b0f8;
                _0x37cf1c();
              },
            ),
          ),
          _0x4ecbcc,
          _0x133a25.row(
            _0x133a25.field(
              'File type',
              _0x133a25.select(
                [
                  {
                    value: 'csv',
                    label: 'CSV (opens in Excel)',
                  },
                  {
                    value: 'json',
                    label: 'JSON',
                  },
                ],
                _0x26751a.format,
                (_0x6d5b20) => {
                  _0x26751a.format = _0x6d5b20;
                },
              ),
            ),
            _0x133a25.field(
              'Sort',
              _0x133a25.select(
                [
                  {
                    value: 'name',
                    label: 'By name',
                  },
                  {
                    value: 'recent',
                    label: 'Most recent first',
                  },
                ],
                _0x26751a.sort,
                (_0x5867d8) => {
                  _0x26751a.sort = _0x5867d8;
                },
              ),
            ),
          ),
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x133a25.button('Export', {
              icon: 'download',
              variant: 'primary',
              onClick: _0x2a5b17,
            }),
            _0x251596,
          ),
        ],
        {
          card: true,
        },
      ),
    );
  },
};
export const backupPanel = {
  id: 'import-export',
  title: 'Import and Export Data',
  subtitle:
    'Back up everything, move to another browser, or import contacts from a spreadsheet.',
  icon: 'file-spreadsheet',
  render(_0x4303d4) {
    const { app: _0x381bb4 } = _0x4303d4;
    const _0x52e51a = h('div', {
      class: 'wc-stack',
    });
    let _0x3d4d4e = true;
    async function _0x44d147() {
      const _0x5f1a61 = await _0x381bb4.store.exportAll(_0x3d4d4e);
      const _0x3f30ac = JSON.stringify(_0x5f1a61);
      download(
        brand().toLowerCase() +
          '-backup-' +
          new Date().toISOString().slice(0, 10) +
          '.json',
        _0x3f30ac,
        'application/json',
      );
      _0x52e51a.textContent = '';
      _0x52e51a.appendChild(
        _0x133a25.banner(
          'Backup saved (' + bytesToSize(_0x3f30ac.length) + ').',
          'info',
          'circle-check',
        ),
      );
    }
    async function _0xe5adb6(_0x2be9a3) {
      const [_0x437a2c] = await _0x133a25.pickFiles(
        '.json,application/json',
        false,
      );
      if (!_0x437a2c) {
        return;
      }
      let _0x854fa5;
      try {
        _0x854fa5 = JSON.parse(await _0x437a2c.text());
      } catch (_0x420113) {
        _0x133a25.toast('That file is not valid JSON.', 'error');
        return;
      }
      const _0x162d7d =
        _0x2be9a3 === 'replace'
          ? 'This replaces your current data with the backup. Continue?'
          : 'This adds the backup to your current data. Continue?';
      if (
        !(await _0x133a25.confirmDialog(_0x162d7d, {
          danger: _0x2be9a3 === 'replace',
          confirmLabel: _0x2be9a3 === 'replace' ? 'Replace my data' : 'Import',
        }))
      ) {
        return;
      }
      try {
        await _0x381bb4.store.importAll(_0x854fa5, _0x2be9a3);
        await _0x381bb4.crm.ensureDashboards();
        _0x133a25.toast('Backup restored.', 'success');
      } catch (_0x3562e2) {
        _0x133a25.toast(_0x3562e2.message, 'error');
      }
    }
    async function _0x3a7d46() {
      const [_0x4f3705] = await _0x133a25.pickFiles('.csv,text/csv', false);
      if (!_0x4f3705) {
        return;
      }
      const _0x461308 = parseCsv(await _0x4f3705.text());
      if (_0x461308.length < 2) {
        _0x133a25.toast(
          'The file needs a header row and at least one contact.',
          'error',
        );
        return;
      }
      const _0x31a692 = _0x461308[0].map((_0xefc619) =>
        _0xefc619.trim().toLowerCase(),
      );
      const _0x1d7fa7 = (..._0x1212d7) =>
        _0x31a692.findIndex((_0x159ee9) => _0x1212d7.includes(_0x159ee9));
      const _0x4706ec = _0x1d7fa7('name', 'full name', 'fullname');
      const _0xf6a6a5 = _0x1d7fa7('phone', 'mobile', 'number', 'phone number');
      const _0x4ab642 = _0x1d7fa7('email');
      const _0x6aeafb = _0x1d7fa7('tags', 'tag');
      if (_0xf6a6a5 < 0) {
        _0x133a25.toast('Add a "phone" column to the first row.', 'error');
        return;
      }
      const _0x2f17e4 = _0x381bb4.crm.fields();
      let _0x549224 = 0;
      let _0x594d5c = 0;
      clear(_0x52e51a);
      const _0x3d0e79 = _0x133a25.progress(0);
      _0x52e51a.appendChild(_0x3d0e79);
      for (let _0x2b34e6 = 1; _0x2b34e6 < _0x461308.length; _0x2b34e6++) {
        const _0x112f8a = _0x461308[_0x2b34e6];
        const _0x5eef5b = digits(_0x112f8a[_0xf6a6a5]);
        if (_0x5eef5b.length < 7) {
          _0x594d5c++;
          continue;
        }
        const _0x54fa29 =
          (await _0x381bb4.wa.resolveTarget(_0x5eef5b)) || _0x5eef5b + '@c.us';
        const _0x52a1c9 = {
          phone: _0x5eef5b,
        };
        if (_0x4706ec >= 0 && _0x112f8a[_0x4706ec]) {
          _0x52a1c9.fullName = _0x112f8a[_0x4706ec].trim();
        }
        if (_0x4ab642 >= 0 && _0x112f8a[_0x4ab642]) {
          _0x52a1c9.email = _0x112f8a[_0x4ab642].trim();
        }
        const _0x505a63 = Object.assign(
          {},
          _0x381bb4.crm.contact(_0x54fa29).attributes,
        );
        for (const _0x2190a3 of _0x2f17e4) {
          const _0x4bd9d8 = _0x1d7fa7(
            _0x2190a3.label.toLowerCase(),
            _0x2190a3.key,
          );
          if (
            _0x4bd9d8 >= 0 &&
            _0x112f8a[_0x4bd9d8] !== undefined &&
            _0x112f8a[_0x4bd9d8] !== ''
          ) {
            _0x505a63[_0x2190a3.key] = _0x112f8a[_0x4bd9d8];
          }
        }
        _0x52a1c9.attributes = _0x505a63;
        await _0x381bb4.crm.saveContact(_0x54fa29, _0x52a1c9);
        if (_0x6aeafb >= 0 && _0x112f8a[_0x6aeafb]) {
          const _0x522994 = [];
          for (const _0x16bb95 of _0x112f8a[_0x6aeafb]
            .split(/[;|]/)
            .map((_0x203abe) => _0x203abe.trim())
            .filter(Boolean)) {
            let _0x19c68a = _0x381bb4.crm
              .tags()
              .find(
                (_0x31a91f) =>
                  _0x31a91f.name.toLowerCase() === _0x16bb95.toLowerCase(),
              );
            if (!_0x19c68a) {
              _0x19c68a = await _0x381bb4.crm.saveTag({
                name: _0x16bb95,
              });
            }
            _0x522994.push(_0x19c68a.id);
          }
          if (_0x522994.length) {
            await _0x381bb4.crm.addTags(_0x54fa29, _0x522994);
          }
        }
        _0x549224++;
        _0x3d0e79.firstChild.style.width =
          Math.round((_0x2b34e6 / (_0x461308.length - 1)) * 100) + '%';
      }
      clear(_0x52e51a);
      _0x52e51a.appendChild(
        _0x133a25.banner(
          'Imported ' +
            plural(_0x549224, 'contact') +
            (_0x594d5c
              ? ', skipped ' + _0x594d5c + ' without a valid number'
              : '') +
            '.',
          'info',
          'circle-check',
        ),
      );
    }
    function _0x45b2fb() {
      const _0x35c473 = _0x381bb4.crm.fields();
      const _0x483b00 = ['Name', 'Phone', 'Email', 'Tags', 'Board'].concat(
        _0x35c473.map((_0x116c4e) => _0x116c4e.label),
      );
      const _0x186c20 = _0x381bb4.store.all('contacts').map((_0x7f186c) => {
        return [
          _0x7f186c.fullName || '',
          _0x7f186c.phone ? '+' + _0x7f186c.phone : '',
          _0x7f186c.email || '',
          _0x381bb4.crm
            .tagsOf(_0x7f186c.chatId)
            .map((_0x3a43ef) => _0x3a43ef.name)
            .join('; '),
          _0x381bb4.crm.boardLabel(_0x7f186c.chatId),
        ].concat(
          _0x35c473.map((_0x3808fc) => {
            const _0x483711 = (_0x7f186c.attributes || {})[_0x3808fc.key];
            if (Array.isArray(_0x483711)) {
              return _0x483711.join('; ');
            } else {
              return _0x483711 || '';
            }
          }),
        );
      });
      download(
        'crm-contacts.csv',
        toCsv([_0x483b00].concat(_0x186c20)),
        'text/csv',
      );
    }
    return h(
      'div',
      {
        class: 'wc-screen wc-form wc-narrow',
      },
      _0x133a25.section(
        'Full backup',
        [
          h(
            'p',
            {
              class: 'wc-muted',
            },
            'Everything you have set up: contacts, notes, boards, bots, chatbots, templates, campaigns and settings (including AI keys).',
          ),
          _0x133a25.checkbox(
            true,
            (_0x631b) => {
              _0x3d4d4e = _0x631b;
            },
            'Include attached files',
          ),
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x133a25.button('Download backup', {
              icon: 'download',
              variant: 'primary',
              onClick: _0x44d147,
            }),
            _0x133a25.button('Add a backup to my data', {
              icon: 'file-up',
              onClick: () => _0xe5adb6('merge'),
            }),
            _0x133a25.button('Replace my data with a backup', {
              icon: 'rotate-ccw',
              variant: 'danger',
              onClick: () => _0xe5adb6('replace'),
            }),
          ),
        ],
        {
          card: true,
        },
      ),
      _0x133a25.section(
        'CRM contacts',
        [
          h(
            'p',
            {
              class: 'wc-muted',
            },
            'Import from a CSV with columns such as name, phone, email, tags and any of your custom field names.',
          ),
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x133a25.button('Import contacts from CSV', {
              icon: 'file-up',
              onClick: _0x3a7d46,
            }),
            _0x133a25.button('Export CRM contacts', {
              icon: 'file-down',
              onClick: _0x45b2fb,
            }),
          ),
        ],
        {
          card: true,
        },
      ),
      _0x52e51a,
    );
  },
};
export const groupToolsPanel = {
  id: 'group-tools',
  title: 'Group Tools',
  subtitle:
    'Clone groups, find members who are in several groups, and add people in bulk.',
  icon: 'users',
  render(_0x26c67d) {
    const { app: _0x1e37e4 } = _0x26c67d;
    const _0xfea23b = h('div', {
      class: 'wc-stack',
    });
    const _0x55f140 = (_0x196a3d) => {
      clear(_0xfea23b);
      _0xfea23b.appendChild(_0x196a3d);
    };
    async function _0x598a0d(_0x26e464) {
      const _0x22f8cc = await _0x1e37e4.wa
        .iAmAdmin(_0x26e464)
        .catch(() => false);
      if (!_0x22f8cc) {
        _0x133a25.toast('You must be an admin of that group.', 'error');
      }
      return _0x22f8cc;
    }
    async function _0x11dbb2() {
      const [_0x189670] =
        (await pickChats(_0x1e37e4, {
          title: 'Choose a group to clone',
          users: false,
          single: true,
        })) || [];
      if (!_0x189670) {
        return;
      }
      const _0x5e9d81 = await _0x3c2a1f(
        'Name for the new group',
        _0x1e37e4.wa.chatName(_0x189670) + ' (copy)',
      );
      if (!_0x5e9d81) {
        return;
      }
      try {
        const _0x27f42f = (await _0x1e37e4.wa.participants(_0x189670)).filter(
          (_0x2680ac) => _0x2680ac.id,
        );
        const _0x2fa190 = await _0x1e37e4.wa.createGroup(
          _0x5e9d81,
          _0x27f42f.map((_0x5c6f40) => _0x5c6f40.id),
        );
        _0x55f140(
          _0x133a25.banner(
            'Created "' +
              _0x5e9d81 +
              '" with ' +
              plural(_0x27f42f.length, 'member') +
              '.',
            'info',
            'circle-check',
          ),
        );
        return _0x2fa190;
      } catch (_0x38bb9c) {
        _0x55f140(_0x133a25.banner(_0x38bb9c.message, 'danger'));
      }
    }
    async function _0xc8e134() {
      const _0x3b49e1 = await pickChats(_0x1e37e4, {
        title: 'Choose groups to compare',
        users: false,
      });
      if (!_0x3b49e1 || _0x3b49e1.length < 2) {
        if (_0x3b49e1) {
          _0x133a25.toast('Choose at least two groups.', 'info');
        }
        return;
      }
      _0x55f140(
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Comparing...',
        ),
      );
      try {
        const _0x24dfcd = new Map();
        for (const _0x276e18 of _0x3b49e1) {
          for (const _0x173266 of await _0x1e37e4.wa.participants(_0x276e18)) {
            const _0x260bc1 = _0x173266.id;
            if (!_0x24dfcd.has(_0x260bc1)) {
              _0x24dfcd.set(_0x260bc1, {
                name: _0x173266.name,
                phone: _0x173266.phone,
                groups: [],
              });
            }
            _0x24dfcd
              .get(_0x260bc1)
              .groups.push(_0x1e37e4.wa.chatName(_0x276e18));
          }
        }
        const _0x4204b9 = Array.from(_0x24dfcd.values()).filter(
          (_0x1a1410) => _0x1a1410.groups.length > 1,
        );
        _0x55f140(
          h(
            'div',
            {
              class: 'wc-stack',
            },
            _0x133a25.banner(
              _0x4204b9.length
                ? plural(_0x4204b9.length, 'person', 'people') +
                    ' appear in more than one of those groups.'
                : 'No one is in more than one of those groups.',
              'info',
            ),
            _0x4204b9.length
              ? _0x133a25.table(
                  ['Name', 'Number', 'Groups'],
                  _0x4204b9.map((_0x427d9b) => [
                    _0x427d9b.name || '',
                    _0x427d9b.phone ? '+' + _0x427d9b.phone : '',
                    _0x427d9b.groups.join(', '),
                  ]),
                )
              : null,
            _0x4204b9.length
              ? _0x133a25.button('Download CSV', {
                  icon: 'file-down',
                  size: 'sm',
                  onClick: () =>
                    download(
                      'duplicates.csv',
                      toCsv(
                        [['Name', 'Number', 'Groups']].concat(
                          _0x4204b9.map((_0x1e7f4e) => [
                            _0x1e7f4e.name,
                            _0x1e7f4e.phone,
                            _0x1e7f4e.groups.join('; '),
                          ]),
                        ),
                      ),
                      'text/csv',
                    ),
                })
              : null,
          ),
        );
      } catch (_0x2424e7) {
        _0x55f140(_0x133a25.banner(_0x2424e7.message, 'danger'));
      }
    }
    async function _0x4bd538() {
      const [_0x8e5ca6] =
        (await pickChats(_0x1e37e4, {
          title: 'Add people to which group?',
          users: false,
          single: true,
        })) || [];
      if (!_0x8e5ca6 || !(await _0x598a0d(_0x8e5ca6))) {
        return;
      }
      let _0x31ab9a = [];
      const _0x25e3de = h(
        'div',
        {
          class: 'wc-stack',
        },
        numbersEditor(_0x1e37e4, {
          value: [],
          onChange: (_0x34ff72) => {
            _0x31ab9a = _0x34ff72;
          },
        }),
      );
      const _0x4e480f = _0x133a25.openModal({
        title: 'Add people to ' + _0x1e37e4.wa.chatName(_0x8e5ca6),
        width: 520,
        body: _0x25e3de,
        footer: h(
          'div',
          {
            class: 'wc-modal-actions',
          },
          _0x133a25.button('Cancel', {
            variant: 'dark',
            onClick: () => _0x4e480f.close(),
          }),
          _0x133a25.button('Add to group', {
            variant: 'primary',
            onClick: async () => {
              _0x4e480f.close();
              _0x55f140(
                h(
                  'span',
                  {
                    class: 'wc-muted',
                  },
                  'Adding...',
                ),
              );
              let _0xe663ed = 0;
              let _0x4d112a = 0;
              for (const _0x31c895 of _0x31ab9a) {
                const _0x24b5e6 = await _0x1e37e4.wa.resolveTarget(
                  _0x31c895.phone || _0x31c895.chatId,
                );
                if (!_0x24b5e6) {
                  _0x4d112a++;
                  continue;
                }
                try {
                  await _0x1e37e4.wa.groupAdd(_0x8e5ca6, _0x24b5e6);
                  _0xe663ed++;
                } catch (_0x344642) {
                  _0x4d112a++;
                }
                await sleep(1500 + Math.random() * 1500);
              }
              _0x55f140(
                _0x133a25.banner(
                  'Added ' +
                    _0xe663ed +
                    '. ' +
                    (_0x4d112a
                      ? _0x4d112a +
                        ' could not be added (not on WhatsApp, or privacy settings).'
                      : ''),
                  'info',
                  'circle-check',
                ),
              );
            },
          }),
        ),
      });
    }
    function _0x3c2a1f(_0x56fd2d, _0x46acf9) {
      return new Promise((_0x1dadf8) => {
        const _0x41c8e7 = _0x133a25.input({
          value: _0x46acf9,
          onEnter: () => {
            _0x1dadf8(_0x41c8e7.value.trim());
            _0x46312b.close();
          },
        });
        const _0x46312b = _0x133a25.openModal({
          title: _0x56fd2d,
          width: 420,
          onClose: () => _0x1dadf8(''),
          body: _0x41c8e7,
          footer: h(
            'div',
            {
              class: 'wc-modal-actions',
            },
            _0x133a25.button('Cancel', {
              variant: 'dark',
              onClick: () => _0x46312b.close(),
            }),
            _0x133a25.button('OK', {
              variant: 'primary',
              onClick: () => {
                _0x1dadf8(_0x41c8e7.value.trim());
                _0x46312b.close();
              },
            }),
          ),
        });
        _0x41c8e7.focus();
      });
    }
    const _0x24ab16 = (_0x32bd0b, _0x2670ec, _0x4098b7, _0x1bb98c) =>
      h(
        'button',
        {
          class: 'wc-card wc-tool',
          type: 'button',
          onClick: _0x1bb98c,
        },
        h(
          'span',
          {
            class: 'wc-tool-icon',
          },
          icon(_0x32bd0b, 22),
        ),
        h('strong', null, _0x2670ec),
        h('span', null, _0x4098b7),
      );
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      _0x133a25.banner(
        'Adding people needs you to be a group admin. WhatsApp may limit how many people you can add at once.',
        'info',
      ),
      h(
        'div',
        {
          class: 'wc-grid wc-grid-3',
        },
        _0x24ab16(
          'copy-plus',
          'Clone a group',
          'Create a new group with the same members.',
          _0x11dbb2,
        ),
        _0x24ab16(
          'scan-search',
          'Find duplicates',
          'See who is in more than one group.',
          _0xc8e134,
        ),
        _0x24ab16(
          'user-plus',
          'Add people in bulk',
          'Add a list of numbers to a group, slowly.',
          _0x4bd538,
        ),
      ),
      _0xfea23b,
    );
  },
};
export const linkPanel = {
  id: 'link-generator',
  title: 'Click-to-chat Link',
  subtitle:
    'Make a wa.me link and QR code that opens a chat with a ready message.',
  icon: 'qr-code',
  render(_0x5f500f) {
    const _0x4eafa7 = {
      phone: '',
      text: '',
    };
    const _0x3dbfe6 = h('div', {
      class: 'wc-stack',
    });
    const _0x138f75 = h('canvas', {
      class: 'wc-qr',
      width: 240,
      height: 240,
    });
    function _0x507a6d() {
      const _0x52a7a9 = digits(_0x4eafa7.phone);
      if (_0x52a7a9.length < 7) {
        return '';
      }
      return (
        'https://wa.me/' +
        _0x52a7a9 +
        (_0x4eafa7.text.trim()
          ? '?text=' + encodeURIComponent(_0x4eafa7.text)
          : '')
      );
    }
    function _0x2bcc37() {
      const _0x1a0cab = _0x507a6d();
      clear(_0x3dbfe6);
      const _0x17af9e = _0x138f75.getContext('2d');
      _0x17af9e.fillStyle = '#ffffff';
      _0x17af9e.fillRect(0, 0, 240, 240);
      if (!_0x1a0cab) {
        _0x3dbfe6.appendChild(
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'Enter a phone number with country code to see the link.',
          ),
        );
        return;
      }
      const _0x36b2a3 = qrcode(0, 'M');
      _0x36b2a3.addData(_0x1a0cab);
      _0x36b2a3.make();
      const _0x5ee80f = _0x36b2a3.getModuleCount();
      const _0x508d69 = Math.floor(216 / _0x5ee80f);
      const _0x2ac509 = Math.floor((240 - _0x508d69 * _0x5ee80f) / 2);
      _0x17af9e.fillStyle = '#111318';
      for (let _0x3a2e6f = 0; _0x3a2e6f < _0x5ee80f; _0x3a2e6f++) {
        for (let _0x26aaf9 = 0; _0x26aaf9 < _0x5ee80f; _0x26aaf9++) {
          if (_0x36b2a3.isDark(_0x3a2e6f, _0x26aaf9)) {
            _0x17af9e.fillRect(
              _0x2ac509 + _0x26aaf9 * _0x508d69,
              _0x2ac509 + _0x3a2e6f * _0x508d69,
              _0x508d69,
              _0x508d69,
            );
          }
        }
      }
      _0x3dbfe6.appendChild(
        h(
          'div',
          {
            class: 'wc-callout',
          },
          icon('link', 16),
          h(
            'span',
            {
              class: 'wc-mono wc-prewrap',
            },
            _0x1a0cab,
          ),
        ),
      );
      _0x3dbfe6.appendChild(
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x133a25.button('Copy link', {
            icon: 'copy',
            onClick: () =>
              navigator.clipboard
                .writeText(_0x1a0cab)
                .then(() => _0x133a25.toast('Link copied', 'success')),
          }),
          _0x133a25.button('Download QR code', {
            icon: 'download',
            onClick: () =>
              _0x138f75.toBlob((_0x3bf340) =>
                download('whatsapp-qr.png', _0x3bf340),
              ),
          }),
        ),
      );
    }
    _0x2bcc37();
    return h(
      'div',
      {
        class: 'wc-screen wc-form wc-narrow',
      },
      _0x133a25.section(
        'Your link',
        [
          _0x133a25.field(
            'Phone number',
            _0x133a25.input({
              placeholder: '+1 555 010 0101',
              onInput: (_0x33b2e4) => {
                _0x4eafa7.phone = _0x33b2e4;
                _0x2bcc37();
              },
            }),
            {
              hint: 'Include the country code.',
            },
          ),
          _0x133a25.field(
            'Ready-made message (optional)',
            _0x133a25.textarea({
              rows: 3,
              placeholder: 'Hi! I would like to know more.',
              onInput: (_0xff324d) => {
                _0x4eafa7.text = _0xff324d;
                _0x2bcc37();
              },
            }),
          ),
          _0x3dbfe6,
          h(
            'div',
            {
              class: 'wc-qrwrap',
            },
            _0x138f75,
          ),
        ],
        {
          card: true,
        },
      ),
    );
  },
};
