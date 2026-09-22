const name = chrome.runtime.getManifest().name;
document.title = 'Allow access - ' + name;
for (const el of document.querySelectorAll('[data-brand]')) {
  el.textContent = name;
}
const params = new URLSearchParams(location.search);
const origins = (params.get('origins') || '')
  .split(',')
  .filter(Boolean)
  .map((_0x182947) => _0x182947.replace(/\/+$/, '') + '/*');
const list = document.getElementById('origins');
for (const o of origins) {
  const li = document.createElement('li');
  li.textContent = o.replace('/*', '');
  list.appendChild(li);
}
const result = document.getElementById('result');
document
  .getElementById('cancel')
  .addEventListener('click', () => window.close());
document.getElementById('allow').addEventListener('click', async () => {
  try {
    const _0x5606be = await chrome.permissions.request({
      origins: origins,
    });
    result.textContent = _0x5606be
      ? 'Access allowed. You can close this window and try again.'
      : 'Access was not allowed.';
    result.className = _0x5606be ? 'ok' : 'bad';
    if (_0x5606be) {
      setTimeout(() => window.close(), 1400);
    }
  } catch (_0xd1a3c4) {
    result.textContent =
      'Could not ask for access: ' +
      (_0xd1a3c4 && _0xd1a3c4.message ? _0xd1a3c4.message : _0xd1a3c4);
    result.className = 'bad';
  }
});
