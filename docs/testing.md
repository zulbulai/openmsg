# OpenMsg Testing Guide

## Overview

OpenMsg enforces automated testing for all core business logic, workflow execution, rate limiting, security guards, and database repositories.

---

## Test Suites

Tests are executed using **Vitest**:

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Run with code coverage reporting
pnpm test:coverage
```

---

## What is Tested

| Subsystem | Test Location | Scope |
| :--- | :--- | :--- |
| **Workflow Engine** | `tests/workflow/workflow-engine.test.ts` | Linear graphs, branching conditionals, delays, actions, and terminal nodes |
| **Node Registry** | `tests/workflow/node-registry.test.ts` | Node type definitions, validation schemas, input/output contracts |
| **Safe Template** | `tests/core/safe-template.test.ts` | Variable substitution, fallback strings, avoidance of `eval` injection |
| **SSRF Guard** | `tests/security/ssrf.test.ts` | Localhost blocking, private subnet detection, protocol whitelisting |
| **Rate Limiter** | `tests/core/rate-limiter.test.ts` | Anti-ban jitter calculation, hourly throughput caps, priority queues |
| **CRM Repositories** | `tests/crm/contact-repository.test.ts` | Contact creation, tag assignment, custom field persistence |
| **Backup & Restore** | `tests/core/backup-service.test.ts` | JSON database export, schema validation, preview generation |
| **WhatsApp Mock** | `tests/unit/mock-client.test.ts` | Simulated bridge operations, contact retrieval, chat message dispatch |
| **Deduplication** | `tests/core/deduplication.test.ts` | Ring buffer cache, duplicate event suppression, TTL expiration |
| **Chatbot Rules** | `tests/unit/chatbot.test.ts` | Keyword matching (exact, contains, starts_with, regex) |
| **Scheduler** | `tests/unit/scheduler-recurrence.test.ts` | Daily, weekly, and custom recurrence timestamp calculations |
