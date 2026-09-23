#!/usr/bin/env node
/**
 * Admin License Key Generator for OpenMsg Desktop
 * Usage: node generate-license.js <HWID> [CustomerName] [Plan] [ExpiryDays]
 *
 * Example:
 * node generate-license.js A1B2-C3D4-E5F6-7890 "Acme Corp" "PRO_LIFETIME" 0
 */

const { generateLicenseKey, verifyLicenseKey } = require('../src/shared/utils/hwid');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║             OPENMSG DESKTOP LICENSE GENERATOR CLI              ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  node generate-license.js <HWID> [CustomerName] [Plan] [DaysValid]

Arguments:
  <HWID>          Customer's Hardware ID (e.g. 5A3B-8F12-9C4D-E678)
  [CustomerName]  Client or Business Name (default: "Licensed Customer")
  [Plan]          Plan type (default: "PRO_ENTERPRISE")
  [DaysValid]     Days until expiry, 0 for Lifetime (default: 0)

Examples:
  node generate-license.js 5A3B-8F12-9C4D-E678 "Rahul Sharma" PRO_LIFETIME 0
  node generate-license.js 5A3B-8F12-9C4D-E678 "Global Agency" PRO_YEARLY 365
`);
  process.exit(0);
}

const hwid = args[0].trim();
const customer = args[1] || 'Licensed Customer';
const plan = args[2] || 'PRO_ENTERPRISE';
const daysValid = parseInt(args[3] || '0', 10);

const expiresAt = daysValid > 0 ? Date.now() + daysValid * 24 * 60 * 60 * 1000 : null;

const licenseKey = generateLicenseKey(hwid, {
  customer,
  plan,
  expiresAt
});

const verification = verifyLicenseKey(licenseKey, hwid);

console.log(`
======================================================
  OPENMSG DESKTOP LICENSE GENERATED SUCCESSFULLY
======================================================
Customer Name : ${customer}
Hardware ID   : ${hwid}
Plan Type     : ${plan}
Valid Until   : ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'LIFETIME (Never Expires)'}
Status        : ${verification.valid ? 'VALID & SIGNED' : 'ERROR: ' + verification.reason}
------------------------------------------------------
LICENSE KEY:
${licenseKey}
======================================================
Send this license key to your customer to activate!
`);
