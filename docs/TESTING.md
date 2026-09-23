# OpenMsg — Testing Strategy & Verification Guide

This document defines the testing strategy, verification methods, and recommended testing patterns for OpenMsg.

---

## 1. Current Test Configuration

### Existing `package.json` Scripts
As verified in `package.json`:
```json
"scripts": {
  "test": "echo \"OpenMsg loaded successfully\" && exit 0"
}
```
Currently, the repository does not use a third-party npm test framework to maintain zero external dependencies.

---

## 2. Automated Static Verification

Developers and AI assistants must run native syntax checks on all modified files:

```bash
# Check syntax of all JavaScript source files:
for f in $(find src pages -name "*.js"); do node --check "$f" || echo "Error in $f"; done
```

### Import Integrity Check
Run this Python one-liner to verify 100% resolution of all module imports:
```bash
python3 -c "
import os, re
files = [os.path.join(r, f) for r, _, fs in os.walk('src') for f in fs if f.endswith('.js')]
def get_exp(p):
    with open(p) as fp: c = fp.read()
    return set(re.findall(r'export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([a-zA-Z0-9_$]+)', c)) | set(sum([x.split(',') for x in re.findall(r'export\s*\{([^}]+)\}', c)], []))
all_e = {f: {x.strip().split(' as ')[-1].strip() for x in get_exp(f)} for f in files}
for f in files:
    with open(f) as fp: c = fp.read()
    for m in re.finditer(r'import\s+\{([^}]+)\}\s+from\s+[\'\"]([^\'\"]+)[\'\"]', c):
        tgt = os.path.normpath(os.path.join(os.path.dirname(f), m.group(2) + ('' if m.group(2).endswith('.js') else '.js')))
        if tgt in all_e:
            for item in m.group(1).split(','):
                name = item.strip().split(' as ')[0].strip()
                if name and name not in all_e[tgt]: print(f'MISSING EXPORT: {name} in {tgt} (imported by {f})')
"
```

---

## 3. Recommended Unit Testing Harness (Zero-Dependency)

Because OpenMsg uses pure ES modules, tests can run natively using Node.js's built-in test runner (`node:test` & `node:assert`).

### Example Test for CRM Operations (`test/crm.test.js`):
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryBackend } from '../src/core/store.js';
import { createCrm } from '../src/core/crm.js';

test('CRM: creates contact and saves custom attributes', async () => {
  const store = await createStore(memoryBackend(), { writeDelay: 0 }).init();
  const crm = createCrm({ store });

  await crm.ensureDefaults();
  const contact = await crm.saveContact('1234567890@c.us', { fullName: 'Alice' });

  assert.equal(contact.fullName, 'Alice');
  assert.equal(crm.displayName('1234567890@c.us'), 'Alice');

  await crm.setAttribute('1234567890@c.us', 'tier', 'VIP');
  assert.equal(crm.contact('1234567890@c.us').attributes.tier, 'VIP');
});
```

---

## 4. Manual Verification Checklist

When validating changes in a live browser session:

1. **Extension Loading**:
   - Navigate to `chrome://extensions` → enable Developer Mode → Click "Load unpacked" → select repository root.
   - Confirm no errors or manifest warnings appear.
2. **WhatsApp Web In-Page Injection**:
   - Open `https://web.whatsapp.com/` and scan QR / connect.
   - Verify OpenMsg topbar appears at the top (50px height).
   - Verify `#app` layout offset correctly adjusts without vertical jumping.
3. **Settings Menu & About Dialog**:
   - Click Settings icon in the topbar.
   - Confirm menu displays properly and clicking "About OpenMsg" opens the About dialog without console errors.
4. **CRM Sidebar Drawer**:
   - Click an active chat conversation in WhatsApp Web.
   - Confirm the CRM side-drawer opens, showing contact info, notes, and tags.
5. **Standalone Workspace Tab**:
   - Open `pages/workspace.html?panel=kanban` in a separate tab.
   - Verify Kanban board loads and syncs cards with the WhatsApp Web session.
