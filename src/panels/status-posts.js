import { h, icon, clear } from '../ui/dom.js';
import * as _0x4987a7 from '../ui/kit.js';
import { scheduleEditor } from '../ui/schedule-editor.js';
import { nextRun, describeRule } from '../core/timecalc.js';
import {
  fileToDataUrl,
  fmtDateTime,
  bytesToSize,
  truncate,
  debounce,
} from '../core/util.js';
import { MAX_FILE_BYTES, fileKind } from '../core/messages.js';
const BACKGROUNDS = [
  '#128c7e',
  '#ffc72c',
  '#7dd3fc',
  '#c4b5fd',
  '#f9a8d4',
  '#1f2933',
  '#e11d48',
  '#16a34a',
];
const TONE = {
  pending: 'info',
  posted: 'ok',
  failed: 'danger',
  missed: 'warn',
};
function openEditor(_0x455aad, _0x3d0043) {
  const _0x382812 = Object.assign(
    {
      kind: 'text',
      text: '',
      caption: '',
      backgroundColor: BACKGROUNDS[0],
      blobId: '',
      fileName: '',
      when: 'schedule',
      schedule: {
        mode: 'once',
        startAt: Date.now() + 3600000,
      },
    },
    _0x3d0043 ? JSON.parse(JSON.stringify(_0x3d0043)) : {},
  );
  const _0x4c0dd3 = h('div', {
    class: 'wc-field-error',
  });
  const _0x5015e6 = h('div', {
    class: 'wc-stack',
  });
  function _0x3b4cbf() {
    clear(_0x5015e6);
    _0x5015e6.appendChild(
      _0x4987a7.field(
        'Type',
        _0x4987a7.select(
          [
            {
              value: 'text',
              label: 'Text',
            },
            {
              value: 'image',
              label: 'Photo',
            },
            {
              value: 'video',
              label: 'Video',
            },
          ],
          _0x382812.kind,
          (_0x3a8989) => {
            _0x382812.kind = _0x3a8989;
            _0x382812.blobId = '';
            _0x382812.fileName = '';
            _0x3b4cbf();
          },
        ),
      ),
    );
    if (_0x382812.kind === 'text') {
      _0x5015e6.appendChild(
        _0x4987a7.field(
          'Text',
          _0x4987a7.textarea({
            value: _0x382812.text,
            rows: 4,
            placeholder: 'What do you want to share?',
            onInput: (_0x292d1f) => {
              _0x382812.text = _0x292d1f;
            },
          }),
        ),
      );
      _0x5015e6.appendChild(
        _0x4987a7.field(
          'Background color',
          _0x4987a7.colorSwatches(
            BACKGROUNDS,
            _0x382812.backgroundColor,
            (_0x5b1355) => {
              _0x382812.backgroundColor = _0x5b1355;
            },
          ),
        ),
      );
    } else {
      _0x5015e6.appendChild(
        _0x4987a7.field(
          'File',
          h(
            'div',
            {
              class: 'wc-stack',
            },
            _0x382812.blobId
              ? h(
                  'div',
                  {
                    class: 'wc-attach-chip',
                  },
                  icon('paperclip', 14),
                  ' ' + _0x382812.fileName,
                )
              : h(
                  'span',
                  {
                    class: 'wc-muted',
                  },
                  'No file chosen',
                ),
            _0x4987a7.button(
              _0x382812.blobId ? 'Choose another file' : 'Choose a file',
              {
                icon: 'upload',
                size: 'sm',
                onClick: async () => {
                  const [_0x42f923] = await _0x4987a7.pickFiles(
                    _0x382812.kind === 'image' ? 'image/*' : 'video/*',
                    false,
                  );
                  if (!_0x42f923) {
                    return;
                  }
                  if (_0x42f923.size > MAX_FILE_BYTES) {
                    _0x4987a7.toast('That file is too large.', 'error');
                    return;
                  }
                  if (fileKind(_0x42f923.type) !== _0x382812.kind) {
                    _0x4987a7.toast(
                      'Choose a ' +
                        (_0x382812.kind === 'image' ? 'photo' : 'video') +
                        ' file.',
                      'error',
                    );
                    return;
                  }
                  _0x382812.blobId = await _0x455aad.store.putBlob(
                    await fileToDataUrl(_0x42f923),
                    {
                      name: _0x42f923.name,
                      mime: _0x42f923.type,
                      size: _0x42f923.size,
                    },
                  );
                  _0x382812.fileName =
                    _0x42f923.name + ' (' + bytesToSize(_0x42f923.size) + ')';
                  _0x3b4cbf();
                },
              },
            ),
          ),
        ),
      );
      _0x5015e6.appendChild(
        _0x4987a7.field(
          'Caption (optional)',
          _0x4987a7.input({
            value: _0x382812.caption,
            onInput: (_0x186682) => {
              _0x382812.caption = _0x186682;
            },
          }),
        ),
      );
    }
    _0x5015e6.appendChild(
      _0x4987a7.field(
        'When',
        _0x4987a7.radioCards(
          'st-when',
          [
            {
              value: 'now',
              label: 'Post now',
            },
            {
              value: 'schedule',
              label: 'Schedule',
              hint: 'WhatsApp Web must be open at that time.',
            },
          ],
          _0x382812.when,
          (_0x31d081) => {
            _0x382812.when = _0x31d081;
            _0x3b4cbf();
          },
        ),
      ),
    );
    if (_0x382812.when === 'schedule') {
      _0x5015e6.appendChild(
        scheduleEditor({
          value: _0x382812.schedule,
          allowRepeat: true,
          onChange: () => {},
        }),
      );
    }
    _0x3f36f9.textContent = _0x382812.when === 'now' ? 'Post now' : 'Schedule';
  }
  const _0x3f36f9 = h('span', null);
  const _0x4354da = _0x4987a7.openDrawer({
    title: _0x3d0043 ? 'Edit Status' : 'New Status',
    width: 520,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x5015e6,
      _0x4c0dd3,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x4987a7.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x4354da.close(),
      }),
      _0x4987a7.button('', {
        variant: 'primary',
        onClick: async () => {
          if (_0x382812.kind === 'text' && !_0x382812.text.trim()) {
            _0x4c0dd3.textContent = 'Write the text for your Status.';
            return;
          }
          if (_0x382812.kind !== 'text' && !_0x382812.blobId) {
            _0x4c0dd3.textContent = 'Choose a file.';
            return;
          }
          const _0x5a4607 =
            _0x382812.when === 'now'
              ? Date.now()
              : _0x382812.schedule.mode === 'repeat'
                ? nextRun(_0x382812.schedule, Date.now() - 1, 0)
                : _0x382812.schedule.startAt;
          if (!_0x5a4607) {
            _0x4c0dd3.textContent = 'Pick a time in the future.';
            return;
          }
          await _0x455aad.store.put(
            'statusPosts',
            Object.assign({}, _0x382812, {
              status: 'pending',
              nextRunAt: _0x5a4607,
              lastError: '',
            }),
          );
          _0x4354da.close();
          if (_0x382812.when === 'now') {
            await _0x455aad.scheduler.tickStatuses();
            _0x4987a7.toast('Posting your Status...', 'success');
          } else {
            _0x4987a7.toast('Status scheduled', 'success');
          }
        },
      }),
    ),
  });
  _0x4354da.el
    .querySelector('.wc-sheet-foot .wc-btn-primary')
    .appendChild(_0x3f36f9);
  _0x3b4cbf();
}
export default {
  id: 'status-posts',
  title: 'Scheduled Status',
  subtitle: 'Post to your WhatsApp Status at the right time.',
  icon: 'circle-play',
  render(_0x35b4dc) {
    const { app: _0x36553d } = _0x35b4dc;
    const _0x12fcd0 = h('div', {
      class: 'wc-stack',
    });
    function _0x3bb5a0() {
      clear(_0x12fcd0);
      const _0x5a1b68 = _0x36553d.store
        .all('statusPosts')
        .slice()
        .sort(
          (_0x25d65d, _0x2b912a) =>
            (_0x2b912a.nextRunAt || _0x2b912a.postedAt || 0) -
            (_0x25d65d.nextRunAt || _0x25d65d.postedAt || 0),
        );
      _0x12fcd0.appendChild(
        _0x4987a7.table(
          ['Status', 'Type', 'When', 'State', ''],
          _0x5a1b68.map((_0x9120d3) => [
            h(
              'div',
              {
                class: 'wc-cell-main',
              },
              h(
                'strong',
                null,
                _0x9120d3.kind === 'text'
                  ? truncate(_0x9120d3.text, 60)
                  : _0x9120d3.fileName || 'Media',
              ),
              _0x9120d3.caption
                ? h('span', null, truncate(_0x9120d3.caption, 50))
                : null,
            ),
            _0x9120d3.kind,
            _0x9120d3.nextRunAt
              ? fmtDateTime(_0x9120d3.nextRunAt) +
                (_0x9120d3.schedule && _0x9120d3.schedule.mode === 'repeat'
                  ? ' · ' + describeRule(_0x9120d3.schedule)
                  : '')
              : _0x9120d3.postedAt
                ? 'Posted ' + fmtDateTime(_0x9120d3.postedAt)
                : '-',
            h(
              'span',
              {
                class: 'wc-inline',
              },
              _0x4987a7.chip(
                _0x9120d3.status,
                TONE[_0x9120d3.status] || 'neutral',
              ),
              _0x9120d3.lastError
                ? h(
                    'span',
                    {
                      class: 'wc-muted wc-small',
                      title: _0x9120d3.lastError,
                    },
                    truncate(_0x9120d3.lastError, 30),
                  )
                : null,
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x9120d3.status === 'pending'
                ? _0x4987a7.iconButton('pencil', 'Edit', () =>
                    openEditor(_0x36553d, _0x9120d3),
                  )
                : _0x4987a7.iconButton('rotate-ccw', 'Schedule again', () =>
                    openEditor(
                      _0x36553d,
                      Object.assign({}, _0x9120d3, {
                        id: undefined,
                        createdAt: undefined,
                      }),
                    ),
                  ),
              _0x4987a7.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x4987a7.confirmDialog('Delete this Status?', {
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    _0x36553d.store.remove('statusPosts', _0x9120d3.id);
                  }
                },
                'is-danger',
              ),
            ),
          ]),
          {
            empty: _0x4987a7.emptyState(
              'circle-play',
              'No Status posts yet',
              'Schedule a post to see it here.',
              _0x4987a7.button('New Status', {
                icon: 'plus',
                variant: 'primary',
                onClick: () => openEditor(_0x36553d),
              }),
            ),
          },
        ),
      );
    }
    _0x35b4dc.setActions([
      _0x4987a7.button('New Status', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openEditor(_0x36553d),
      }),
    ]);
    _0x35b4dc.onDispose(
      _0x36553d.store.on('statusPosts', debounce(_0x3bb5a0, 60)),
    );
    _0x3bb5a0();
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      _0x12fcd0,
    );
  },
};
