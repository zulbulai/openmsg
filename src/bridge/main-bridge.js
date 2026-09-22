(function () {
  'use strict';

  if (window.__WACRM_BRIDGE__) {
    return;
  }
  window.__WACRM_BRIDGE__ = true;
  var _0xf8a743 = window.location.origin;
  function _0x464552(_0x464700) {
    _0x464700.source = 'wacrm-main';
    window.postMessage(_0x464700, _0xf8a743);
  }
  function _0x1eb946(_0x3ad078, _0x2710a1) {
    try {
      var _0x5ba1be = _0x3ad078();
      if (_0x5ba1be === undefined) {
        return _0x2710a1;
      } else {
        return _0x5ba1be;
      }
    } catch (_0x20689b) {
      return _0x2710a1;
    }
  }
  function _0x1ae34a() {
    if (!window.WPP) {
      throw new Error(
        'WhatsApp tools are still loading. Try again in a moment.',
      );
    }
    return window.WPP;
  }
  function _0x13d080(_0x45129f) {
    if (!_0x45129f) {
      return '';
    }
    if (typeof _0x45129f === 'string') {
      return _0x45129f;
    }
    return (
      _0x45129f._serialized ||
      _0x1eb946(function () {
        return _0x45129f.toString();
      }, '') ||
      ''
    );
  }
  function _0x121fc0(_0x667f24) {
    return String(_0x667f24 || '').replace(/\D+/g, '');
  }
  function _0x4d869c(_0x573a5e) {
    if (/@c\.us$/.test(_0x573a5e)) {
      return _0x573a5e.split('@')[0];
    } else {
      return '';
    }
  }
  function _0x57ace4(_0x1f82f8) {
    if (!_0x1f82f8) {
      return '';
    }
    return (
      _0x1f82f8.name ||
      _0x1f82f8.formattedName ||
      _0x1f82f8.shortName ||
      _0x1f82f8.pushname ||
      _0x1f82f8.verifiedName ||
      ''
    );
  }
  function _0x18cf17(_0x3daf8e) {
    _0x3daf8e = String(_0x3daf8e || '').trim();
    return (
      !!_0x3daf8e &&
      /^[+\d\s().-]+$/.test(_0x3daf8e) &&
      _0x3daf8e.replace(/\D/g, '').length >= 5
    );
  }
  function _0x49e4a7(_0x3c0b18, _0x470f02, _0x33b798, _0x8c99ba) {
    var _0x3aae6c = _0x3c0b18.formattedTitle || _0x3c0b18.name || '';
    if (_0x3aae6c && !_0x18cf17(_0x3aae6c)) {
      return _0x3aae6c;
    }
    var _0x52fd0a = [
      _0x470f02.name,
      _0x470f02.shortName,
      _0x470f02.pushname,
      _0x470f02.notifyName,
      _0x470f02.verifiedName,
      _0x470f02.formattedName,
    ];
    for (var _0x28e7d1 = 0; _0x28e7d1 < _0x52fd0a.length; _0x28e7d1++) {
      if (_0x52fd0a[_0x28e7d1] && !_0x18cf17(_0x52fd0a[_0x28e7d1])) {
        return String(_0x52fd0a[_0x28e7d1]);
      }
    }
    return (
      _0x3aae6c || _0x57ace4(_0x470f02) || _0x33b798 || _0x8c99ba.split('@')[0]
    );
  }
  function _0x491f07(_0xff64d4) {
    var _0x3d636a = _0x13d080(_0xff64d4.id);
    var _0xdea0e7 =
      _0xff64d4.contact ||
      _0x1eb946(function () {
        return window.WPP.whatsapp.ContactStore.get(_0x3d636a);
      }, null) ||
      {};
    var _0x9aeb2c =
      _0xff64d4.previewMessage ||
      _0x1eb946(function () {
        return _0xff64d4.msgs && _0xff64d4.msgs.last && _0xff64d4.msgs.last();
      }, null);
    var _0x33fc48 =
      _0x4d869c(_0x3d636a) || _0x121fc0(_0x13d080(_0xdea0e7.phoneNumber));
    var _0x592786 = _0x1eb946(function () {
      return (_0xff64d4.labels || []).map(String);
    }, []);
    return {
      id: _0x3d636a,
      name: _0x49e4a7(_0xff64d4, _0xdea0e7, _0x33fc48, _0x3d636a),
      phone: _0x33fc48,
      isGroup: !!_0xff64d4.isGroup,
      isUser: !!_0xff64d4.isUser,
      isBroadcast: !!_0xff64d4.isBroadcast,
      isNewsletter: !!_0xff64d4.isNewsletter,
      isBusiness: !!_0xdea0e7.isBusiness,
      isMyContact: !!_0xdea0e7.isMyContact,
      unread: _0xff64d4.unreadCount || 0,
      markedUnread: !!_0xff64d4.markedUnread,
      archived: !!_0xff64d4.archive,
      pinned: !!_0xff64d4.pin,
      t: _0xff64d4.t || 0,
      labels: _0x592786,
      lastFromMe: _0x9aeb2c && _0x9aeb2c.id ? !!_0x9aeb2c.id.fromMe : null,
      lastBody: _0x9aeb2c
        ? String(
            _0x9aeb2c.type === 'chat'
              ? _0x9aeb2c.body || ''
              : _0x9aeb2c.caption || '',
          ).slice(0, 140)
        : '',
      lastType: _0x9aeb2c ? String(_0x9aeb2c.type || '') : '',
    };
  }
  function _0x58bc01(_0x4c5337) {
    var _0x221d66 = _0x4c5337.id || {};
    var _0x25fa17 = _0x13d080(_0x221d66.remote);
    var _0x1aed3c = /@g\.us$/.test(_0x25fa17);
    var _0x32fc6b = String(_0x4c5337.type || '');
    var _0x39c40d = /(response|reply)$/.test(_0x32fc6b);
    var _0x5e4f7b =
      _0x32fc6b === 'chat'
        ? String(_0x4c5337.body || '')
        : String(
            _0x4c5337.caption ||
              (_0x39c40d
                ? _0x4c5337.selectedDisplayText ||
                  _0x4c5337.title ||
                  _0x4c5337.body ||
                  ''
                : ''),
          );
    return {
      id: _0x221d66._serialized || String(_0x221d66.id || ''),
      chatId: _0x25fa17,
      fromMe: !!_0x221d66.fromMe,
      from: _0x13d080(_0x4c5337.from),
      to: _0x13d080(_0x4c5337.to),
      author: _0x13d080(_0x4c5337.author),
      sender: _0x13d080(_0x4c5337.author) || _0x13d080(_0x4c5337.from),
      name: _0x4c5337.notifyName || '',
      type: _0x32fc6b,
      body: _0x5e4f7b.slice(0, 4000),
      mimetype: _0x4c5337.mimetype || '',
      filename: _0x4c5337.filename || '',
      t: _0x4c5337.t || 0,
      isNew: _0x4c5337.isNewMsg !== false,
      isGroup: _0x1aed3c,
      isForwarded: !!_0x4c5337.isForwarded,
      mentioned: _0x1eb946(function () {
        return (_0x4c5337.mentionedJidList || []).map(_0x13d080);
      }, []),
      selectedId:
        _0x4c5337.selectedId ||
        _0x4c5337.selectedRowId ||
        _0x4c5337.selectedButtonId ||
        '',
      ack: typeof _0x4c5337.ack === 'number' ? _0x4c5337.ack : 0,
    };
  }
  function _0x51d3ce(_0x566478) {
    if (!_0x566478) {
      return {
        id: '',
        ack: 0,
      };
    }
    return {
      id:
        typeof _0x566478.id === 'string'
          ? _0x566478.id
          : _0x13d080(_0x566478.id),
      ack: _0x566478.ack || 0,
    };
  }
  function _0x2cdefa(_0x13b455) {
    return new Promise(function (_0x47a4da, _0x382685) {
      var _0x2b6439 = new FileReader();
      _0x2b6439.onload = function () {
        _0x47a4da(String(_0x2b6439.result));
      };
      _0x2b6439.onerror = function () {
        _0x382685(_0x2b6439.error || new Error('Could not read media'));
      };
      _0x2b6439.readAsDataURL(_0x13b455);
    });
  }
  var _0x5da225 = '';
  var _0x3b414 = {
    hooked: false,
    signed: 0,
    error: '',
  };
  function _0x20897b() {
    return {
      hooked: _0x3b414.hooked,
      signed: _0x3b414.signed,
      error: _0x3b414.error,
    };
  }
  function _0x3c3522() {
    if (_0x3b414.hooked || !_0x5da225) {
      return _0x20897b();
    }
    try {
      var _0x185ef7 = _0x1ae34a().webpack.search(function (_0x88f123) {
        try {
          return (
            !!_0x88f123 && typeof _0x88f123.sendTextMsgToChat === 'function'
          );
        } catch (_0x1b8949) {
          return false;
        }
      });
      if (!_0x185ef7) {
        throw new Error('WhatsApp send function not found');
      }
      var _0xbfa69c = _0x185ef7.sendTextMsgToChat;
      _0x185ef7.sendTextMsgToChat = function (_0x1b49f3, _0xbf67af) {
        var _0x37912d = Array.prototype.slice.call(arguments);
        try {
          var _0x9abe20 =
            _0x1b49f3 && _0x1b49f3.id ? _0x13d080(_0x1b49f3.id) : '';
          if (
            _0x5da225 &&
            typeof _0xbf67af === 'string' &&
            _0xbf67af.trim() &&
            _0xbf67af.indexOf(_0x5da225) !== 0 &&
            !/status@broadcast|@newsletter$/.test(_0x9abe20)
          ) {
            _0x37912d[1] = _0x5da225 + _0xbf67af;
            _0x3b414.signed++;
          }
        } catch (_0x40edb2) {}
        return _0xbfa69c.apply(this, _0x37912d);
      };
      _0x3b414.hooked = true;
      _0x3b414.error = '';
    } catch (_0x294a3c) {
      _0x3b414.error = String((_0x294a3c && _0x294a3c.message) || _0x294a3c);
    }
    return _0x20897b();
  }
  var _0xb221c0 = {
    createChat: true,
    waitForAck: false,
  };
  function _0x109e08(_0x43d08f) {
    return Object.assign({}, _0xb221c0, _0x43d08f || {});
  }
  var _0x43cc8a = {
    ping: function () {
      return {
        pong: true,
      };
    },
    status: function () {
      var _0x3c235b = window.WPP;
      if (!_0x3c235b) {
        return {
          injected: false,
          ready: false,
          fullReady: false,
        };
      }
      return {
        injected: true,
        ready: !!_0x3c235b.isReady,
        fullReady: !!_0x3c235b.isFullReady,
        authenticated: !!_0x1eb946(function () {
          return _0x3c235b.conn.isAuthenticated();
        }, false),
        mainReady: !!_0x1eb946(function () {
          return _0x3c235b.conn.isMainReady();
        }, false),
        me: _0x13d080(
          _0x1eb946(function () {
            return _0x3c235b.conn.getMyUserId();
          }, null),
        ),
        isBusiness:
          !!_0x1eb946(function () {
            return _0x3c235b.profile.isBusiness();
          }, false) || /whatsapp business/i.test(String(document.title || '')),
        version: _0x1eb946(function () {
          return _0x3c235b.version;
        }, ''),
      };
    },
    'chat.list': async function (_0x58db69) {
      var _0x251750 = await _0x1ae34a().chat.list(_0x58db69 || {});
      return _0x251750.map(_0x491f07);
    },
    'chat.get': async function (_0x4f2cd8) {
      var _0x2c6bcf = _0x1ae34a();
      var _0x377561 =
        _0x1eb946(function () {
          return _0x2c6bcf.whatsapp.ChatStore.get(_0x4f2cd8);
        }, null) ||
        (await _0x2c6bcf.chat.find(_0x4f2cd8).catch(function () {
          return null;
        }));
      if (_0x377561) {
        return _0x491f07(_0x377561);
      } else {
        return null;
      }
    },
    'chat.active': function () {
      var _0x3b7b31 = _0x1ae34a().chat.getActiveChat();
      if (_0x3b7b31) {
        return _0x491f07(_0x3b7b31);
      } else {
        return null;
      }
    },
    'chat.open': async function (_0x5e1fbc) {
      await _0x1ae34a().chat.openChatBottom(_0x5e1fbc);
      return true;
    },
    'chat.setFilter': function (_0x12af72, _0x4a6ab6) {
      _0x1ae34a().chat.setChatList(_0x12af72, _0x4a6ab6 || []);
      return true;
    },
    'chat.markRead': async function (_0x3c745d) {
      await _0x1ae34a().chat.markIsRead(_0x3c745d);
      return true;
    },
    'chat.typing': async function (_0x4a7254, _0xcdf748, _0x406136) {
      var _0x5467b5 = _0x1ae34a();
      if (_0xcdf748) {
        await _0x5467b5.chat.markIsComposing(_0x4a7254, _0x406136);
      } else {
        await _0x5467b5.chat.markIsPaused(_0x4a7254);
      }
      return true;
    },
    'chat.archive': async function (_0x4ebb28, _0x3c33b7) {
      await _0x1ae34a().chat.archive(_0x4ebb28, _0x3c33b7 !== false);
      return true;
    },
    'chat.messages': async function (_0x155c2b, _0xca09b0) {
      var _0x5d468d = await _0x1ae34a().chat.getMessages(
        _0x155c2b,
        _0xca09b0 || {
          count: 30,
        },
      );
      return _0x5d468d.map(_0x58bc01);
    },
    'chat.setInput': async function (_0x51c376, _0x48afdc) {
      await _0x1ae34a().chat.setInputText(_0x51c376, _0x48afdc);
      return true;
    },
    'sign.set': function (_0x3ef6f8) {
      _0x5da225 = String(_0x3ef6f8 || '');
      return _0x3c3522();
    },
    'sign.status': function () {
      return _0x20897b();
    },
    'send.text': async function (_0x3154d2, _0x113601, _0x51cad6) {
      return _0x51d3ce(
        await _0x1ae34a().chat.sendTextMessage(
          _0x3154d2,
          _0x113601,
          _0x109e08(_0x51cad6),
        ),
      );
    },
    'send.file': async function (_0x59fa9a, _0x5389c8, _0xf90867) {
      return _0x51d3ce(
        await _0x1ae34a().chat.sendFileMessage(
          _0x59fa9a,
          _0x5389c8,
          _0x109e08(_0xf90867),
        ),
      );
    },
    'send.poll': async function (_0x128187, _0x591da3, _0x55f61b, _0x5f3598) {
      var _0x4db777 = _0x109e08(_0x5f3598);
      _0x4db777.selectableCount = _0x4db777.multi ? _0x55f61b.length : 1;
      delete _0x4db777.multi;
      return _0x51d3ce(
        await _0x1ae34a().chat.sendCreatePollMessage(
          _0x128187,
          _0x591da3,
          _0x55f61b,
          _0x4db777,
        ),
      );
    },
    'send.vcard': async function (_0x560e59, _0x47e47e, _0x315542) {
      return _0x51d3ce(
        await _0x1ae34a().chat.sendVCardContactMessage(
          _0x560e59,
          _0x47e47e,
          _0x109e08(_0x315542),
        ),
      );
    },
    'send.list': async function (_0x265f7b, _0x178c0d, _0x2f6182) {
      return _0x51d3ce(
        await _0x1ae34a().chat.sendListMessage(
          _0x265f7b,
          Object.assign({}, _0x109e08(_0x2f6182), _0x178c0d),
        ),
      );
    },
    'status.text': async function (_0x2c50e1, _0x506df1) {
      return _0x51d3ce(
        await _0x1ae34a().status.sendTextStatus(_0x2c50e1, _0x506df1 || {}),
      );
    },
    'status.image': async function (_0x4cedf4, _0x421e3f) {
      return _0x51d3ce(
        await _0x1ae34a().status.sendImageStatus(_0x4cedf4, _0x421e3f || {}),
      );
    },
    'status.video': async function (_0x3020b0, _0x489a74) {
      return _0x51d3ce(
        await _0x1ae34a().status.sendVideoStatus(_0x3020b0, _0x489a74 || {}),
      );
    },
    'contact.exists': async function (_0x4a13bd) {
      var _0x42b191 = await _0x1ae34a().contact.queryExists(_0x4a13bd);
      if (!_0x42b191) {
        return null;
      }
      return {
        id: _0x13d080(_0x42b191.wid),
        lid: _0x13d080(_0x42b191.lid),
        business: !!_0x42b191.biz,
      };
    },
    'contact.list': async function () {
      var _0x361eb1 = await _0x1ae34a().contact.list();
      return _0x361eb1.map(function (_0x386214) {
        var _0x2ba7f6 = _0x13d080(_0x386214.id);
        return {
          id: _0x2ba7f6,
          name: _0x57ace4(_0x386214),
          phone:
            _0x4d869c(_0x2ba7f6) || _0x121fc0(_0x13d080(_0x386214.phoneNumber)),
          isMyContact: !!_0x386214.isMyContact,
          isBusiness: !!_0x386214.isBusiness,
        };
      });
    },
    block: async function (_0x196cbc) {
      await _0x1ae34a().blocklist.blockContact(_0x196cbc);
      return true;
    },
    unblock: async function (_0x54f42e) {
      await _0x1ae34a().blocklist.unblockContact(_0x54f42e);
      return true;
    },
    'group.list': async function () {
      var _0x391b87 = await _0x1ae34a().group.getAllGroups();
      return _0x391b87.filter(Boolean).map(_0x491f07);
    },
    'group.participants': async function (_0x4805d8) {
      var _0x41df8d = _0x1ae34a();
      var _0x361bef = await _0x41df8d.group.getParticipants(_0x4805d8);
      return _0x361bef.map(function (_0x450f88) {
        var _0xdaab70 = _0x13d080(_0x450f88.id);
        var _0x3a363e =
          _0x450f88.contact ||
          _0x1eb946(function () {
            return _0x41df8d.whatsapp.ContactStore.get(_0xdaab70);
          }, null);
        return {
          id: _0xdaab70,
          phone:
            _0x4d869c(_0xdaab70) ||
            _0x121fc0(_0x13d080(_0x3a363e && _0x3a363e.phoneNumber)),
          name: _0x57ace4(_0x3a363e),
          isAdmin: !!_0x450f88.isAdmin || !!_0x450f88.isSuperAdmin,
        };
      });
    },
    'group.add': async function (_0x54058c, _0x2ae32a) {
      return _0x1ae34a().group.addParticipants(_0x54058c, _0x2ae32a);
    },
    'group.remove': async function (_0x378fa8, _0x39b001) {
      return _0x1ae34a().group.removeParticipants(_0x378fa8, _0x39b001);
    },
    'group.create': async function (_0x173d4a, _0x2f7dac) {
      var _0x3c76c7 = await _0x1ae34a().group.create(_0x173d4a, _0x2f7dac);
      return {
        id: _0x13d080(_0x3c76c7 && _0x3c76c7.gid),
      };
    },
    'group.iAmAdmin': async function (_0x3b8425) {
      return !!(await _0x1ae34a().group.iAmAdmin(_0x3b8425));
    },
    'labels.list': async function () {
      var _0x1b4383 = await _0x1ae34a().labels.getAllLabels();
      return _0x1b4383.map(function (_0x1386d1) {
        return {
          id: String(_0x1386d1.id),
          name: _0x1386d1.name || '',
          color: _0x1386d1.hexColor || _0x1386d1.colorHex || '',
        };
      });
    },
    'labels.set': async function (_0x4d0a8f, _0x423027, _0x31ec3b) {
      var _0xc25d18 = _0x1ae34a();
      var _0x2b0321 = {
        labelId: String(_0x423027),
        type: _0x31ec3b === 'remove' ? 'remove' : 'add',
      };
      try {
        await _0xc25d18.labels.addOrRemoveLabels(_0x4d0a8f, [_0x2b0321]);
      } catch (_0x57b962) {
        var _0x265668 = /not a business|is_not_business/i.test(
          String((_0x57b962 && (_0x57b962.code || _0x57b962.message)) || ''),
        );
        var _0x36366a = _0x1eb946(function () {
          return _0xc25d18.whatsapp.LabelStore;
        }, null);
        var _0x5069d1 = []
          .concat(_0x4d0a8f)
          .map(function (_0x429fbe) {
            return _0x1eb946(function () {
              return _0xc25d18.whatsapp.ChatStore.get(_0x429fbe);
            }, null);
          })
          .filter(Boolean);
        if (
          !_0x265668 ||
          !_0x36366a ||
          typeof _0x36366a.addOrRemoveLabels !== 'function' ||
          !_0x5069d1.length
        ) {
          throw _0x57b962;
        }
        await _0x36366a.addOrRemoveLabels(
          [
            {
              id: _0x2b0321.labelId,
              type: _0x2b0321.type,
            },
          ],
          _0x5069d1,
        );
      }
      return true;
    },
    'media.download': async function (_0x56edf1) {
      var _0xee29b9 = await _0x1ae34a().chat.downloadMedia(_0x56edf1);
      return _0x2cdefa(_0xee29b9);
    },
  };
  window.addEventListener('message', function (_0x3acdc4) {
    if (_0x3acdc4.source !== window) {
      return;
    }
    var _0x33cda6 = _0x3acdc4.data;
    if (
      !_0x33cda6 ||
      _0x33cda6.source !== 'wacrm-iso' ||
      typeof _0x33cda6.method !== 'string'
    ) {
      return;
    }
    var _0x292b9c = _0x43cc8a[_0x33cda6.method];
    if (!_0x292b9c) {
      _0x464552({
        id: _0x33cda6.id,
        ok: false,
        error: 'Unknown bridge method: ' + _0x33cda6.method,
      });
      return;
    }
    Promise.resolve()
      .then(function () {
        return _0x292b9c.apply(null, _0x33cda6.args || []);
      })
      .then(function (_0x14bad1) {
        _0x464552({
          id: _0x33cda6.id,
          ok: true,
          result: _0x14bad1 === undefined ? null : _0x14bad1,
        });
      })
      .catch(function (_0x206777) {
        _0x464552({
          id: _0x33cda6.id,
          ok: false,
          error: String((_0x206777 && _0x206777.message) || _0x206777),
        });
      });
  });
  var _0xcc2605 = false;
  function _0x1d180b() {
    var _0x55e2c2 = window.WPP;
    if (_0xcc2605 || !_0x55e2c2 || !_0x55e2c2.on) {
      return;
    }
    _0xcc2605 = true;
    function _0x1a66a9(_0x317f3d, _0x16497e) {
      _0x55e2c2.on(_0x317f3d, function (_0x1efcb2) {
        try {
          _0x464552({
            event: _0x317f3d,
            data: _0x16497e ? _0x16497e(_0x1efcb2) : null,
          });
        } catch (_0x5f5b56) {}
      });
    }
    _0x1a66a9('chat.new_message', _0x58bc01);
    _0x1a66a9('chat.msg_revoke', function (_0x3ef0bf) {
      return {
        id: _0x13d080(_0x3ef0bf && _0x3ef0bf.id),
      };
    });
    _0x1a66a9('chat.active_chat', function (_0x1a560d) {
      var _0x2b7211 = _0x1a560d && _0x1a560d.chat ? _0x1a560d.chat : _0x1a560d;
      if (_0x2b7211) {
        return _0x491f07(_0x2b7211);
      } else {
        return null;
      }
    });
    _0x1a66a9('chat.new_chat', function (_0x4a04e0) {
      var _0xb7297f = _0x4a04e0 && _0x4a04e0.chat ? _0x4a04e0.chat : _0x4a04e0;
      if (_0xb7297f) {
        return _0x491f07(_0xb7297f);
      } else {
        return null;
      }
    });
    _0x1a66a9('chat.unread_count_changed', function (_0x27ec14) {
      var _0x57d327 = _0x27ec14 && _0x27ec14.chat ? _0x27ec14.chat : _0x27ec14;
      if (_0x57d327) {
        return _0x491f07(_0x57d327);
      } else {
        return null;
      }
    });
    _0x1a66a9('chat.update_label', function () {
      return null;
    });
    _0x1a66a9('conn.logout', function () {
      return null;
    });
    _0x1a66a9('conn.main_ready', function () {
      return null;
    });
    _0x1a66a9('conn.authenticated', function () {
      return null;
    });
  }
  var _0x492f30 = false;
  function _0x3ed8b6() {
    var _0x171d2a = window.WPP;
    if (_0x171d2a) {
      _0x1d180b();
    }
    var _0x21e3c3 = !!_0x171d2a && !!_0x171d2a.isFullReady;
    if (_0x21e3c3 !== _0x492f30) {
      _0x492f30 = _0x21e3c3;
      _0x464552({
        event: 'ready',
        data: {
          ready: _0x21e3c3,
          status: _0x43cc8a.status(),
        },
      });
    }
  }
  setInterval(_0x3ed8b6, 700);
  _0x3ed8b6();
  _0x464552({
    event: 'bridge',
    data: {
      loaded: true,
    },
  });
})();
