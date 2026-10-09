# Security

We do **not** claim the system is fraud-proof; these are the controls in place.

| Threat | Mitigation |
|---|---|
| Frontend reward manipulation | Reward amounts live in `CaptchaRewardConfig`; `verify` reads only `challengeId` + `selectedOption` (zod strips other keys; extras are audit-logged). The UI only renders values returned by the API. |
| Correct-answer exposure | `correctOption` is `select:false` in Mongoose and never serialised; history omits options. **Note:** this task's format shows the code and asks the user to match it, so the code text itself is visible by design. Real bot resistance comes from server-authoritative scoring, single-use challenges, expiry and rate limits; for production, render the code as a distorted image/SVG instead of text. |
| Replay | Atomic compare-and-set `ACTIVE→COMPLETED` (filter includes status & expiry); unique index on attempts.challengeId. 2nd submit → 409. |
| Duplicate rewards / replay | CAS `ACTIVE→COMPLETED` gates verify credit; unique ledger index `{referenceId,type}`; optional multi-document transaction. Claim has a separate CAS `PENDING→CLAIMED` and never credits again. |
| Challenge theft / cross-user | Every query filters by `userId` from the JWT. Foreign IDs get the same 404 as unknown IDs (no probing) and are audit-logged. |
| Impersonation | JWT (HS256, pinned algorithm, expiry), bcrypt passwords, generic login errors + dummy hash compare. Identity never read from body/query. |
| API abuse | Per-user + per-IP rate limits, 10 kB body limit, daily challenge cap, strict zod validation, Helmet, CORS allow-list. |
| Race conditions | Single atomic updates as gates; one-active-challenge-per-user partial unique index; wallet `$inc` (never read-modify-write). |
| Stale rewards | Challenges expire (default 120 s, configurable); expired verify → 410, no reward. |
| Secrets | `.env` git-ignored; `.env.example` has placeholders (`MONGODB_URI`); server refuses to start without `JWT_SECRET`. |

Known limits / next steps: token in `localStorage` (XSS risk → move to httpOnly cookie + CSRF), no CAPTCHA image distortion, no device/IP risk scoring (see SCALING.md).
