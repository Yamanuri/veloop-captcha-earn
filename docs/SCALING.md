# Final challenge: 100,000 CAPTCHA attempts per day

100k/day ≈ 1.2 req/s average (peaks maybe 20–50 req/s) — one small Node instance and MongoDB can handle it; the hard part is **correctness under concurrency and abuse**, not raw throughput.

**MongoDB indexes** — already unique where correctness needs it (`challengeId`, attempts.challengeId, ledger `{referenceId,type}`, one-active-per-user partial index); query indexes `{userId, createdAt}`. Add a TTL index (partial on `status ∈ ACTIVE/EXPIRED/DISCARDED`) to purge dead challenges; archive old history to cold storage.

**Atomic updates** — state changes are single `findOneAndUpdate` compare-and-set calls (`ACTIVE→COMPLETED` gates verification credit, `PENDING→CLAIMED` gates the demo claim); wallet uses `$inc`. Never read-modify-write balances.

**Transactions** — claim (challenge CAS + wallet `$inc` + ledger insert) in one multi-document transaction on a replica set; `reconcile` job as safety net.

**Idempotency** — unique ledger key per challenge; clients may also send an `Idempotency-Key` header stored with a short TTL for network-retry safety.

**Rate limiting** — move counters to **Redis** (`rate-limit-redis`) so limits hold across API instances; layered per-user, per-IP, per-device fingerprint; stricter limits on `/new` (challenge generation).

**Challenge expiry** — short TTL (60–120 s). Optionally keep *active* challenges in Redis with `EXPIRE` and write to Mongo only on completion, cutting DB writes ~50%.

**Queues** — after verification credit commits, push non-critical work (audit fan-out, analytics, notifications, fraud scoring) to BullMQ/SQS; never queue the credit itself unless the ledger row is written first (outbox pattern).

**Monitoring** — metrics: verify/claim latency, 4xx by code (`CHALLENGE_ALREADY_COMPLETED`, `RATE_LIMITED`), Gems minted per hour vs. baseline, wallet-vs-ledger drift (must be 0), Mongo replication lag; alerts on anomalies. Structured logs with request IDs (Pino) to Datadog/Grafana.

**Fraud / risk signals** — accuracy far above/below human norms, sub-300 ms solve time, many accounts per IP/device, datacenter ASNs, repeated `SUSPICIOUS_REQUEST` audit events → step-up (harder CAPTCHA), cooldown, or hold rewards for review.

**Database scaling** — vertical first; replica set for HA; read-heavy endpoints (history, config) on secondaries; shard `captchachallenges`/`gemtransactions` by hashed `userId` if volume grows 100×.

**API scaling** — stateless Express behind a load balancer, horizontal autoscaling, JWT so no sticky sessions, cache reward config in memory (30 s).

**Reward reconciliation** — nightly job: wallet balance == Σ ledger per user; every completed rewarded challenge has exactly one ledger row; discrepancies page on-call. (`npm run reconcile` is the starter implementation.)
