/**
 * Hardware ID (HWID) and License Verification Utility
 * Generates unique device fingerprints and handles cryptographic license keys
 */

const os = require('os');
const crypto = require('crypto');

function getHardwareId() {
  const parts = [
    os.platform(),
    os.arch(),
    os.cpus().map(c => c.model).sort().join('|'),
    os.totalmem().toString(),
    os.hostname(),
    os.userInfo().username
  ];

  // Also include MAC addresses of non-internal interfaces
  const ifaces = os.networkInterfaces();
  const macs = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        macs.push(net.mac);
      }
    }
  }
  parts.push(macs.sort().join('|'));

  const raw = parts.join(':::');
  const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();

  // Return formatted HWID: XXXX-XXXX-XXXX-XXXX
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

/**
 * Secret salt used for offline signature generation
 */
const LICENSE_SECRET = 'OPENMSG_DESKTOP_SECURE_SALT_V1_2026';

/**
 * Generate a valid license key for a given HWID
 */
function generateLicenseKey(hwid, options = {}) {
  const payload = {
    hwid: hwid.trim().toUpperCase(),
    customer: options.customer || 'Licensed User',
    plan: options.plan || 'PRO_UNLIMITED',
    expiresAt: options.expiresAt || null, // null = Lifetime
    issuedAt: Date.now()
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payloadB64)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();

  return `KEY-${payloadB64}-${signature}`;
}

/**
 * Verify a license key against current machine HWID
 */
function verifyLicenseKey(licenseKey, currentHwid) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, reason: 'License key is missing or invalid format' };
  }

  const parts = licenseKey.trim().split('-');
  if (parts.length < 3 || parts[0] !== 'KEY') {
    return { valid: false, reason: 'Invalid key structure' };
  }

  const payloadB64 = parts[1];
  const signature = parts[2];

  // 1. Verify signature
  const expectedSig = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payloadB64)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();

  if (signature !== expectedSig) {
    return { valid: false, reason: 'Invalid cryptographic signature. License may be forged.' };
  }

  // 2. Decode payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
  } catch (e) {
    return { valid: false, reason: 'Corrupt license payload' };
  }

  // 3. Verify HWID match
  if (payload.hwid !== currentHwid.trim().toUpperCase()) {
    return {
      valid: false,
      reason: `Key is locked to a different machine (Locked: ${payload.hwid}, Current: ${currentHwid})`
    };
  }

  // 4. Verify Expiration
  if (payload.expiresAt && Date.now() > payload.expiresAt) {
    return {
      valid: false,
      reason: `License expired on ${new Date(payload.expiresAt).toLocaleDateString()}`
    };
  }

  return {
    valid: true,
    plan: payload.plan,
    customer: payload.customer,
    expiresAt: payload.expiresAt,
    isLifetime: !payload.expiresAt
  };
}

module.exports = {
  getHardwareId,
  generateLicenseKey,
  verifyLicenseKey
};
