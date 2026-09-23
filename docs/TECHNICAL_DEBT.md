# OpenMsg — Technical Debt Catalog

This document catalogues architectural inconsistencies, duplicated systems, monolithic modules, and maintenance risks identified across the OpenMsg codebase.

---

## 1. Minified / Obfuscated Variable Identifiers (`_0x...`)

- **Location**: Across `src/core/`, `src/panels/`, `src/bridge/main-bridge.js`, `src/ui/kit.js`.
- **Finding**: Many function arguments and local variables retain obfuscated names (e.g. `_0x14b869`, `_0x5c0d6c`) inherited from an upstream build process prior to open-sourcing.
- **Impact**: Reduces code readability and makes debugging stack traces more difficult for contributors.
- **Remediation**: Systematically rename parameters to descriptive names when maintaining or modifying individual modules. Avoid mass renames across the whole repository at once to prevent merge conflicts.

---

## 2. Functional Duplication: Message Bots vs. Visual Chatbots

- **Location**: `src/core/workflows.js` (Message Bots) vs. `src/core/chatbot.js` (Chatbots).
- **Finding**:
  - `src/core/workflows.js` implements keyword matching and auto-replies for individual/group chats.
  - `src/core/chatbot.js` implements a visual graph-based chatbot with keyword triggers, delays, and conditions.
  - In `src/core/automation.js`, incoming messages first check active chatbot sessions, then new chatbot triggers, and then iterate through `workflows`.
- **Impact**: Two different panels (`message-bot.js` and `chatbots.js`) configure automated responses, which can confuse users.
- **Remediation**: Unify simple keyword bots as a preset template within the visual chatbot engine.

---

## 3. Storage Collection Anomaly: `schedules` vs. `campaigns`

- **Location**: `src/core/store.js:COLLECTIONS` and `src/panels/schedules.js`.
- **Finding**:
  - `src/core/store.js` declares `'schedules'` in `COLLECTIONS`.
  - However, `src/panels/schedules.js` actually renders items from `campaigns` where `item.kind === 'schedule'`.
  - The `'schedules'` database collection is completely empty and unused.
- **Impact**: Redundant memory allocation and unused collection in backup exports.
- **Remediation**: Remove `'schedules'` from `COLLECTIONS` during next schema migration.

---

## 4. Large Monolithic Modules

Several source files exceed 1,000 lines of code:

| File | Line Count | Responsibility | Refactoring Recommendation |
| :--- | :--- | :--- | :--- |
| `src/core/chatbot.js` | 1,829 lines | Node definitions, validation, canvas helpers, and execution engine. | Split into `chatbot-nodes.js`, `chatbot-validator.js`, and `chatbot-engine.js`. |
| `src/ui/kit.js` | 1,616 lines | All reusable UI components (modals, forms, tables, drag-drop). | Group into `kit-form.js`, `kit-modal.js`, `kit-layout.js`. |
| `src/features/crm-drawer.js` | 1,117 lines | Contact drawer, note editor, reminder modal, field editors. | Extract modal editors into dedicated helper components. |
| `src/styles/wacrm.css` | 1,119 lines | Entire application stylesheet. | Keep centralized for simple Shadow DOM injection, but organize with CSS section index. |

---

## 5. Testing Infrastructure Deficit

- **Finding**: `package.json` contains no automated unit testing dependencies (e.g., Vitest, Node Test Runner) and has only an `echo` placeholder script.
- **Impact**: Contributors cannot run regression suites locally before committing changes.
- **Remediation**: Implement Node's built-in `node:test` runner to test pure business logic modules (`crm.js`, `scheduler.js`, `variables.js`, `store.js`) without adding heavy npm dependencies.
