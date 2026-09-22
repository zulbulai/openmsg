import { h } from './dom.js';
import { STATUS, displayNumber, normalizeKey } from '../core/activation.js';

export { STATUS, displayNumber, normalizeKey };

/**
 * OpenMsg is 100% Free & Open Source.
 * License dialog and status chips are completely removed.
 */
export function openLicenseDialog() {
  return null;
}

export function licenseChip() {
  const chipEl = h('span', { class: 'wc-license-chip-hidden', style: { display: 'none' } });
  return chipEl;
}

export function licenseNotice() {
  const noticeEl = h('div', { class: 'wc-license-notice', hidden: true, style: { display: 'none' } });
  return noticeEl;
}
