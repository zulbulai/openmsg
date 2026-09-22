# OpenMsg Broadcast Campaigns

## Overview

The Broadcast system enables personalized bulk messaging to segmented customer groups on WhatsApp Web. It strictly complies with anti-ban safeguards, user consent requirements, and platform policies. OpenMsg does NOT support spam-evasion or bulk blasting techniques.

---

## Campaign Lifecycle

```text
1. DRAFT ──(Configure Audience & Template)──> 2. SCHEDULED / RUNNING
                                                      │
         ┌────────────────────────────────────────────┴─────────────────┐
         ▼                                                              ▼
    [Sequential Queue Worker]                                    [Pause / Cancel]
    ├── SafeTemplate Variable Rendering                                 │
    ├── Anti-Ban Jitter (3s–8s randomized sleep)                        ▼
    ├── MessageQueue Rate Limiter Check                          Status: PAUSED
    └── Status Tracking (Queued ➔ Sent ➔ Delivered / Failed)            or
                                                                Status: CANCELLED
         │
         ▼
3. COMPLETED (Audit report & metrics summary)
```

---

## Audience Segmentation

Recipients can be filtered by:
- **CRM Stage**: `lead`, `contacted`, `qualified`, `customer`, `churned`, or `all`.
- **CRM Tags**: Contacts tagged with specific labels (e.g. `Hot Lead`, `VIP`).
- **Custom Filters**: Attribute matching against custom profile fields.

---

## Safeguards & Ethical Messaging Rules

1. **Strict Throttling**: All messages are dispatched sequentially with simulated typing indicators and anti-ban jitter delays (3 to 8 seconds).
2. **Safe Template Engine**: Contact fields (`{{contact.name}}`, `{{contact.company}}`) are substituted securely without `eval()` or code execution.
3. **No Unsolicited Scraping**: OpenMsg only sends to contacts already stored in the local CRM or active WhatsApp chat threads.
