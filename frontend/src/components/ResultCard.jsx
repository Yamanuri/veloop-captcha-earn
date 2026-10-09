import { Check, X, ShieldCheck, ArrowRight } from 'lucide-react';
import GemIcon from './GemIcon.jsx';
import ClaimButton from './ClaimButton.jsx';
import FlowProgress from './FlowProgress.jsx';
import { fmtGems, fmtReward, gemWord } from '../utils/format.js';
import s from './captcha.module.css';

const PARTICLES = Array.from({ length: 14 }, (_, i) => i);

export default function ResultCard({ outcome, balance, claiming, onClaim, onNoThanks }) {
  const ok = outcome.result === 'CORRECT';
  const amount = outcome.reward.amount; // from the API
  const previousBalance = outcome.balanceBefore ?? balance;
  const currentBalance = outcome.balance ?? balance;
  return (
    <section className={s.stack} aria-live="polite">
      <FlowProgress current={3} result={outcome.result} />
      <div className={`${s.resultIcon} ${ok ? s.resultOk : s.resultBad}`}>
        {PARTICLES.map((p) => (
          <i key={p} className={s.particle} style={{ '--a': `${(p / PARTICLES.length) * 360}deg`, '--d': `${p % 3}` }} />
        ))}
        <span className={s.resultCircle}>{ok ? <Check size={44} strokeWidth={3} /> : <X size={44} strokeWidth={3} />}</span>
      </div>

      <div className={s.titleBlock}>
        <span className={`${s.resultBadge} ${ok ? s.resultBadgeOk : s.resultBadgeBad}`}>{ok ? 'CORRECT ANSWER' : 'INCORRECT ANSWER'}</span>
        <h2 className={`${s.h2} ${ok ? s.okText : s.badText}`}>{ok ? 'Verification Complete!' : 'Verification Unsuccessful'}</h2>
        <p className={s.subtitle}>
          {ok ? 'CAPTCHA verified successfully.' : "The selected code doesn't match."}
        </p>
      </div>

      <div className={s.earned}>
        <span>You earned</span>
        <strong className={s.earnedAmount}><GemIcon size={26} /> {fmtReward(amount)} {gemWord(amount)}</strong>
      </div>

      <div className={s.balances}>
        <div><small>Previous Balance</small><b>{fmtGems(previousBalance)}</b></div>
        <ArrowRight size={18} className={s.arrow} />
        <div><small>New Balance</small><b className={s.okText}>{fmtGems(currentBalance)}</b></div>
      </div>

      <ClaimButton onClick={onClaim} disabled={claiming} tone={ok ? 'green' : 'gold'}>
        {claiming ? 'Claiming…' : `Claim ${fmtReward(amount)} ${gemWord(amount)}`}
      </ClaimButton>
      <button type="button" className={s.ghost} onClick={onNoThanks} disabled={claiming}>No Thanks</button>

      <div className={s.note}>
        <ShieldCheck size={16} />
        <span>Gems are credited after verification. Claim continues to the demo reward.</span>
      </div>
    </section>
  );
}
