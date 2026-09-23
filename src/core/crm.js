import { uid, moveItem, betterName } from './util.js';
import { buildVars } from './variables.js';
const STAGE_NAME_MAX = 20;
const DASHBOARD_NAME_MAX = 30;
export const MAIN_DASHBOARD_ID = 'dash_main';
const TAB_NAME_MAX = 30;
export const DEFAULT_STAGES = [
  {
    name: 'New lead',
    color: '#7dd3fc',
    textColor: '#0b1a24',
  },
  {
    name: 'Contacted',
    color: '#fde047',
    textColor: '#24200b',
  },
  {
    name: 'Negotiation',
    color: '#c4b5fd',
    textColor: '#1b1233',
  },
  {
    name: 'Won',
    color: '#86efac',
    textColor: '#0b2414',
  },
];
export const DEFAULT_TAGS = [
  {
    name: 'Lead',
    color: '#7dd3fc',
  },
  {
    name: 'Customer',
    color: '#86efac',
  },
  {
    name: 'VIP',
    color: '#fde047',
  },
  {
    name: 'Follow up',
    color: '#fdba74',
  },
];
export const TAG_COLORS = [
  '#fde047',
  '#7dd3fc',
  '#86efac',
  '#f9a8d4',
  '#c4b5fd',
  '#fdba74',
  '#fca5a5',
  '#5eead4',
  '#e2e8f0',
];
export const FIELD_TYPES = [
  {
    id: 'text',
    label: 'Text',
  },
  {
    id: 'number',
    label: 'Number',
  },
  {
    id: 'date',
    label: 'Date',
  },
  {
    id: 'select',
    label: 'Single choice',
  },
  {
    id: 'multiselect',
    label: 'Multiple choice',
  },
];
export function createCrm({
  store: _0xf4a612,
  wa: _0x341937,
  emit: _0x58f14e,
} = {}) {
  const _0x352a87 = (_0x3989b6, _0x377176) => {
    if (_0x58f14e) {
      _0x58f14e(_0x3989b6, _0x377176);
    }
  };
  const _0x7591a9 = () => Date.now();
  const _0x57c03e = {
    async ensureDefaults() {
      await _0x57c03e.ensureDashboards();
      if (_0xf4a612.setting('defaultsCreated', false)) {
        return;
      }
      if (!_0xf4a612.count('kanbanStages')) {
        for (
          let _0x1425ee = 0;
          _0x1425ee < DEFAULT_STAGES.length;
          _0x1425ee++
        ) {
          await _0xf4a612.put(
            'kanbanStages',
            Object.assign(
              {
                order: _0x1425ee,
                dashboardId: _0x57c03e.mainDashboardId(),
              },
              DEFAULT_STAGES[_0x1425ee],
            ),
          );
        }
      }
      if (!_0xf4a612.count('tags')) {
        for (const _0x36733f of DEFAULT_TAGS) {
          await _0xf4a612.put('tags', _0x36733f);
        }
      }
      await _0xf4a612.setSetting('defaultsCreated', true);
    },
    contact(_0x14b869) {
      return (
        _0xf4a612.get('contacts', _0x14b869) || {
          id: _0x14b869,
          chatId: _0x14b869,
          tagIds: [],
          attributes: {},
        }
      );
    },
    hasContact(_0x2ddb16) {
      return !!_0xf4a612.get('contacts', _0x2ddb16);
    },
    async saveContact(_0x1762d2, _0x5c0d6c) {
      const _0x36ab39 = _0xf4a612.get('contacts', _0x1762d2) || {
        id: _0x1762d2,
        chatId: _0x1762d2,
        tagIds: [],
        attributes: {},
      };
      const _0x5c4eaa =
        _0x341937 && _0x341937.chatById ? _0x341937.chatById(_0x1762d2) : null;
      const _0x258705 = {
        fullName: '',
        phone: _0x36ab39.phone || (_0x5c4eaa && _0x5c4eaa.phone) || '',
      };
      const _0x2c7e1c = Object.assign({}, _0x258705, _0x36ab39, _0x5c0d6c, {
        id: _0x1762d2,
        chatId: _0x1762d2,
      });
      _0x2c7e1c.fullName = betterName(
        _0x2c7e1c.fullName,
        _0x5c4eaa && _0x5c4eaa.name,
      );
      const _0x254896 = await _0xf4a612.put('contacts', _0x2c7e1c);
      _0x352a87('crm:contact', {
        chatId: _0x1762d2,
        contact: _0x254896,
      });
      return _0x254896;
    },
    async setAttribute(_0x39d218, _0x2e29d7, _0x296a9e) {
      const _0x21e658 = _0x57c03e.contact(_0x39d218);
      return _0x57c03e.saveContact(_0x39d218, {
        attributes: Object.assign({}, _0x21e658.attributes, {
          [_0x2e29d7]: _0x296a9e,
        }),
      });
    },
    displayName(_0x56e87f) {
      const _0x2cbe52 = _0xf4a612.get('contacts', _0x56e87f);
      const _0x21e8c0 =
        _0x341937 && _0x341937.chatName
          ? _0x341937.chatName(_0x56e87f)
          : String(_0x56e87f).split('@')[0];
      return betterName(_0x2cbe52 && _0x2cbe52.fullName, _0x21e8c0);
    },
    vars(_0x4c8527, _0x2a08ad) {
      const _0x47fbd3 =
        _0x341937 && _0x341937.chatById ? _0x341937.chatById(_0x4c8527) : null;
      return buildVars({
        contact: _0x57c03e.contact(_0x4c8527),
        chat: _0x47fbd3,
        fields: _0x57c03e.fields(),
        settings: _0xf4a612.settings(),
        extra: _0x2a08ad,
      });
    },
    async deleteContact(_0x3ef31e) {
      await _0xf4a612.remove('contacts', _0x3ef31e);
    },
    tags() {
      return _0xf4a612.all('tags');
    },
    tagById(_0x231416) {
      return _0xf4a612.get('tags', _0x231416);
    },
    tagsOf(_0x5895cc) {
      return (_0x57c03e.contact(_0x5895cc).tagIds || [])
        .map((_0x4047d4) => _0xf4a612.get('tags', _0x4047d4))
        .filter(Boolean);
    },
    async saveTag(_0x875cb1) {
      const _0x11037c = String(_0x875cb1.name || '').trim();
      if (!_0x11037c) {
        throw new Error('Tag name is required.');
      }
      const _0xe149f3 = _0xf4a612.find(
        'tags',
        (_0x442b30) =>
          _0x442b30.name.toLowerCase() === _0x11037c.toLowerCase() &&
          _0x442b30.id !== _0x875cb1.id,
      );
      if (_0xe149f3) {
        throw new Error('A tag with this name already exists.');
      }
      return _0xf4a612.put(
        'tags',
        Object.assign(
          {
            color: TAG_COLORS[0],
          },
          _0x875cb1,
          {
            name: _0x11037c,
          },
        ),
      );
    },
    async deleteTag(_0x4c71a2) {
      await _0xf4a612.remove('tags', _0x4c71a2);
      for (const _0x4b5aa7 of _0xf4a612.all('contacts')) {
        if ((_0x4b5aa7.tagIds || []).includes(_0x4c71a2)) {
          await _0xf4a612.put(
            'contacts',
            Object.assign({}, _0x4b5aa7, {
              tagIds: _0x4b5aa7.tagIds.filter(
                (_0x584a55) => _0x584a55 !== _0x4c71a2,
              ),
            }),
          );
        }
      }
    },
    async addTags(_0x31d8b0, _0x56ac22) {
      const _0x4ef02c = _0x57c03e.contact(_0x31d8b0);
      const _0x35f27e = Array.from(
        new Set((_0x4ef02c.tagIds || []).concat(_0x56ac22)),
      );
      const _0x5e51b9 = _0x35f27e.filter(
        (_0x4177c2) => !(_0x4ef02c.tagIds || []).includes(_0x4177c2),
      );
      const _0x52a24d = await _0x57c03e.saveContact(_0x31d8b0, {
        tagIds: _0x35f27e,
      });
      for (const _0x55c118 of _0x5e51b9) {
        _0x352a87('crm:tag_added', {
          chatId: _0x31d8b0,
          tag: _0xf4a612.get('tags', _0x55c118),
        });
      }
      return _0x52a24d;
    },
    async removeTags(_0x42cf7b, _0x1d7e8b) {
      const _0x15bb6a = _0x57c03e.contact(_0x42cf7b);
      return _0x57c03e.saveContact(_0x42cf7b, {
        tagIds: (_0x15bb6a.tagIds || []).filter(
          (_0x51e6af) => !_0x1d7e8b.includes(_0x51e6af),
        ),
      });
    },
    fields() {
      return _0xf4a612.all('fields');
    },
    async saveField(_0x4bd3e4) {
      const _0x3524c3 = String(_0x4bd3e4.label || '').trim();
      if (!_0x3524c3) {
        throw new Error('Field name is required.');
      }
      const _0x18b82c =
        _0x4bd3e4.key ||
        _0x3524c3
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      if (!/^[a-z][a-z0-9_]*$/.test(_0x18b82c)) {
        throw new Error(
          'Field key must start with a letter and use letters, numbers and underscores.',
        );
      }
      const _0x2ff745 = _0xf4a612.find(
        'fields',
        (_0x501750) =>
          _0x501750.key === _0x18b82c && _0x501750.id !== _0x4bd3e4.id,
      );
      if (_0x2ff745) {
        throw new Error('A field with this key already exists.');
      }
      const _0x33b535 =
        _0x4bd3e4.order !== undefined
          ? _0x4bd3e4.order
          : _0xf4a612.count('fields');
      return _0xf4a612.put(
        'fields',
        Object.assign(
          {
            type: 'text',
            options: [],
          },
          _0x4bd3e4,
          {
            label: _0x3524c3,
            key: _0x18b82c,
            order: _0x33b535,
          },
        ),
      );
    },
    async deleteField(_0x1184d8) {
      await _0xf4a612.remove('fields', _0x1184d8);
    },
    notes(_0x2ee80b) {
      if (_0x2ee80b) {
        return _0xf4a612
          .filter('notes', (_0xa35c49) => _0xa35c49.chatId === _0x2ee80b)
          .sort(
            (_0x12864d, _0x4323b2) => _0x4323b2.createdAt - _0x12864d.createdAt,
          );
      } else {
        return _0xf4a612
          .all('notes')
          .slice()
          .sort(
            (_0x36c721, _0x305333) => _0x305333.updatedAt - _0x36c721.updatedAt,
          );
      }
    },
    async saveNote(_0x1004c1) {
      if (!String(_0x1004c1.title || '').trim()) {
        throw new Error('Title is required.');
      }
      if (!String(_0x1004c1.text || '').trim()) {
        throw new Error('Note content is required.');
      }
      if (!_0x1004c1.chatId) {
        throw new Error('Choose a contact for this note.');
      }
      const _0x1fafa6 = await _0xf4a612.put('notes', _0x1004c1);
      _0x352a87('crm:note', {
        note: _0x1fafa6,
      });
      return _0x1fafa6;
    },
    async deleteNotes(_0x191cc2) {
      for (const _0x2bea41 of [].concat(_0x191cc2)) {
        await _0xf4a612.remove('notes', _0x2bea41);
      }
    },
    reminders(_0x936152) {
      const _0x58083e = _0x936152
        ? _0xf4a612.filter(
            'reminders',
            (_0x47e9a0) => _0x47e9a0.chatId === _0x936152,
          )
        : _0xf4a612.all('reminders');
      return _0x58083e
        .slice()
        .sort((_0x111198, _0x55e9b4) => _0x111198.at - _0x55e9b4.at);
    },
    async saveReminder(_0x344962) {
      if (!String(_0x344962.title || '').trim()) {
        throw new Error('Title is required.');
      }
      if (!_0x344962.at) {
        throw new Error('Pick a date and time.');
      }
      if (!_0x344962.chatId) {
        throw new Error('Choose a contact for this reminder.');
      }
      const _0x17a8e8 =
        _0x344962.status || (_0x344962.at > _0x7591a9() ? 'pending' : 'unread');
      const _0x5954cd = Object.assign({}, _0x344962, {
        status: _0x17a8e8,
        notified:
          _0x344962.id &&
          _0xf4a612.get('reminders', _0x344962.id) &&
          _0xf4a612.get('reminders', _0x344962.id).at === _0x344962.at
            ? _0xf4a612.get('reminders', _0x344962.id).notified
            : false,
      });
      return _0xf4a612.put('reminders', _0x5954cd);
    },
    async markReminder(_0x46ca5d, _0x529d47) {
      return _0xf4a612.patch('reminders', _0x46ca5d, {
        status: _0x529d47,
      });
    },
    async deleteReminders(_0x13519e) {
      for (const _0x41c45d of [].concat(_0x13519e)) {
        await _0xf4a612.remove('reminders', _0x41c45d);
      }
    },
    dashboards() {
      return _0xf4a612.all('kanbanDashboards');
    },
    mainDashboardId() {
      const _0x1fb41e = _0x57c03e.dashboards();
      if (_0x1fb41e.length) {
        return _0x1fb41e[0].id;
      } else {
        return MAIN_DASHBOARD_ID;
      }
    },
    dashboardOf(_0x31e6a8) {
      return (
        (_0x31e6a8 && _0x31e6a8.dashboardId) || _0x57c03e.mainDashboardId()
      );
    },
    async ensureDashboards() {
      if (!_0xf4a612.count('kanbanDashboards')) {
        await _0xf4a612.put('kanbanDashboards', {
          id: MAIN_DASHBOARD_ID,
          name: 'Main',
          order: 0,
        });
      }
      const _0x34cc8c = _0x57c03e.mainDashboardId();
      for (const _0x5ea87a of _0xf4a612.all('kanbanStages')) {
        if (!_0x5ea87a.dashboardId) {
          await _0xf4a612.patch('kanbanStages', _0x5ea87a.id, {
            dashboardId: _0x34cc8c,
          });
        }
      }
    },
    dashboardName(_0x314514) {
      const _0x2ca146 = _0xf4a612.get(
        'kanbanDashboards',
        _0x57c03e.dashboardOf(_0x314514),
      );
      if (_0x2ca146) {
        return _0x2ca146.name;
      } else {
        return '';
      }
    },
    checkDashboardName(_0x362c25, _0x1fec6d) {
      const _0x21ad49 = String(_0x362c25 || '').trim();
      if (!_0x21ad49) {
        throw new Error('Enter a dashboard name.');
      }
      if (_0x21ad49.length > DASHBOARD_NAME_MAX) {
        throw new Error(
          'Maximum ' + DASHBOARD_NAME_MAX + ' characters allowed.',
        );
      }
      if (
        _0x57c03e
          .dashboards()
          .some(
            (_0x21d154) =>
              _0x21d154.id !== _0x1fec6d &&
              _0x21d154.name.toLowerCase() === _0x21ad49.toLowerCase(),
          )
      ) {
        throw new Error('You already have a dashboard with that name.');
      }
      return _0x21ad49;
    },
    async createDashboard(
      _0x3711ff,
      { boards = 'standard', copyFrom: _0x39b18a } = {},
    ) {
      const _0x2dd068 = _0x57c03e.checkDashboardName(_0x3711ff);
      const _0x3d54cb = await _0xf4a612.put('kanbanDashboards', {
        name: _0x2dd068,
        order: _0xf4a612.count('kanbanDashboards'),
      });
      const _0xe31ce7 = _0x39b18a
        ? _0x57c03e.stages(_0x39b18a).map((_0x489f0b) => ({
            name: _0x489f0b.name,
            color: _0x489f0b.color,
            textColor: _0x489f0b.textColor,
          }))
        : boards === 'standard'
          ? DEFAULT_STAGES
          : [];
      for (let _0x305945 = 0; _0x305945 < _0xe31ce7.length; _0x305945++) {
        await _0xf4a612.put(
          'kanbanStages',
          Object.assign(
            {
              order: _0x305945,
              collapsed: false,
            },
            _0xe31ce7[_0x305945],
            {
              dashboardId: _0x3d54cb.id,
            },
          ),
        );
      }
      return _0x3d54cb;
    },
    async renameDashboard(_0x638459, _0xeb83d) {
      const _0x47e92d = _0x57c03e.checkDashboardName(_0xeb83d, _0x638459);
      return _0xf4a612.patch('kanbanDashboards', _0x638459, {
        name: _0x47e92d,
      });
    },
    async deleteDashboard(_0x2e2b51) {
      if (_0x57c03e.dashboards().length <= 1) {
        throw new Error('Keep at least one dashboard.');
      }
      for (const _0x16e11e of _0x57c03e.stages(_0x2e2b51)) {
        await _0x57c03e.deleteStage(_0x16e11e.id);
      }
      await _0xf4a612.remove('kanbanDashboards', _0x2e2b51);
    },
    stageOptions() {
      const _0x35cd15 = _0x57c03e.dashboards();
      const _0x50cdda = _0x35cd15.length > 1;
      const _0x505ade = [];
      for (const _0x14b3d0 of _0x35cd15) {
        for (const _0x33f240 of _0x57c03e.stages(_0x14b3d0.id)) {
          _0x505ade.push({
            value: _0x33f240.id,
            label: _0x50cdda
              ? _0x14b3d0.name + ': ' + _0x33f240.name
              : _0x33f240.name,
            color: _0x33f240.color,
            textColor: _0x33f240.textColor,
          });
        }
      }
      return _0x505ade;
    },
    boardLabel(_0x3b3aec) {
      const _0x59f3f7 = _0x57c03e.dashboards();
      const _0x495f63 = _0x59f3f7
        .map((_0x368b03) => ({
          d: _0x368b03,
          s: _0x57c03e.stageOf(_0x3b3aec, _0x368b03.id),
        }))
        .filter((_0x31d5e1) => _0x31d5e1.s);
      if (_0x59f3f7.length > 1) {
        return _0x495f63
          .map((_0x43861c) => _0x43861c.d.name + ': ' + _0x43861c.s.name)
          .join('; ');
      } else if (_0x495f63[0]) {
        return _0x495f63[0].s.name;
      } else {
        return '';
      }
    },
    stages(_0x428533) {
      const _0x59a714 = _0xf4a612.all('kanbanStages');
      if (_0x428533) {
        return _0x59a714.filter(
          (_0x4d6902) => _0x57c03e.dashboardOf(_0x4d6902) === _0x428533,
        );
      } else {
        return _0x59a714;
      }
    },
    async saveStage(_0x1c948b) {
      const _0x49b8cf = String(_0x1c948b.name || '').trim();
      if (!_0x49b8cf) {
        throw new Error('Enter a board name.');
      }
      if (_0x49b8cf.length > STAGE_NAME_MAX) {
        throw new Error('Maximum ' + STAGE_NAME_MAX + ' characters allowed.');
      }
      const _0x3cbbc8 = _0x1c948b.dashboardId || _0x57c03e.mainDashboardId();
      const _0x3a45c4 =
        _0x1c948b.order !== undefined
          ? _0x1c948b.order
          : _0x57c03e.stages(_0x3cbbc8).length;
      return _0xf4a612.put(
        'kanbanStages',
        Object.assign(
          {
            color: '#fde047',
            textColor: '#24200b',
            collapsed: false,
          },
          _0x1c948b,
          {
            name: _0x49b8cf,
            order: _0x3a45c4,
            dashboardId: _0x3cbbc8,
          },
        ),
      );
    },
    async deleteStage(_0x451d92) {
      await _0xf4a612.removeWhere(
        'kanbanCards',
        (_0x298f5c) => _0x298f5c.stageId === _0x451d92,
      );
      await _0xf4a612.remove('kanbanStages', _0x451d92);
    },
    async reorderStages(_0x8ca4d0) {
      for (let _0x367c13 = 0; _0x367c13 < _0x8ca4d0.length; _0x367c13++) {
        await _0xf4a612.patch('kanbanStages', _0x8ca4d0[_0x367c13], {
          order: _0x367c13,
        });
      }
    },
    cards(_0x30eda2) {
      return _0xf4a612
        .filter('kanbanCards', (_0x5dd7bf) => _0x5dd7bf.stageId === _0x30eda2)
        .sort(
          (_0x469e37, _0x6c9256) =>
            (_0x469e37.order || 0) - (_0x6c9256.order || 0),
        );
    },
    cardFor(_0x4cfe55, _0x1c3248) {
      const _0x5a6c5e = _0x1c3248 || _0x57c03e.mainDashboardId();
      return _0xf4a612.find(
        'kanbanCards',
        (_0x59f311) =>
          _0x59f311.chatId === _0x4cfe55 &&
          _0x57c03e.dashboardOf(
            _0xf4a612.get('kanbanStages', _0x59f311.stageId),
          ) === _0x5a6c5e,
      );
    },
    stageOf(_0x13d435, _0x3f7b2c) {
      const _0x2b27ad = _0x57c03e.cardFor(_0x13d435, _0x3f7b2c);
      if (_0x2b27ad) {
        return _0xf4a612.get('kanbanStages', _0x2b27ad.stageId);
      } else {
        return null;
      }
    },
    async assign(_0x4c8c4a, _0x1dc08e, _0x1ca21f) {
      const _0x37cad7 = _0xf4a612.get('kanbanStages', _0x1dc08e);
      if (!_0x37cad7) {
        throw new Error('That board no longer exists.');
      }
      const _0x38db46 = _0x57c03e.cardFor(
        _0x4c8c4a,
        _0x57c03e.dashboardOf(_0x37cad7),
      );
      const _0x3787ed =
        _0x341937 && _0x341937.chatById ? _0x341937.chatById(_0x4c8c4a) : null;
      const _0x3413d9 = Object.assign({}, _0x38db46 || {}, {
        chatId: _0x4c8c4a,
        stageId: _0x1dc08e,
        name: _0x57c03e.displayName(_0x4c8c4a),
        phone: (_0x3787ed && _0x3787ed.phone) || '',
      });
      const _0xff7583 = await _0xf4a612.put(
        'kanbanCards',
        Object.assign(_0x3413d9, {
          order: 1000000000,
        }),
      );
      await _0x57c03e.moveCard(
        _0x4c8c4a,
        _0x1dc08e,
        _0x1ca21f === undefined ? _0x57c03e.cards(_0x1dc08e).length : _0x1ca21f,
      );
      _0x352a87('crm:stage', {
        chatId: _0x4c8c4a,
        stage: _0xf4a612.get('kanbanStages', _0x1dc08e),
        previous: _0x38db46 ? _0x38db46.stageId : null,
      });
      return _0xff7583;
    },
    async moveCard(_0x47b1c5, _0x25b333, _0x465dcc) {
      const _0xb6ea8c = _0x57c03e.cardFor(
        _0x47b1c5,
        _0x57c03e.dashboardOf(_0xf4a612.get('kanbanStages', _0x25b333)),
      );
      if (!_0xb6ea8c) {
        return null;
      }
      const _0x48c393 = _0xb6ea8c.stageId;
      const _0x248bc1 = _0x57c03e
        .cards(_0x25b333)
        .filter((_0x2954db) => _0x2954db.chatId !== _0x47b1c5);
      const _0x262390 = Math.max(
        0,
        Math.min(
          _0x465dcc === undefined ? _0x248bc1.length : _0x465dcc,
          _0x248bc1.length,
        ),
      );
      _0x248bc1.splice(
        _0x262390,
        0,
        Object.assign({}, _0xb6ea8c, {
          stageId: _0x25b333,
        }),
      );
      for (let _0x45b987 = 0; _0x45b987 < _0x248bc1.length; _0x45b987++) {
        await _0xf4a612.put(
          'kanbanCards',
          Object.assign({}, _0x248bc1[_0x45b987], {
            order: _0x45b987,
          }),
        );
      }
      if (_0x48c393 !== _0x25b333) {
        const _0x53c090 = _0x57c03e.cards(_0x48c393);
        for (let _0x2fb31d = 0; _0x2fb31d < _0x53c090.length; _0x2fb31d++) {
          await _0xf4a612.patch('kanbanCards', _0x53c090[_0x2fb31d].id, {
            order: _0x2fb31d,
          });
        }
        _0x352a87('crm:stage', {
          chatId: _0x47b1c5,
          stage: _0xf4a612.get('kanbanStages', _0x25b333),
          previous: _0x48c393,
        });
      }
      return _0x57c03e.cardFor(_0x47b1c5);
    },
    async unassign(_0x58b50b, _0x5c6f67) {
      const _0x41e523 = _0x57c03e.cardFor(_0x58b50b, _0x5c6f67);
      if (_0x41e523) {
        await _0xf4a612.remove('kanbanCards', _0x41e523.id);
      }
    },
    tabs() {
      return _0xf4a612.all('tabs');
    },
    async saveTab(_0xbf935a) {
      const _0x468cb2 = String(_0xbf935a.title || '').trim();
      if (!_0x468cb2) {
        throw new Error('Tab title is required.');
      }
      if (_0x468cb2.length > TAB_NAME_MAX) {
        throw new Error(
          'Tab title must be ' + TAB_NAME_MAX + ' characters or fewer.',
        );
      }
      const _0x2c02e3 =
        _0xbf935a.order !== undefined
          ? _0xbf935a.order
          : _0xf4a612.count('tabs');
      return _0xf4a612.put(
        'tabs',
        Object.assign(
          {
            visible: true,
            details: '',
            members: [],
          },
          _0xbf935a,
          {
            title: _0x468cb2,
            order: _0x2c02e3,
          },
        ),
      );
    },
    async deleteTab(_0x4f76ad) {
      await _0xf4a612.remove('tabs', _0x4f76ad);
    },
    async reorderTabs(_0x5db1a2) {
      for (let _0x29d612 = 0; _0x29d612 < _0x5db1a2.length; _0x29d612++) {
        await _0xf4a612.patch('tabs', _0x5db1a2[_0x29d612], {
          order: _0x29d612,
        });
      }
    },
    tabsOf(_0x11a10c) {
      return _0xf4a612.filter('tabs', (_0x4e54f7) =>
        (_0x4e54f7.members || []).includes(_0x11a10c),
      );
    },
    async addToTabs(_0x52e4b6, _0x17e64b) {
      for (const _0x38fffd of _0x52e4b6) {
        const _0x27580a = _0xf4a612.get('tabs', _0x38fffd);
        if (_0x27580a) {
          await _0xf4a612.put(
            'tabs',
            Object.assign({}, _0x27580a, {
              members: Array.from(
                new Set((_0x27580a.members || []).concat(_0x17e64b)),
              ),
            }),
          );
        }
      }
    },
    async removeFromTabs(_0x11145d, _0x3e3b7d) {
      for (const _0xf085c5 of _0x11145d) {
        const _0x5a1e19 = _0xf4a612.get('tabs', _0xf085c5);
        if (_0x5a1e19) {
          await _0xf4a612.put(
            'tabs',
            Object.assign({}, _0x5a1e19, {
              members: (_0x5a1e19.members || []).filter(
                (_0xc7757e) => !_0x3e3b7d.includes(_0xc7757e),
              ),
            }),
          );
        }
      }
    },
    newId: uid,
    moveItem: moveItem,
  };
  return _0x57c03e;
}
