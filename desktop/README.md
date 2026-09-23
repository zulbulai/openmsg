# OpenMsg Desktop — WhatsApp Marketing & Automation Suite

Advanced, cross-platform (Windows, macOS, Linux) WhatsApp marketing, CRM, and automation desktop application built with **Electron**, **Isolated Multi-Session WebContents**, and the battle-tested **`@wppconnect/wa-js`** reverse-engineered WhatsApp Web core.

---

## 🚀 Key Features (Beyond LeadWave)

1. **True Cross-Platform Support**:
   - Unlike Windows-only .NET/C# tools (e.g. LeadWave, WaSender), OpenMsg Desktop runs natively on:
     - **Windows** (7/8/10/11 x64 and x86, NSIS installer + Portable .exe)
     - **macOS** (Apple Silicon M1/M2/M3 & Intel x64, .dmg + .zip)
     - **Linux** (Ubuntu, Debian, Fedora, Arch, .AppImage + .deb)

2. **Multi-Account WhatsApp Isolation**:
   - Run multiple WhatsApp accounts simultaneously using Electron's `session.fromPartition('persist:wa_profile_id')`.
   - Separate cookies, localStorage, IndexedDB, and active socket connections per profile.

3. **Anti-Ban Smart Bulk Messaging Engine**:
   - **Spintax Support**: Dynamic variation syntax `{Hello|Hi|Greetings} {{Name}}`.
   - **Dynamic Variables**: Personalize messages with `{{Name}}`, `{{Company}}`, `{{Phone}}`, etc.
   - **Humanized Random Delays**: Configurable random delay between messages (e.g., 5s to 15s).
   - **Batch Sleeping**: Automatically pause for N seconds after sending every 25 messages to avoid WhatsApp spam detection.
   - **Typing Emulation**: Sends `markIsComposing` typing signals prior to dispatching each message.
   - **Controls**: Real-time Pause, Resume, and Abort controls with live activity stream.

4. **Group & Community Contact Extractor**:
   - 1-Click scrape of all joined groups.
   - Extracts participant numbers, names, and identifies Group Admins.
   - Export extracted contacts directly to CSV, or load them straight into a Bulk Campaign.

5. **WhatsApp Number Filter / Validator**:
   - Bulk verify phone numbers against WhatsApp without sending messages.
   - Distinguishes registered WhatsApp users from inactive/landline numbers.
   - Real-time classification counters and 1-click export of active leads.

6. **AI Assistant & Keyword Autoresponder**:
   - **Keyword Rules**: Exact match, Contains, Starts With, and regular expressions.
   - **AI Fallback**: Automatically query **Google Gemini (1.5 Flash)** or **OpenAI (GPT-4o)** for natural contextual responses.
   - **Interactive Sandbox**: Test prompts directly in the dashboard before going live.

7. **Hardware ID (HWID) Licensing System**:
   - Cryptographically locks licenses to customer machine hardware (CPU, MAC, OS UUID).
   - Supports Lifetime licenses or time-based subscriptions.
   - Includes Admin CLI script to generate and verify license keys.

---

## 📦 Directory Structure

```
desktop/
├── package.json               # Dependencies & cross-platform build scripts
├── electron-builder.json      # Packaging targets for Windows, Mac, Linux
├── scripts/
│   └── generate-license.js    # Admin CLI to generate customer license keys
├── test/
│   └── desktop-core.test.js   # Automated unit tests for Spintax, Queue, HWID, AI
├── src/
│   ├── main/
│   │   ├── index.js           # Electron main process entry point
│   │   ├── window-manager.js  # Main UI BrowserWindow manager
│   │   ├── session-manager.js # Isolated multi-account WhatsApp sessions
│   │   ├── ipc-handlers.js    # IPC bridge between UI, sessions & engine
│   │   ├── database.js        # Atomic local JSON storage
│   │   └── ai-engine.js       # Autoresponder & OpenAI / Gemini integration
│   ├── preload/
│   │   ├── preload-ui.js      # Secure contextBridge for Dashboard UI
│   │   └── preload-wa.js      # Injects WPPConnect into WhatsApp Web
│   ├── renderer/
│   │   ├── index.html         # Modern dark dashboard layout
│   │   ├── css/
│   │   │   └── app.css        # Cyber-dark glassmorphism design system
│   │   └── js/
│   │       ├── app.js         # Header, tab router, toast notifications
│   │       ├── accounts.js    # Account manager & QR code modal
│   │       ├── campaigns.js   # Bulk campaign wizard & live monitor
│   │       ├── extractor.js   # Group member scraper & CSV export
│   │       ├── validator.js   # Number filter & WhatsApp validator
│   │       ├── chatbot.js     # Keyword rules & AI fallback settings
│   │       └── settings.js    # HWID license activation & delay presets
│   └── shared/
│       ├── vendor/
│       │   └── wppconnect-wa.js # Battle-tested WhatsApp Web API core
│       └── utils/
│           ├── spintax.js       # Spintax & variable parser
│           ├── sender-queue.js  # Anti-ban queue with humanized intervals
│           └── hwid.js          # Machine fingerprint & license verification
```

---

## 🛠️ Getting Started & Development

### 1. Install Dependencies
```bash
cd desktop
npm install
```

### 2. Run in Development
```bash
npm start
```

### 3. Run Automated Tests
```bash
node --test test/desktop-core.test.js
```

---

## 🔑 Generating Customer License Keys

As the administrator/reseller, you can generate customer license keys using the CLI:

```bash
# Syntax:
node scripts/generate-license.js <CUSTOMER_HWID> [CustomerName] [Plan] [DaysValid]

# Example 1: Generate Lifetime Enterprise License
node scripts/generate-license.js 1387-B2DF-1445-43BE "Client Name" PRO_LIFETIME 0

# Example 2: Generate 1-Year Subscription
node scripts/generate-license.js 1387-B2DF-1445-43BE "Marketing Agency" PRO_YEARLY 365
```

---

## 🚀 Automated GitHub Actions Build & Release

You can build and release Windows, macOS, and Linux installers automatically using GitHub Actions:

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat(desktop): open-source whatsapp marketing suite"
   git push origin main
   ```

2. Tag a new release version:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. GitHub Actions will automatically:
   - Run core unit tests on Ubuntu runner.
   - Matrix-build native binaries on `windows-latest`, `macos-latest`, and `ubuntu-latest`.
   - Publish a GitHub Release attaching all `.exe`, `.dmg`, `.AppImage`, and `.deb` packages!

---

## 🏗️ Local Packaging for Distribution (Windows, Mac, Linux)

You can also build native standalone installers locally using `electron-builder`:

```bash
# Build for all targets:
npm run dist

# Build Windows (.exe NSIS installer and portable):
npm run dist:win

# Build macOS (.dmg and .zip):
npm run dist:mac

# Build Linux (.AppImage and .deb):
npm run dist:linux
```
The packaged binaries will be output to `desktop/dist/`.
