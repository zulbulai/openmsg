import { h, icon, logo, clear } from './dom.js';
import * as kit from './kit.js';
import { brand } from '../core/brand.js';
import { STATUS, displayNumber, normalizeKey } from '../core/license.js';
import { BUILD_PROVIDER } from '../core/license-config.js';

export { STATUS, displayNumber, normalizeKey };

const WHATSAPP_PHONE = '916306356544';

function whatsappIconSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'currentColor');
  svg.innerHTML = `<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>`;
  return svg;
}

export function openLicenseDialog(app, shell) {
  if (shell?.licenseModal) return shell.licenseModal;

  const licenseSnap = app?.license?.snapshot
    ? app.license.snapshot()
    : { number: '', active: true };
  const currentNum = licenseSnap.number || '';

  const headEl = h(
    'div',
    { class: 'wc-license-head' },
    logo(36),
    h(
      'div',
      { class: 'wc-license-headtext' },
      h('strong', null, brand()),
      h('span', { class: 'wc-chip wc-chip-ok' }, 'Full Unlimited Active'),
    ),
  );

  const gridEl = h(
    'div',
    { class: 'wc-license-grid' },
    h(
      'div',
      { class: 'wc-license-item' },
      h('span', null, 'Status'),
      h('strong', { style: { color: '#22c55e' } }, 'Active / Lifetime'),
    ),
    h(
      'div',
      { class: 'wc-license-item' },
      h('span', null, 'WhatsApp Account'),
      h('strong', null, currentNum ? displayNumber(currentNum) : 'Connected'),
    ),
    h(
      'div',
      { class: 'wc-license-item is-wide' },
      h('span', null, 'Admin / Support Contact'),
      h('strong', null, `+${WHATSAPP_PHONE} (WACRM Support)`),
    ),
  );

  const whatsappBtn = h(
    'a',
    {
      href: `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hello! I am using WACRM. My WhatsApp number is: +' + (currentNum || WHATSAPP_PHONE))}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'wc-btn',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#25D366',
        color: '#ffffff',
        fontWeight: '700',
        fontSize: '13.5px',
        height: '42px',
        borderRadius: '10px',
        textDecoration: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
      },
    },
    whatsappIconSvg(),
    h('span', null, `Send to WhatsApp (+${WHATSAPP_PHONE})`),
  );

  const infoText = h(
    'p',
    {
      class: 'wc-license-note',
      style: { textAlign: 'center', margin: '4px 0 0 0' },
    },
    'Click the button above to send your details or contact support directly on WhatsApp.',
  );

  const bodyEl = h(
    'div',
    { class: 'wc-license' },
    headEl,
    gridEl,
    whatsappBtn,
    infoText,
  );

  const modal = kit.openModal({
    title: `${brand()} License & Support`,
    subtitle: 'Unlimited Access',
    width: 440,
    body: bodyEl,
    footer: h(
      'div',
      {
        class: 'wc-modal-foot',
        style: { display: 'flex', justifyContent: 'flex-end', width: '100%' },
      },
      kit.button('Close', {
        variant: 'dark',
        onClick: () => modal.close(),
      }),
    ),
    onClose: () => {
      if (shell) shell.licenseModal = null;
    },
  });

  if (shell) shell.licenseModal = modal;
  return modal;
}

export function licenseChip(app, onClick) {
  const chipEl = h(
    'button',
    {
      type: 'button',
      class: 'wc-chip wc-chip-ok',
      style: {
        cursor: 'pointer',
        border: 'none',
        padding: '4px 10px',
        gap: '6px',
        display: 'inline-flex',
        alignItems: 'center',
      },
      title: `${brand()} License: Active (Unlimited)`,
      onClick: onClick,
    },
    icon('check-circle', 13),
    h('span', null, 'Active'),
  );

  return chipEl;
}

export function licenseNotice(app, shell, bus) {
  const noticeEl = h('div', { class: 'wc-license-notice', hidden: true });
  return noticeEl;
}
