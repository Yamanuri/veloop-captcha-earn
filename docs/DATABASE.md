# Database (MongoDB / Mongoose)

Connect with `MONGODB_URI` (preferred) or `MONGO_URI`. Default local URI: `mongodb://127.0.0.1:27017/mydatabase`.

Gems are integer **units** (1 Gem = 100 units).

| Collection | Key fields | Indexes |
|---|---|---|
| users | email, passwordHash (select:false), role | unique email |
| wallets | userId, gemUnits (int ≥ 0), currency | unique userId |
| captchachallenges | challengeId, userId, captchaText, options[4], **correctOption (select:false)**, status ACTIVE/COMPLETED/EXPIRED/DISCARDED, expiresAt, selectedOption, result, **rewardUnits** (virtual `rewardAmount` in Gems), rewardStatus NONE/PENDING/CLAIMED/DISCARDED, createdAt, completedAt, claimedAt | unique challengeId · {userId, createdAt} · **unique {userId} where status=ACTIVE** |
| captchaattempts | attemptId, challengeId, userId, selectedOption, result, rewardUnits, ip, userAgent, status | **unique challengeId** (one attempt per challenge) · userId |
| gemtransactions | transactionId, userId, amountUnits (virtuals `amount`, `balanceBefore`, `balanceAfter` in Gems), type, source, referenceId, balanceBefore/AfterUnits, status | **unique {referenceId, type}** · userId |
| captcharewardconfigs | key='default', correctReward 1, wrongReward 0.5, currency, expirySeconds, active | unique key |
| auditlogs | event, userId, challengeId, ip, userAgent, meta | event · {userId, createdAt} |

Audit events: CHALLENGE_CREATED, CHALLENGE_VERIFIED, REWARD_CREATED, REWARD_CLAIMED, DUPLICATE_ATTEMPT, INVALID_ATTEMPT, CHALLENGE_EXPIRED, SUSPICIOUS_REQUEST.

Challenge lifecycle: `ACTIVE → COMPLETED` (verify) · `ACTIVE → EXPIRED` (timeout) · `ACTIVE → DISCARDED` (new code). Successful verification credits the wallet and writes one `CAPTCHA_REWARD` ledger row; `rewardStatus` tracks the separate claim/demo-ad transition `NONE → PENDING → CLAIMED` (or `DISCARDED` when skipped). Skipping the claim does not reverse credited Gems.
The evaluator can open MongoDB and see challenge → attempt → ledger → wallet for every reward.
