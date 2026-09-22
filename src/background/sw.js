const WA_URL = 'https://web.whatsapp.com/';
const ALARM_PREFIX = 'wacrm:';
const INFO_KEY = 'wacrm:alarmInfo';
const MAX_BODY = 2097152;
async function waTabs() {
  return chrome.tabs.query({
    url: WA_URL + '*',
  });
}
async function openOrFocusWhatsApp() {
  const _0x5d4648 = await waTabs();
  const _0x3c1b2a = _0x5d4648[0];
  if (_0x3c1b2a && _0x3c1b2a.id !== undefined) {
    await chrome.tabs.update(_0x3c1b2a.id, {
      active: true,
    });
    if (_0x3c1b2a.windowId !== undefined) {
      await chrome.windows.update(_0x3c1b2a.windowId, {
        focused: true,
      });
    }
    return _0x3c1b2a;
  }
  return chrome.tabs.create({
    url: WA_URL,
  });
}
async function findWorkspaceTab(_0x10fafe) {
  try {
    if (chrome.runtime.getContexts) {
      const _0x249bb8 = await chrome.runtime.getContexts({
        contextTypes: ['TAB'],
        documentUrls: [_0x10fafe],
      });
      for (const _0x35be76 of _0x249bb8) {
        if (_0x35be76.tabId >= 0) {
          return await chrome.tabs.get(_0x35be76.tabId);
        }
      }
      return null;
    }
    const _0xcea6e3 = ((await chrome.storage.session.get('workspaceTabs'))
      .workspaceTabs || {})[_0x10fafe];
    if (_0xcea6e3 !== undefined) {
      return await chrome.tabs.get(_0xcea6e3);
    } else {
      return null;
    }
  } catch (_0x9696f) {
    return null;
  }
}
async function openWorkspacePage(_0x2ce3db) {
  const _0xea1af5 = /^[a-z-]{1,30}$/.test(String(_0x2ce3db || ''))
    ? _0x2ce3db
    : 'kanban';
  const _0x34f6bd =
    chrome.runtime.getURL('pages/workspace.html') + '?panel=' + _0xea1af5;
  const _0x18ce7b = await findWorkspaceTab(_0x34f6bd);
  if (_0x18ce7b && _0x18ce7b.id !== undefined) {
    await chrome.tabs.update(_0x18ce7b.id, {
      active: true,
    });
    if (_0x18ce7b.windowId !== undefined) {
      await chrome.windows.update(_0x18ce7b.windowId, {
        focused: true,
      });
    }
    return _0x18ce7b;
  }
  const _0x5342d0 = await chrome.tabs.create({
    url: _0x34f6bd,
  });
  const _0x5692cf = await chrome.storage.session.get('workspaceTabs');
  await chrome.storage.session.set({
    workspaceTabs: Object.assign(_0x5692cf.workspaceTabs || {}, {
      [_0x34f6bd]: _0x5342d0.id,
    }),
  });
  return _0x5342d0;
}
async function doHttp({
  url: _0x5ad40f,
  method: _0x855bc7,
  headers: _0x126108,
  body: _0xe3073d,
  timeoutMs: _0x4c3dec,
}) {
  let _0x434e4b;
  try {
    _0x434e4b = new URL(_0x5ad40f);
  } catch (_0x36e5a9) {
    return {
      error: 'That address is not valid.',
    };
  }
  if (_0x434e4b.protocol !== 'https:' && _0x434e4b.protocol !== 'http:') {
    return {
      error: 'Only http and https addresses are allowed.',
    };
  }
  const _0x5b7e6a = await chrome.permissions.contains({
    origins: [_0x434e4b.origin + '/*'],
  });
  if (!_0x5b7e6a) {
    return {
      needsPermission: true,
      origin: _0x434e4b.origin,
    };
  }
  const _0xa9c667 = new AbortController();
  const _0x554a5f = setTimeout(
    () => _0xa9c667.abort(),
    Math.min(Number(_0x4c3dec) || 20000, 120000),
  );
  try {
    const _0x402134 = await fetch(_0x5ad40f, {
      method: _0x855bc7 || 'GET',
      headers: _0x126108 || {},
      body: _0xe3073d || undefined,
      signal: _0xa9c667.signal,
      credentials: 'omit',
      cache: 'no-store',
    });
    let _0x4b3f2c = await _0x402134.text();
    if (_0x4b3f2c.length > MAX_BODY) {
      _0x4b3f2c = _0x4b3f2c.slice(0, MAX_BODY);
    }
    return {
      ok: _0x402134.ok,
      status: _0x402134.status,
      text: _0x4b3f2c,
    };
  } catch (_0x14ad59) {
    return {
      error:
        _0x14ad59 && _0x14ad59.name === 'AbortError'
          ? 'The request timed out.'
          : (_0x14ad59 && _0x14ad59.message) || 'The request failed.',
    };
  } finally {
    clearTimeout(_0x554a5f);
  }
}
async function hasAccess(_0x103fe1) {
  try {
    const _0x474717 = new URL(_0x103fe1);
    return {
      ok: await chrome.permissions.contains({
        origins: [_0x474717.origin + '/*'],
      }),
    };
  } catch (_0x314ffc) {
    return {
      ok: false,
    };
  }
}
async function openGrant(_0x445f6a) {
  const _0x3ec111 = (_0x445f6a || [])
    .map((_0x3a931f) => {
      try {
        return new URL(_0x3a931f).origin;
      } catch (_0x3954ec) {
        return null;
      }
    })
    .filter(Boolean);
  if (!_0x3ec111.length) {
    return {
      ok: false,
    };
  }
  await chrome.windows.create({
    url: chrome.runtime.getURL(
      'pages/grant.html?origins=' + encodeURIComponent(_0x3ec111.join(',')),
    ),
    type: 'popup',
    width: 480,
    height: 440,
  });
  return {
    ok: true,
  };
}
async function setAlarms(_0x39ec2e) {
  const _0x43a559 = await chrome.alarms.getAll();
  await Promise.all(
    _0x43a559
      .filter((_0x1c1158) => _0x1c1158.name.startsWith(ALARM_PREFIX))
      .map((_0x8b7dce) => chrome.alarms.clear(_0x8b7dce.name)),
  );
  const _0x48bd4b = {};
  const _0x37de4b = Date.now();
  for (const _0x4d2d06 of (_0x39ec2e || []).slice(0, 400)) {
    if (!_0x4d2d06.key || !_0x4d2d06.at || _0x4d2d06.at <= _0x37de4b) {
      continue;
    }
    chrome.alarms.create(ALARM_PREFIX + _0x4d2d06.key, {
      when: _0x4d2d06.at,
    });
    _0x48bd4b[ALARM_PREFIX + _0x4d2d06.key] = {
      title: _0x4d2d06.title,
      message: _0x4d2d06.message,
    };
  }
  await chrome.storage.local.set({
    [INFO_KEY]: _0x48bd4b,
  });
}
async function notify({
  id: _0x3cd5d0,
  title: _0x356797,
  message: _0x380afc,
  data: _0x146826,
}) {
  const _0x1b104b = _0x3cd5d0 || 'n:' + Date.now();
  await chrome.notifications.create(_0x1b104b, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: String(_0x356797 || chrome.runtime.getManifest().name),
    message: String(_0x380afc || ''),
    priority: 1,
  });
  if (_0x146826) {
    const _0x1425ba = await chrome.storage.session.get('notifData');
    _0x1425ba.notifData = _0x1425ba.notifData || {};
    _0x1425ba.notifData[_0x1b104b] = _0x146826;
    await chrome.storage.session.set(_0x1425ba);
  }
}
chrome.alarms.onAlarm.addListener(async (_0x50c073) => {
  if (!_0x50c073.name.startsWith(ALARM_PREFIX)) {
    return;
  }
  const _0x1ce117 = await waTabs();
  if (_0x1ce117.length) {
    for (const _0x449d4d of _0x1ce117) {
      if (_0x449d4d.id !== undefined) {
        chrome.tabs
          .sendMessage(_0x449d4d.id, {
            type: 'alarm',
            key: _0x50c073.name.slice(ALARM_PREFIX.length),
          })
          .catch(() => {});
      }
    }
    return;
  }
  const _0x26f6f0 = (await chrome.storage.local.get(INFO_KEY))[INFO_KEY] || {};
  const _0x2109c2 = _0x26f6f0[_0x50c073.name] || {
    title: chrome.runtime.getManifest().name,
    message: 'Something is due.',
  };
  notify({
    id: 'alarm:' + _0x50c073.name,
    title: _0x2109c2.title,
    message: _0x2109c2.message,
  });
});
chrome.notifications.onClicked.addListener(async (_0x33e655) => {
  chrome.notifications.clear(_0x33e655);
  const _0x447d8c = await openOrFocusWhatsApp();
  const _0x32d95f = await chrome.storage.session.get('notifData');
  const _0x498fc5 = _0x32d95f.notifData && _0x32d95f.notifData[_0x33e655];
  if (_0x498fc5 && _0x447d8c && _0x447d8c.id !== undefined) {
    for (let _0x10bf78 = 0; _0x10bf78 < 10; _0x10bf78++) {
      try {
        await chrome.tabs.sendMessage(_0x447d8c.id, {
          type: 'notification-click',
          data: _0x498fc5,
        });
        break;
      } catch (_0x22324c) {
        await new Promise((_0x2025a2) => setTimeout(_0x2025a2, 1000));
      }
    }
  }
});
chrome.runtime.onMessage.addListener((_0x27f09f, _0x5e4974, _0x2bba8b) => {
  if (!_0x27f09f || typeof _0x27f09f.type !== 'string') {
    return false;
  }
  const _0x3cb8ea = async () => {
    switch (_0x27f09f.type) {
      case 'http':
        return doHttp(_0x27f09f);
      case 'has-access':
        return hasAccess(_0x27f09f.url);
      case 'grant':
        return openGrant(_0x27f09f.origins);
      case 'notify':
        await notify(_0x27f09f);
        return {
          ok: true,
        };
      case 'set-alarms':
        await setAlarms(_0x27f09f.items);
        return {
          ok: true,
        };
      case 'open-whatsapp':
        await openOrFocusWhatsApp();
        return {
          ok: true,
        };
      case 'open-page':
        await openWorkspacePage(_0x27f09f.panel);
        return {
          ok: true,
        };
      default:
        return {
          error: 'Unknown request',
        };
    }
  };
  _0x3cb8ea()
    .then(_0x2bba8b)
    .catch((_0x3c3f41) =>
      _0x2bba8b({
        error: (_0x3c3f41 && _0x3c3f41.message) || String(_0x3c3f41),
      }),
    );
  return true;
});
chrome.action.onClicked.addListener(() => {
  openOrFocusWhatsApp().catch(() => {});
});
chrome.runtime.onInstalled.addListener(async (_0x2f9299) => {
  if (_0x2f9299.reason === 'install' || _0x2f9299.reason === 'update') {
    for (const _0x4c7ab3 of await waTabs()) {
      if (_0x4c7ab3.id !== undefined) {
        chrome.tabs.reload(_0x4c7ab3.id);
      }
    }
  }
});
