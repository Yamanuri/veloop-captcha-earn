# API Documentation

Base URL: `http://localhost:5000/api` · JSON · Auth: `Authorization: Bearer <JWT>` (except auth routes).
Errors: `{ "success": false, "code": "...", "message": "..." }`.

| Method | Path | Auth | Rate limit (per user/min) |
|---|---|---|---|
| POST | /auth/login, /auth/register | – | 20 / 15 min per IP |
| GET | /captcha/current | ✔ | 60 |
| POST | /captcha/new | ✔ | 20 |
| POST | /captcha/verify | ✔ | 30 |
| POST | /captcha/claim | ✔ | 20 |
| GET | /captcha/history | ✔ | 60 |
| GET | /captcha/config | ✔ | 60 |
| GET | /wallet/gems | ✔ | 60 |
Global cap 300/min/IP. All limits are env-configurable.

## POST /auth/login
Body `{ "email", "password" }` → `200 { success, token, user, balance }`. Errors: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 429.

## GET /captcha/current
Returns the user's active, unexpired challenge or creates one.
```json
{ "success": true, "challenge": { "challengeId": "CAP-9F3A1C0B77D2", "question": "A7K2P9",
  "options": ["AJK29P","A7K2P9","X4M8Q1","A7L9P2"], "expiresAt": "...", "expiresInSeconds": 118,
  "reward": { "currency": "GEMS", "correct": 1, "wrong": 0.5 } } }
```
`reward` is display-only. `correctOption` is never returned.

## POST /captcha/new
Closes the current challenge (unanswered → `DISCARDED`, pending claim → skipped) and returns a fresh one. Gems already credited during verification remain in the wallet. Errors: 429 DAILY_LIMIT_REACHED / RATE_LIMITED.

## POST /captcha/verify
Body: `{ "challengeId": "CAP-…", "selectedOption": "A7K2P9" }` — **only these two fields are read**; `reward`, `isCorrect`, `userId`… are stripped and logged as SUSPICIOUS_REQUEST.
```json
{ "success": true, "challengeId": "CAP-…", "result": "CORRECT", "reward": { "currency": "GEMS", "amount": 1, "status": "PENDING" }, "balanceBefore": 100, "balance": 101, "transactionId": "TXN-…" }
```
`result` is `CORRECT` or `WRONG` (amount 0.5). Verification credits the server-calculated reward to the wallet and creates its ledger transaction exactly once. `balanceBefore`, `balance`, and `transactionId` come from that server operation.
Errors: 400 VALIDATION_ERROR / INVALID_OPTION · 404 INVALID_CHALLENGE (unknown **or someone else's**) · 409 CHALLENGE_ALREADY_COMPLETED · 410 CHALLENGE_EXPIRED · 401 · 429.

## POST /captcha/claim
Body `{ "challengeId" }` → `{ success, claimed: true, reward:{currency,amount}, balance, transactionId }`.
Claim atomically changes `PENDING → CLAIMED` for the authenticated owner; it does not credit again. Errors: 404 INVALID_CHALLENGE · 409 NOT_VERIFIED / REWARD_ALREADY_CLAIMED / CLAIM_SKIPPED · 401 · 429. N parallel calls produce exactly one successful state transition and no duplicate credit.

## GET /captcha/history?page=1&limit=10
`{ success, items:[{challengeId,date,status,result,reward,rewardStatus}], page, limit, total }`. Never contains options or answers. Identity comes from the JWT only.

## GET /captcha/config
`{ success, config:{ currency, correctReward, wrongReward, expirySeconds } }` (display info).

## GET /wallet/gems
`{ success, currency: "GEMS", balance: 101.5 }`

## Example (curl)
```bash
TOKEN=$(curl -s localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@veloop.test","password":"Demo@1234"}' | jq -r .token)
curl -s localhost:5000/api/captcha/current -H "Authorization: Bearer $TOKEN"
```
