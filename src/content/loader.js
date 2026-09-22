(async () => {
  try {
    await import(chrome.runtime.getURL('src/content/main.js'));
  } catch (_0x2fc18d) {
    console.error('[WACRM] could not start', _0x2fc18d);
  }
})();
