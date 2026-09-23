# Contributing to OpenMsg

Thank you for your interest in contributing to OpenMsg! OpenMsg is an open-source, client-side WhatsApp Web CRM and automation workspace.

---

## 1. Development Principles

1. **Zero External Runtime Servers**: OpenMsg runs 100% locally in the browser. Do not add telemetry, remote tracking, license validation, or mandatory cloud dependencies.
2. **Vanilla ES Modules**: Do not add Webpack, Vite, Babel, or complex bundlers. The repository must remain directly loadable as an unpacked extension in Chromium browsers.
3. **No Duplicate Systems**: Before creating a new service, helper, or data store, inspect existing infrastructure in `src/core/` and reuse existing abstractions.
4. **No Destructive Database Changes**: Never change entity structure or collection names without planning non-destructive migration paths.

---

## 2. Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/openmsg.git
   cd openmsg
   ```
3. **Load** the extension in Chrome:
   - Navigate to `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
   - Toggle **Developer mode** in the top-right corner.
   - Click **Load unpacked** and select the repository root directory.

---

## 3. Branching & Commit Guidelines

- **Branch Naming**:
  - `feature/<feature-name>`
  - `fix/<bug-description>`
  - `docs/<doc-topic>`
  - `refactor/<module-name>`
- **Commit Messages**: Follow Conventional Commits format:
  - `feat: add contact quick search in CRM drawer`
  - `fix: resolve settings menu about dialog crash`
  - `docs: update storage migration guide`
  - `refactor: clean up variable names in scheduler.js`

---

## 4. Code Style & Architecture Guardrails

- **Syntax**: Modern ES2022+ JavaScript modules (`import` / `export`).
- **Indentation**: 2 spaces, UTF-8, LF line endings.
- **DOM Creation**: Always use `h(...)` and `svgEl(...)` from `src/ui/dom.js`. Never use `innerHTML`, `outerHTML`, or `eval()`.
- **CSS Isolation**: All user interface elements must mount within the Shadow DOM root in `#wacrm-host` and use variables defined in `src/styles/wacrm.css`.
- **Naming**: Use descriptive camelCase for variables/functions, PascalCase for classes/components, and UPPER_SNAKE_CASE for constants. Avoid minified variable names.

---

## 5. Verification Before Submitting PR

Before opening a pull request, run the following verification:

```bash
# 1. Verify syntax of all JavaScript files:
for f in $(find src pages -name "*.js"); do node --check "$f" || echo "Error in $f"; done

# 2. Run existing test suite:
npm test
```

### Pull Request Expectations:
- One focused feature or bug fix per pull request.
- Document any schema modifications or new permissions.
- Test against the latest stable release of WhatsApp Web.
- Never include personal API keys, credentials, or session tokens in commits.

---

## 6. License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
