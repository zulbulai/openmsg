export function emptyActions() {
  return {
    tagAdd: [],
    tagRemove: [],
    tabAdd: [],
    tabRemove: [],
    groupAdd: [],
    groupRemove: [],
    labelAdd: [],
    labelRemove: [],
    kanbanAdd: '',
    kanbanRemove: '',
    archive: '',
    block: false,
    webhooks: [],
  };
}
export function hasActions(_0x4ef413) {
  if (!_0x4ef413) {
    return false;
  }
  return (
    !!(_0x4ef413.tagAdd || []).length ||
    !!(_0x4ef413.tagRemove || []).length ||
    !!(_0x4ef413.tabAdd || []).length ||
    !!(_0x4ef413.tabRemove || []).length ||
    !!(_0x4ef413.groupAdd || []).length ||
    !!(_0x4ef413.groupRemove || []).length ||
    !!(_0x4ef413.labelAdd || []).length ||
    !!(_0x4ef413.labelRemove || []).length ||
    !!_0x4ef413.kanbanAdd ||
    !!_0x4ef413.kanbanRemove ||
    !!_0x4ef413.archive ||
    !!_0x4ef413.block ||
    !!(_0x4ef413.webhooks || []).length
  );
}
export function createActions({
  wa: _0x16c1f7,
  crm: _0x1093b1,
  webhooks: _0xfe3b00,
  activity: _0x5b5ac9,
}) {
  return {
    async run(_0x4d3c3b, _0x1103cc, _0x556079 = {}) {
      const _0x1405d1 = [];
      if (!_0x1103cc) {
        return _0x1405d1;
      }
      const _0x57625c = async (_0x44e774, _0x4efeaa) => {
        try {
          await _0x4efeaa();
        } catch (_0x4f639d) {
          _0x1405d1.push(
            _0x44e774 + ': ' + ((_0x4f639d && _0x4f639d.message) || _0x4f639d),
          );
        }
      };
      const _0x32f32e = /@g\.us$/.test(_0x4d3c3b) ? null : _0x4d3c3b;
      if ((_0x1103cc.tagAdd || []).length) {
        await _0x57625c('Add tags', () =>
          _0x1093b1.addTags(_0x4d3c3b, _0x1103cc.tagAdd),
        );
      }
      if ((_0x1103cc.tagRemove || []).length) {
        await _0x57625c('Remove tags', () =>
          _0x1093b1.removeTags(_0x4d3c3b, _0x1103cc.tagRemove),
        );
      }
      if ((_0x1103cc.tabAdd || []).length) {
        await _0x57625c('Add to tabs', () =>
          _0x1093b1.addToTabs(_0x1103cc.tabAdd, [_0x4d3c3b]),
        );
      }
      if ((_0x1103cc.tabRemove || []).length) {
        await _0x57625c('Remove from tabs', () =>
          _0x1093b1.removeFromTabs(_0x1103cc.tabRemove, [_0x4d3c3b]),
        );
      }
      if (_0x1103cc.kanbanAdd) {
        await _0x57625c('Add to Kanban', () =>
          _0x1093b1.assign(_0x4d3c3b, _0x1103cc.kanbanAdd),
        );
      }
      if (_0x1103cc.kanbanRemove) {
        await _0x57625c('Remove from Kanban', async () => {
          const _0x14b4b4 = _0x1093b1
            .stages()
            .find((_0x595783) => _0x595783.id === _0x1103cc.kanbanRemove);
          if (!_0x14b4b4) {
            return;
          }
          const _0x2d4f13 = _0x1093b1.dashboardOf(_0x14b4b4);
          const _0x1dd359 = _0x1093b1.cardFor(_0x4d3c3b, _0x2d4f13);
          if (_0x1dd359 && _0x1dd359.stageId === _0x14b4b4.id) {
            await _0x1093b1.unassign(_0x4d3c3b, _0x2d4f13);
          }
        });
      }
      if (_0x32f32e) {
        for (const _0x4e41d0 of _0x1103cc.groupAdd || []) {
          await _0x57625c('Add to group', () =>
            _0x16c1f7.groupAdd(_0x4e41d0, _0x32f32e),
          );
        }
        for (const _0x425c58 of _0x1103cc.groupRemove || []) {
          await _0x57625c('Remove from group', () =>
            _0x16c1f7.groupRemove(_0x425c58, _0x32f32e),
          );
        }
      }
      for (const _0x4b1bbf of _0x1103cc.labelAdd || []) {
        await _0x57625c('Add label', () =>
          _0x16c1f7.setLabel(_0x4d3c3b, _0x4b1bbf, 'add'),
        );
      }
      for (const _0x159c84 of _0x1103cc.labelRemove || []) {
        await _0x57625c('Remove label', () =>
          _0x16c1f7.setLabel(_0x4d3c3b, _0x159c84, 'remove'),
        );
      }
      if (_0x1103cc.archive === 'archive') {
        await _0x57625c('Archive chat', () =>
          _0x16c1f7.archive(_0x4d3c3b, true),
        );
      }
      if (_0x1103cc.archive === 'unarchive') {
        await _0x57625c('Unarchive chat', () =>
          _0x16c1f7.archive(_0x4d3c3b, false),
        );
      }
      if (_0x1103cc.block && _0x32f32e) {
        await _0x57625c('Block contact', () => _0x16c1f7.block(_0x4d3c3b));
      }
      if ((_0x1103cc.webhooks || []).length && _0xfe3b00) {
        await _0x57625c('Webhook', () =>
          _0xfe3b00.emitTo(
            _0x1103cc.webhooks,
            'post_action',
            Object.assign(
              {
                chatId: _0x4d3c3b,
                name: _0x1093b1.displayName(_0x4d3c3b),
              },
              _0x556079,
            ),
          ),
        );
      }
      if (_0x1405d1.length && _0x5b5ac9) {
        await _0x5b5ac9.log('action_failed', {
          chatId: _0x4d3c3b,
          text: _0x1405d1.join(' | '),
        });
      }
      return _0x1405d1;
    },
  };
}
