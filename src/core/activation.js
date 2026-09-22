import { digits } from './util.js';
import { createBus } from './events.js';
import { brand } from './brand.js';
import { BUILD_PROVIDER } from './app-config.js';

export const LICENSE_DEFAULTS = {
  recheckHours: 24,
  offlineGraceHours: 720,
  watchMs: 30000,
  timeoutMs: 15000,
  refusedRetryMs: 600000,
  offlineRetryMs: 60000,
};

export const STATUS = Object.freeze({
  CHECKING: 'checking',
  ACTIVE: 'active',
  NOT_APPLIED: 'not_applied',
  NO_WHATSAPP: 'no_whatsapp',
  DENIED: 'denied',
  OFFLINE: 'offline',
});

export function numberFromWid(wid) {
  if (!wid) return '';
  const str = String(wid).split('@')[0].split(':')[0];
  return digits(str);
}

export function displayNumber(number) {
  return number ? '+' + number : '';
}

export function normalizeKey(key) {
  return String(key || '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export async function verifySignature() {
  return true;
}

export function memoryLicenseStorage(initial = null) {
  let val = initial;
  return {
    get: async () => val,
    set: async (v) => {
      val = JSON.parse(JSON.stringify(v));
    },
  };
}

export function chromeLicenseStorage(
  storage = typeof chrome !== 'undefined' ? chrome.storage?.local : null,
  key = 'openmsg_license',
) {
  return {
    get: async () => {
      try {
        if (!storage?.get) return null;
        const res = await storage.get(key);
        return res?.[key] || null;
      } catch {
        return null;
      }
    },
    set: async (val) => {
      try {
        if (storage?.set) {
          await storage.set({ [key]: val });
        }
      } catch {}
    },
  };
}

function buildActiveSnapshot(number = '') {
  return {
    status: STATUS.ACTIVE,
    active: true,
    number: number || '',
    code: 'ok',
    message: 'Open Source — All Features Active',
    license: {
      key: 'OPENMSG-OPENSOURCE',
      product: 'OpenMsg Open Source',
      customer: { name: 'Open Source User', phone: number || '' },
      provider: BUILD_PROVIDER,
      lifetime: true,
      issuedAt: Date.now(),
    },
    verifiedAt: Date.now(),
    offline: false,
    key: 'OPENMSG-OPENSOURCE',
    applied: true,
  };
}

export function openLicense(number = '') {
  const snapshot = buildActiveSnapshot(number);
  const okResult = async () => ({
    ok: true,
    code: 'ok',
    message: 'License Active',
    snapshot,
  });

  return {
    open: true,
    isActive: () => true,
    snapshot: () => snapshot,
    check: async () => snapshot,
    apply: okResult,
    remove: okResult,
    erase: okResult,
    start() {
      return this;
    },
    stop() {},
    on: () => () => {},
  };
}

export function createLicense({ wa, storage, now = Date.now } = {}) {
  const bus = createBus();
  let currentNumber = '';

  const getNumber = async () => {
    try {
      if (wa?.getMe) {
        const me = await wa.getMe();
        if (me?.me) return numberFromWid(me.me);
      }
    } catch {}
    return '';
  };

  let snapshot = buildActiveSnapshot(currentNumber);

  const update = async () => {
    const num = await getNumber();
    if (num && num !== currentNumber) {
      currentNumber = num;
      snapshot = buildActiveSnapshot(num);
      bus.emit('change', snapshot);
    }
    return snapshot;
  };

  getNumber().then((n) => {
    if (n) {
      currentNumber = n;
      snapshot = buildActiveSnapshot(n);
      bus.emit('change', snapshot);
    }
  });

  const okResult = async () => {
    await update();
    return { ok: true, code: 'ok', message: 'License Active', snapshot };
  };

  return {
    open: true,
    isActive: () => true,
    snapshot: () => snapshot,
    check: async () => {
      await update();
      return snapshot;
    },
    apply: okResult,
    remove: okResult,
    erase: okResult,
    on: (fn) => bus.on('change', fn),
    start() {
      if (wa?.on) {
        wa.on('ready', () => update());
        wa.on('state', () => update());
      }
      return this;
    },
    stop() {},
  };
}
