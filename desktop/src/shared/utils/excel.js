/**
 * Excel (XLSX) Import & Export Utility — powered by SheetJS
 * Handles reading Excel/CSV files and writing professional Excel reports
 */

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('[Excel] xlsx package not available. Run: npm install xlsx');
  XLSX = null;
}

/**
 * Parse an Excel (.xlsx) or CSV file buffer into an array of contact objects.
 * Auto-detects columns: phone/mobile/number -> phone, name/fullname -> Name, company/org -> Company
 */
function parseExcelBuffer(buffer) {
  if (!XLSX) throw new Error('xlsx package not installed. Run: npm install xlsx');

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows || rows.length === 0) return [];

  // Auto-map known column header variants
  const KEY_MAP = {
    phone: ['phone', 'mobile', 'number', 'phonenumber', 'mobilenumber', 'contact', 'whatsapp'],
    Name: ['name', 'fullname', 'firstname', 'first_name', 'customer'],
    Company: ['company', 'org', 'organization', 'business', 'firm'],
    Email: ['email', 'emailaddress', 'mail'],
    City: ['city', 'location', 'place']
  };

  function detectColumnKey(rawKey) {
    const normalized = rawKey.toLowerCase().replace(/\s|_|-/g, '');
    for (const [target, variants] of Object.entries(KEY_MAP)) {
      if (variants.includes(normalized)) return target;
    }
    return rawKey; // Keep original if no match
  }

  return rows.map((row, idx) => {
    const mapped = { id: `excel_${idx}` };
    for (const rawKey of Object.keys(row)) {
      const targetKey = detectColumnKey(rawKey);
      mapped[targetKey] = String(row[rawKey] || '').trim();
    }

    // Normalize phone number
    if (mapped.phone) {
      mapped.phone = mapped.phone.replace(/\D+/g, '');
    }

    return mapped;
  }).filter(c => c.phone && c.phone.length >= 7);
}

/**
 * Export an array of objects to an XLSX buffer.
 * @param {Object[]} data - Rows to export
 * @param {string[]} columns - Column keys in order
 * @param {string} sheetName - Sheet tab name
 * @param {Object} metadata - Optional header metadata rows before data
 */
function exportToXlsxBuffer(data, columns, sheetName = 'Sheet1', metadata = null) {
  if (!XLSX) throw new Error('xlsx package not installed. Run: npm install xlsx');

  const aoa = []; // Array of Arrays for sheet

  // Metadata header rows (e.g., group name, export date)
  if (metadata) {
    for (const [key, val] of Object.entries(metadata)) {
      aoa.push([key, val]);
    }
    aoa.push([]); // Blank separator row
  }

  // Column header row
  aoa.push(columns);

  // Data rows
  for (const row of data) {
    aoa.push(columns.map(col => row[col] != null ? row[col] : ''));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto column widths
  const colWidths = columns.map(col => ({
    wch: Math.max(col.length + 2, ...data.map(r => String(r[col] || '').length + 2))
  }));
  ws['!cols'] = colWidths;

  // Style header row bold (offset by metadata rows)
  const headerRowIndex = metadata ? Object.keys(metadata).length + 1 : 0;
  for (let c = 0; c < columns.length; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = { font: { bold: true } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Export group participants to an XLSX Buffer
 */
function exportGroupParticipantsToXlsx(participants, groupName) {
  return exportToXlsxBuffer(
    participants.map(p => ({
      'Phone Number': `+${p.phone}`,
      'Role': p.isAdmin ? 'Group Admin' : 'Member',
      'Group Name': groupName || 'Group'
    })),
    ['Phone Number', 'Role', 'Group Name'],
    'Participants',
    {
      'Group Name': groupName || 'Group',
      'Total Members': participants.length,
      'Exported On': new Date().toLocaleString()
    }
  );
}

/**
 * Export number validation results to XLSX
 */
function exportValidationResultsToXlsx(results, filterValid = false) {
  const filtered = filterValid ? results.filter(r => r.valid) : results;
  return exportToXlsxBuffer(
    filtered.map(r => ({
      'Phone Number': `+${r.phone}`,
      'WhatsApp Status': r.valid ? 'Active on WhatsApp' : 'Not Registered',
      'Type': r.details && r.details.isBusiness ? 'Business Account' : 'Personal'
    })),
    ['Phone Number', 'WhatsApp Status', 'Type'],
    'Validation Results',
    {
      'Total Checked': results.length,
      'Active WhatsApp': results.filter(r => r.valid).length,
      'Not Registered': results.filter(r => !r.valid).length,
      'Exported On': new Date().toLocaleString()
    }
  );
}

/**
 * Export contact book to XLSX
 */
function exportContactsToXlsx(contacts) {
  return exportToXlsxBuffer(
    contacts.map(c => ({
      'Phone': `+${c.phone}`,
      'Name': c.Name || '',
      'Company': c.Company || '',
      'Tags': Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
      'Added On': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
    })),
    ['Phone', 'Name', 'Company', 'Tags', 'Added On'],
    'Contacts',
    { 'Total Contacts': contacts.length, 'Exported On': new Date().toLocaleString() }
  );
}

/**
 * Export campaign report to XLSX
 */
function exportCampaignReportToXlsx(campaign) {
  const logs = campaign.logs || [];
  return exportToXlsxBuffer(
    logs.map(l => ({
      'Phone': `+${l.phone}`,
      'Name': l.Name || '',
      'Status': l.status,
      'Error': l.error || '',
      'Timestamp': l.timestamp ? new Date(l.timestamp).toLocaleString() : ''
    })),
    ['Phone', 'Name', 'Status', 'Error', 'Timestamp'],
    'Campaign Report',
    {
      'Campaign Title': campaign.title || 'Campaign',
      'Total': campaign.total || 0,
      'Sent': campaign.sent || 0,
      'Failed': campaign.failed || 0,
      'Run Date': campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '',
      'Exported On': new Date().toLocaleString()
    }
  );
}

module.exports = {
  parseExcelBuffer,
  exportToXlsxBuffer,
  exportGroupParticipantsToXlsx,
  exportValidationResultsToXlsx,
  exportContactsToXlsx,
  exportCampaignReportToXlsx
};
