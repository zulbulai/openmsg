# OpenMsg Webhook System

## Overview

The OpenMsg Webhook engine allows external services (CRMs, ERPs, Zapier, Slack, or internal server backends) to receive real-time HTTP event notifications from WhatsApp Web actions.

---

## Outbound Webhook Architecture

```text
Event Triggered (e.g. MESSAGE_RECEIVED, CONTACT_CREATED)
                    │
                    ▼
     [WebhookDispatcher.dispatch(eventType, data)]
                    │
                    ▼
          SSRF Validation Guard
       (Blocks private IPv4, IPv6, localhost, cloud metadata)
                    │
         ┌──────────┴──────────┐
         │ (Passed)            │ (SSRF Detected)
         ▼                     ▼
  Sign Payload (HMAC-SHA256) [Block & Log Warning]
  Header: X-OpenMsg-Signature
                    │
                    ▼
   HTTP POST to Registered Endpoint URL
```

---

## Security & Verification

### 1. SSRF Protection
The built-in `SSRFGuard` validates all webhook target URLs:
- Disallows non-HTTP/HTTPS schemes (e.g. `file:`, `gopher:`, `ftp:`).
- Disallows localhost (`127.0.0.1`, `localhost`, `::1`).
- Disallows private subnet IP ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- Disallows cloud instance metadata endpoints (`169.254.169.254`).

### 2. HMAC-SHA256 Signature Verification
When an endpoint defines an optional secret key, OpenMsg computes a cryptographic signature:

```text
Header: X-OpenMsg-Signature: sha256=<hex_digest>
```

To verify the signature on your receiving server (Node.js example):

```javascript
const crypto = require('crypto');

function verifyWebhook(payloadRaw, signatureHeader, secret) {
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payloadRaw)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSig)
  );
}
```

---

## Supported Event Types

| Event | Trigger Description |
| :--- | :--- |
| `MESSAGE_RECEIVED` | Inbound message received from customer |
| `MESSAGE_SENT` | Outbound message sent by agent or automation |
| `CONTACT_CREATED` | New contact discovered or saved in CRM |
| `TAG_ADDED` | Tag assigned to contact |
| `WORKFLOW_COMPLETED` | Visual workflow execution reached an `END` node |
| `CAMPAIGN_FINISHED` | Broadcast campaign finished sending |
