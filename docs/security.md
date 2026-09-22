# OpenMsg Security Architecture & Policies

## 1. Threat Model & Security Perimeter

OpenMsg executes inside the browser as a Chrome Extension with access to WhatsApp Web tabs and user contacts. Its threat model accounts for:
- Malicious incoming messages attempting Cross-Site Scripting (XSS).
- Untrusted webhook or HTTP responses attempting Server-Side Request Forgery (SSRF) or Denial of Service.
- Workflow configuration injection attacks (ReDoS or arbitrary code execution).
- Data leakage of user conversations to unauthorized third parties.

---

## 2. Core Security Controls

### A. Strict Prohibition of Dynamic Code Execution
- **No `eval()` or `new Function()`**: Completely banned across the codebase.
- Condition branching in the workflow engine is strictly limited to an immutable dictionary of deterministic operators (`equals`, `contains`, `greater_than`, etc.).
- Template variable interpolation uses safe lexical replacement and text nodes to prevent script execution.

### B. SSRF Protection on Webhook & HTTP Nodes
When users configure Webhook or API Request workflow nodes, the background request proxy enforces:
- **Private IP Blocking**: Requests to `localhost`, `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (cloud metadata endpoints), and IPv6 loopbacks are rejected by default unless explicit developer override is active.
- **Protocol Restriction**: Only `http:` and `https:` schemes are permitted. Schemes such as `file:`, `javascript:`, and `chrome-extension:` are blocked.
- **Response Size Limiting**: HTTP responses are capped at 5MB to prevent memory exhaustion in the service worker.
- **Timeout Caps**: Hard timeout of 15 seconds per request.

### C. XSS Prevention & DOM Sanitization
- All user-supplied contact names, message bodies, and chat inputs are rendered through React's native JSX escaping mechanisms.
- Direct `innerHTML` assignments are prohibited unless sanitized through DOMPurify with strict HTML tag whitelists.
- Content scripts use CSS styling scoped to a Shadow DOM or namespaced utility classes to prevent stylesheet pollution.

### D. Principle of Least Privilege in Manifest V3
Only permissions essential to extension features are requested:
- `storage`: Required for local user settings.
- `unlimitedStorage`: Required to store local CRM databases and chat history without hitting quota limits.
- `alarms`: Required for scheduled wake-ups and workflow delay resumption.
- `notifications`: Required for user follow-up alerts and appointment reminders.
- `sidePanel`: Required to render the desktop CRM companion interface.
- Host permissions: Restricted strictly to `https://web.whatsapp.com/*`. External endpoints (LLMs, webhooks) require runtime user authorization via `chrome.permissions.request`.

### E. Cryptography & Secret Handling
- **No hardcoded secrets or API keys**: OpenAI, Anthropic, and Gemini API keys are entered by the user in settings and stored locally in encrypted or isolated extension storage.
- **Webhook Signatures**: Outbound webhooks include an `X-OpenMsg-Signature` HMAC-SHA256 header when a shared secret is configured, allowing receiving endpoints to verify authenticity.
- **No Remote Telemetry**: Zero analytics, telemetry, or remote crash reporting are bundled by default.
