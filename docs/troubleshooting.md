# OpenMsg Troubleshooting & Diagnostics

## Common Issues & Solutions

### 1. WhatsApp Web Shows "Connecting..." / Status Not Ready

**Symptoms**: The sidepanel top badge stays amber ("Connecting...").

**Cause**:
- WhatsApp Web is still synchronizing messages, QR code is unauthenticated, or the content script bridge hasn't established handshake.

**Resolution**:
1. Ensure `https://web.whatsapp.com` is open in an active browser tab and authenticated.
2. Verify the WhatsApp Web page has finished initial sync (chat list is visible).
3. Open Developer Tools (F12) on the WhatsApp Web tab and check for console logs prefixed with `[OpenMsg-Bridge]`.
4. If WhatsApp updated their DOM structure, navigate to **Settings -> Diagnostics** to inspect bridge status and click **Reconnect**.

---

### 2. Scheduled Messages Delayed or Not Sending

**Symptoms**: A scheduled message's trigger time passes without sending.

**Cause**:
- The browser was closed or the device went to sleep. Chrome Alarms will queue missed alarms and execute them upon browser launch.

**Resolution**:
1. Check **Scheduler -> Status**: If status is still `Pending`, check that WhatsApp Web is connected.
2. In Chrome, verify extension background permissions: `chrome://extensions -> OpenMsg -> Details -> Background Activity`.

---

### 3. Webhook Delivery Fails with "Blocked by SSRF Guard"

**Symptoms**: Outbound webhook logs show: `Blocked delivery to <URL>: Target IP resolves to a private network`.

**Cause**:
- OpenMsg prevents requests to private IP ranges (`192.168.x.x`, `10.x.x.x`, `127.0.0.1`, `localhost`) to prevent Server-Side Request Forgery (SSRF) vulnerabilities.

**Resolution**:
- In production, configure publicly accessible HTTPS webhook URLs (e.g. `https://webhook.yourdomain.com`).
- For local webhook development, use tunneling tools like `ngrok` or `cloudflared` to expose a public HTTPS endpoint.

---

### 4. Exporting Diagnostic Logs

If you encounter unexpected errors, export your redacted diagnostic log:
1. Open **OpenMsg -> Settings**.
2. Scroll to **Runtime Diagnostics**.
3. Click **Export Diagnostics**.
4. The exported JSON includes system versions, storage collection counts, and error logs with all API keys and personal messages automatically redacted.
