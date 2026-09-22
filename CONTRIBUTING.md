# Contributing to OpenMsg

Thank you for your interest in contributing to OpenMsg!

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/openmsg.git
   cd openmsg
   ```
3. **Load** the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked" and select the `openmsg/` folder

## Making Changes

- Create a new branch for your change:
  ```bash
  git checkout -b feature/my-feature
  ```
- Make your changes in the source files under `src/`.
- Reload the extension in `chrome://extensions` to test (click the refresh icon).
- Test on WhatsApp Web (`https://web.whatsapp.com`).

## Pull Request Guidelines

- One feature or fix per pull request.
- Write a clear description of what the PR does and why.
- Do **not** add license checks, activation gates, or remote telemetry.
- Use ES Modules (`import`/`export`) consistent with the existing codebase.
- Make sure your changes work on the latest version of WhatsApp Web.

## Reporting Bugs

Open an issue at: https://github.com/zulbulai/openmsg/issues

Include:
- Browser name and version
- Steps to reproduce
- Expected vs. actual behavior
- Any console errors from the browser DevTools

## Code Style

- Use 2-space indentation.
- Keep functions small and focused.
- Prefer descriptive variable names over abbreviations.
- Comment non-obvious logic.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
