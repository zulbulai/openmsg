export const FALLBACK_BRAND = 'WACRM';
export function brand() {
  try {
    const _0x3e4f79 = chrome.runtime.getManifest().name;
    if (_0x3e4f79) {
      return String(_0x3e4f79);
    }
  } catch (_0x30253f) {}
  return FALLBACK_BRAND;
}
