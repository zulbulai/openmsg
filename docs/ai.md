# OpenMsg AI Assistant

## Overview

OpenMsg features a local-first, optional AI Assistant gateway. It is designed to assist customer service agents and sales representatives by drafting replies, adjusting message tone, summarizing conversation threads, and translating customer inquiries.

---

## Architecture

```text
User Action (Composer Strap or AI Modal)
                  │
                  ▼
         [AIAssistant Client]
                  │
                  ├── Load Saved Config (chrome.storage.local)
                  │
         ┌────────┴────────┬──────────────┬─────────────┐
         ▼                 ▼              ▼             ▼
   OpenAI Client     Google Gemini    Anthropic Claude  Custom Ollama / vLLM
   (gpt-4o-mini)   (gemini-1.5-flash) (claude-3-haiku) (BaseURL: /v1)
                  │
                  ▼
   Generated Text Applied into Composer Draft (No Automatic Sending)
```

---

## Core Principles

1. **Zero External Lock-In**: OpenMsg works 100% without an AI provider configured. All CRM, workflow, scheduling, and broadcast features operate completely offline.
2. **Bring-Your-Own-Key (BYOK)**: Users supply their own API keys stored securely in `chrome.storage.local`. OpenMsg does not route AI traffic through any intermediary proxy or proprietary server.
3. **No Autonomous Message Sending**: AI outputs are strictly suggested drafts inserted into the message composer. A human agent must explicitly click send (or a workflow rule must explicitly specify auto-reply).

---

## Capabilities

- **Smart Reply Suggestions**: Context-aware replies generated using the last 4 messages of conversation history.
- **Tone Rewriter**:
  - *Friendly*: Warm, conversational, polite.
  - *Professional*: Formal, succinct business tone.
  - *Concise*: Short, to-the-point WhatsApp style.
- **Conversation Summarizer**: Extracts key issues, order numbers, and follow-up items from chat logs.
- **Translator**: Accurately translates incoming or outgoing messages between languages (Hindi, Spanish, French, German, Arabic, English).
