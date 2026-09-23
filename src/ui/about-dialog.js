import { h, logo, icon } from './dom.js';
import * as kit from './kit.js';
import { brand } from '../core/brand.js';
import { BUILD_PROVIDER } from '../core/app-config.js';
import { STATUS, displayNumber, normalizeKey } from '../core/activation.js';

export { STATUS, displayNumber, normalizeKey };

/**
 * Returns current extension version from manifest.
 */
export function appVersion() {
  try {
    return chrome.runtime.getManifest().version || '0.0.1';
  } catch {
    return '0.0.1';
  }
}

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

/**
 * Opens the About OpenMsg dialog with version and project info.
 */
export function openAboutDialog(app, shell) {
  if (shell && shell.__aboutModal) {
    return shell.__aboutModal;
  }

  const aboutBody = h(
    'div',
    { class: 'wc-about' },
    h(
      'div',
      { class: 'wc-about-head' },
      logo(40),
      h(
        'div',
        { class: 'wc-about-headtext' },
        h('strong', null, brand()),
        h('span', null, 'Version ' + appVersion()),
      ),
    ),
    h(
      'p',
      { class: 'wc-about-text' },
      'Free & Open-Source CRM workspace inside WhatsApp Web. Your data stays 100% local in your browser.',
    ),
    h(
      'div',
      { class: 'wc-about-slot' },
      h(
        'section',
        { class: 'wc-about-provider', 'aria-label': 'Project info' },
        h('span', { class: 'wc-about-label' }, 'Project Details'),
        h(
          'div',
          { class: 'wc-about-name' },
          h('strong', null, BUILD_PROVIDER.name),
        ),
        h(
          'ul',
          { class: 'wc-about-rows' },
          h(
            'li',
            { class: 'wc-about-row' },
            icon('globe', 15),
            h(
              'div',
              { class: 'wc-about-rowtext' },
              h('small', null, 'Repository & Issues'),
              h(
                'a',
                {
                  href: BUILD_PROVIDER.website,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
                BUILD_PROVIDER.website,
              ),
            ),
          ),
          h(
            'li',
            { class: 'wc-about-row' },
            icon('sparkles', 15),
            h(
              'div',
              { class: 'wc-about-rowtext' },
              h('small', null, 'License'),
              h('span', null, 'MIT License — 100% Free & Open Source'),
            ),
          ),
        ),
      ),
    ),
  );

  const modal = kit.openModal({
    title: 'About ' + brand(),
    width: 440,
    body: aboutBody,
    footer: h(
      'div',
      { class: 'wc-about-foot' },
      kit.button('Close', {
        variant: 'dark',
        onClick: () => modal.close(),
      }),
    ),
    onClose: () => {
      if (shell) {
        shell.__aboutModal = null;
      }
    },
  });

  if (shell) {
    shell.__aboutModal = modal;
  }
  return modal;
}

