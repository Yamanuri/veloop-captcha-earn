# VELoop Rewards — CAPTCHA Earn (MERN)

Users solve a CAPTCHA-style challenge (pick the matching code out of 4 options) and earn **Gems**:
**+1 Gem** for a correct answer, **+0.5 Gems** for a wrong one. **The frontend displays; the backend owns the truth.**

```
React (Vite)  ──JWT──►  Express API  ──►  MongoDB (Mongoose)
 display only           generates, verifies, rewards, credits
```

The backend is authoritative for the user identity, challenge status and answer, reward configuration, wallet balance, and transaction ledger. React sends only the challenge ID and selected option during verification; it never calculates or persists Gems.

## What the server controls (never the browser)
CAPTCHA generation & correctness · reward amount · identity (JWT) · Gem balance · challenge validity/expiry/completion ·
claim eligibility · attempt status · ledger transactions.

## Flow
1. `GET /api/captcha/current` → `{challengeId, question, options[4], reward}` (no `correctOption`).
2. User taps an option → options lock → ~0.5 s scanning animation → `POST /api/captcha/verify {challengeId, selectedOption}`.
3. Server: exists? mine? expired? already completed? option offered? → compare → reward from `CaptchaRewardConfig` → complete the challenge once, credit the wallet, and write the ledger and attempt. In production these writes run in one MongoDB transaction. Local standalone development can disable transactions, but does not provide the same crash consistency; reconcile the dev database after an interrupted write.
4. **Claim** → `POST /api/captcha/claim {challengeId}` → atomically `PENDING → CLAIMED`. Claim records the UI/ad state only; it cannot credit Gems again. Gems were credited at verification, so choosing No Thanks cannot revoke an earned reward. Then a clearly-labelled **mock** rewarded-ad screen, then a new CAPTCHA.
5. **No Thanks** → `POST /api/captcha/new`: old challenge and pending claim state are closed, then a fresh challenge is created. Gems already credited by verification remain in the wallet.

**Why credit on verification?** Verification is the earning event and updates the wallet/ledger once. Claim is deliberately a separate, one-time acknowledgement for the demo-ad flow, not a second payment gate. This avoids making earned Gems depend on viewing an ad and prevents claim retries from paying twice.

## Fractional Gems
Balances/ledger are stored as **integer units (1 Gem = 100 units)**, so 0.5 Gem = 50 units. No float arithmetic on money. The API converts to Gems only for display.

## Setup
Requirements: Node ≥ 18.18, MongoDB (local or Atlas).

```bash
# backend
cd backend && cp .env.example .env      # set MONGODB_URI and a long JWT_SECRET
npm install
npm run seed                             # demo users + reward config
npm run dev                              # http://localhost:5000

# frontend (new terminal)
cd frontend && cp .env.example .env
npm install && npm run dev               # http://localhost:5173  (proxies /api → :5000)
```

**Demo login:** `demo@veloop.test` / `Demo@1234` (100 Gems). Second user for isolation tests: `userb@veloop.test` / `UserB@1234`.
Dev-only credentials; never reuse them anywhere real.

### Environment variables
See `backend/.env.example` (server, DB via `MONGODB_URI`, JWT, CORS, transactions flag, expiry, rate limits) and `frontend/.env.example` (`VITE_API_URL`). `MONGO_URI` is accepted as a fallback alias.

The local MongoDB default is `mongodb://127.0.0.1:27017/mydatabase`. Generate a private `JWT_SECRET` for `backend/.env`; never reuse the development secret in production. Local standalone MongoDB may use `USE_TRANSACTIONS=false`. Production startup requires `USE_TRANSACTIONS=true` and a replica set such as MongoDB Atlas, so reward state, wallet, attempt, and ledger writes commit or roll back together. `.env`, `.env.*`, and MongoDB data directories are ignored by Git; only `.env.example` files are intended to be shared. **Git ignore rules do not exclude files from ZIPs**: before sharing an archive, explicitly exclude `backend/.env`, any other `.env*` files except `.env.example`, and `.mongo-data/` / `backend/.mongo-data/`.

