export const FALLBACK_BRAND = 'OpenMsg';
export function brand() {
  try {
    const manifest = chrome.runtime.getManifest();
    const brandName = manifest.short_name || manifest.name;
    if (brandName) {
      return String(brandName);
    }
  } catch (_0x30253f) {}
  return FALLBACK_BRAND;
}
