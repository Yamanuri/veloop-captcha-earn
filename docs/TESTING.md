# Testing

## Automated (backend/tests/security.test.js)
Run against a running API + seeded DB: `npm start` then `npm test`.
Covers: unauthorized (401), 4 unique options & no `correctOption`, correct (+1) and wrong (+0.5) credited on verify, duplicate claim, duplicate verify, **fake `reward`**, **fake `isCorrect`**, combined fake `reward`/`isCorrect`/`userId`, **concurrent verify (8×) → 1 credit**, **concurrent claim (8×) → 1 state transition with no extra credit**, cross-user 404, invalid/missing/not-offered option, expired challenge (DB-shifted expiry), No Thanks invalidation, history leak check, Mongo persistence, rate limit (429).

## Postman
`postman/VELoop-Captcha.postman_collection.json`: Login → Get CAPTCHA → Verify Correct → Claim → New → Verify Wrong → Claim → Wallet → History, plus negative tests (duplicate verify/claim, wrong user, missing/invalid option, fake reward/isCorrect/userId, invalid challenge, unauthorized). Use the collection runner; variables are set by test scripts.

## Manual UI verification

The following browser checks were exercised against the local React app and API:

| Scenario | Verified result |
|---|---|
| Login | Demo account reaches the protected CAPTCHA Earn page. |
| Challenge and options | API supplies one challenge and exactly four answer options; the correct answer is not returned as a separate field. |
| Correct answer | Backend returns the result and reward, then the wallet refresh shows the credited balance. |
| Claim | Claim transitions once; the mock ad completes and a different challenge is loaded. |
| Wrong answer | Backend determines the wrong-answer reward and activates the Try Again stage. |
| No Thanks | The pending claim state is closed and a different challenge is loaded; the earned Gems remain credited. |
| Responsive layout | 390 px mobile: one card per row; 768 px tablet: three cards per row; 1440 px desktop: five cards per row. No horizontal overflow was observed. |
| Production build | `npm run build` succeeds. |
| Backend regression suite | `npm test`: 17 passed, 0 failed. |

Screenshots are intentionally not embedded in this source document. For a submission that requires image evidence, capture the running app at the three viewport widths above and attach screenshots for the ready, correct-result, and wrong-result states; do not use a static screenshot as the page implementation.

## Deployment smoke test

Before submission, deploy the API and frontend and record their public URLs. Confirm the API `/health` endpoint, registration/login, one correct and one wrong attempt, claim and No Thanks transitions, and wallet persistence against the deployed database. Production API startup requires `NODE_ENV=production`, `USE_TRANSACTIONS=true`, a MongoDB replica set, a unique secret, and the deployed frontend origin in `CORS_ORIGINS`.
