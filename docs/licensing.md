# OpenMsg Open-Source Licensing Evaluation

## 1. Context & Objectives

OpenMsg is an open-source project delivering CRM, automation, chatbot, and workflow capabilities directly inside WhatsApp Web. As an open-source project, the license must:
1. Guarantee freedom and transparency for all developers and business users.
2. Prevent proprietary closed-source forks that strip attribution or privatize community contributions.
3. Account for future architectural expansions (e.g., optional self-hosted relay servers or hosted team sync servers).

---

## 2. License Evaluation

### Option A: MIT License
- **Pros**: Maximum adoption, minimal friction, highly permissive, straightforward wording.
- **Cons**: Allows commercial entities to fork the repository, bundle proprietary closed-source features, sell the software without contributing changes back, or create proprietary commercial extensions without releasing source code.

### Option B: Apache License 2.0
- **Pros**: Clear patent grant and protection clauses, explicit contribution terms, trademark protection.
- **Cons**: Weak protection against SaaS/hosted exploitation. If cloud backends or hosted sync components are introduced later, third parties can run modified versions as a service without disclosing their improvements.

### Option C: GNU Affero General Public License v3.0 (AGPL-3.0)
- **Pros**:
  - **Copyleft Preservation**: Ensures that all derivative works, extensions, and modifications remain open source under the same license terms.
  - **Network / Cloud Protection**: Specifically covers software operated over a computer network (Section 13). If third parties host OpenMsg or its workflow engine as a remote service, they must provide the complete corresponding source code to network users.
  - **Community Alignment**: Protects open-source contributors from having their unpaid work monetized inside proprietary closed-source wrappers.
- **Cons**: More restrictive for closed enterprise integration; requires organizations embedding the code in proprietary systems to open-source their derivative wrappers.

---

## 3. Recommendation & Decision

**OpenMsg adopts the GNU Affero General Public License v3.0 (AGPL-3.0)**.

### Rationale:
1. **Long-Term Open-Source Safeguard**: The CRM and WhatsApp automation ecosystem has suffered from commercial actors taking open-source tools, rebranding them, applying restrictive node-locked license servers (as observed in commercial tools like the reference project), and closing the source.
2. **Copyleft Protection for Future Server-Side Components**: As OpenMsg adds optional self-hosted team synchronization, webhooks gateways, and cloud workflow runners, AGPL-3.0 ensures that anyone deploying these network services must contribute improvements back to the community.
3. **Genuine Open Source**: AGPL-3.0 guarantees that OpenMsg remains free, open, and community-owned forever.