## Data and Security
Registration/login use the existing `User` model, bcrypt password hashes, and signed JWTs. Every wallet, challenge, history, and claim query uses the authenticated JWT subject rather than a client-supplied user ID.

Mongoose stores `CaptchaChallenge`, `CaptchaAttempt`, `Wallet`, `GemTransaction`, `CaptchaRewardConfig`, and `AuditLog` records. One Gem is stored as 100 integer units, so half-Gem rewards do not depend on floating-point arithmetic. Successful verification atomically wins the challenge transition, determines the reward from MongoDB-backed configuration, credits the wallet once, and writes the attempt and ledger entry. Claim has its own one-time state transition for the demo ad and never credits the wallet again.

CAPTCHA options, result, reward, balance, and history are returned by the API. `correctOption` is excluded from normal Mongoose queries and safe responses. Request schemas strip untrusted fields; owner isolation, expiry checks, replay protection, unique ledger indexes, Helmet/CORS, and configurable per-user/per-IP rate limits protect the API. Audit records cover challenge creation, verification, rewards, invalid attempts, expiry, duplicates, and suspicious requests.

## API
All endpoints are served under `/api`; all except login and registration require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Create an account or issue a JWT |
| GET | `/captcha/current` | Return the user's active safe challenge or create one |
| POST | `/captcha/new` | Discard the old challenge and create another |
| POST | `/captcha/verify` | Verify a selected offered option and credit its reward once |
| POST | `/captcha/claim` | Mark a verified reward as claimed for the demo-ad flow |
| GET | `/captcha/history` | Return paginated activity for the authenticated user |
| GET | `/captcha/config` | Return display-only reward and expiry configuration |
| GET | `/wallet/gems` | Return the database-backed Gem balance |

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md), [DATABASE.md](docs/DATABASE.md), and [SECURITY.md](docs/SECURITY.md) for schemas, response examples, rate limits, and security details.

### Tests
```bash
cd backend && npm start &        # API running against a seeded DB
npm test                         # replay, duplicate claim, concurrency, fake reward/isCorrect, isolation, expiry, rate limit
```
Also import `postman/VELoop-Captcha.postman_collection.json` (happy path + negative tests).

## Deployment
- **DB:** MongoDB Atlas (free M0 works; set `USE_TRANSACTIONS=true` since Atlas is a replica set).
- **Backend:** Render/Railway. Root `backend`, build `npm install`, start `npm start`. Env: `NODE_ENV=production`, `MONGODB_URI`, a unique random `JWT_SECRET`, `CORS_ORIGINS=<frontend url>`, `USE_TRANSACTIONS=true`. Startup fails if production transactions are disabled. Run `npm run seed` only against a disposable development DB; do not run the demo seed against a production user database.
- **Frontend:** Vercel/Netlify. Root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=<backend url>`. Add an SPA rewrite (`/* → /index.html`).

Source repository: [github.com/Yamanuri/veloop-captcha-earn](https://github.com/Yamanuri/veloop-captcha-earn). A hosted deployment URL and demo video are not yet available; add those links after publishing them. Do not put credentials or `.env` files in the repository.

## Docs
`docs/API_DOCUMENTATION.md` · `docs/DATABASE.md` · `docs/SECURITY.md` · `docs/TESTING.md` · `docs/SCALING.md` (100k attempts/day answer)

## Layout
```
backend/  src/{config,controllers,middleware,models,routes,services,validators,utils} seed/ tests/
frontend/ src/{components,pages,services,hooks,context,utils,styles}
docs/  postman/
```
Reconciliation: `npm run reconcile` reports completed rewards missing ledger rows and wallet/ledger drift. `npm run reconcile -- --fix` repairs missing reward entries from the existing ledger total, then syncs wallet balances to the ledger; the ledger is the accounting source of truth, avoiding a second credit when a wallet was updated before an earlier write failed.
