# Contributing to OpenMsg

Thank you for your interest in contributing to OpenMsg! We are building a high-quality, transparent, genuine open-source CRM and automation platform for WhatsApp Web.

## 1. Code of Conduct

All contributors are expected to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md). Please maintain a welcoming, respectful, and collaborative environment.

---

## 2. Development Principles

1. **Strict Types**: TypeScript strict mode is enabled. Avoid `any`, `as any`, or loose castings.
2. **Platform Isolation**: Never couple UI, CRM, or Workflow code directly to WhatsApp DOM selectors or internal hooks. Always work through the `WhatsAppClient` interface.
3. **No Dynamic Execution**: Never use `eval()` or `new Function()`.
4. **Clean Code**: Follow single-responsibility principles for modules and repositories. Keep React components focused on rendering and user interaction.

---

## 3. Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Install dependencies and verify everything compiles:
   ```bash
   pnpm install
   pnpm test
   pnpm typecheck
   pnpm lint
   ```
3. Ensure automated tests are added or updated for new business logic.
4. Format code using Prettier:
   ```bash
   pnpm format
   ```
5. Submit your pull request with a clear description of the problem solved and test coverage.
