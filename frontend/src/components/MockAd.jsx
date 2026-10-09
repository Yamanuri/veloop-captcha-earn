import { useEffect, useState } from 'react';
import { CheckCircle2, Clapperboard } from 'lucide-react';
import { fmtGems, fmtReward, gemWord } from '../utils/format.js';
import ProgressIndicator from './ProgressIndicator.jsx';
import FlowProgress from './FlowProgress.jsx';
import s from './captcha.module.css';

// DEVELOPMENT / DEMO ONLY. No ad network. Reward was already credited once by POST /verify.
export default function MockAd({ claimed, onDone }) {
  const [step, setStep] = useState('prepare'); // prepare -> ad -> done
  const [left, setLeft] = useState(3);

  useEffect(() => {
    const t = setTimeout(() => setStep('ad'), 1100);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (step !== 'ad') return undefined;
    if (left === 0) {
      setStep('done');
      return undefined;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [step, left]);
  useEffect(() => {
    if (step !== 'done') return undefined;
    const t = setTimeout(onDone, 1300);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <section className={s.stack} aria-live="polite">
      <FlowProgress current={3} />
      {step === 'prepare' && (
        <>
          <div className={s.lockWrap}><span className={`${s.ring} ${s.ring1}`} /><span className={s.lockCore}><Clapperboard size={34} /></span></div>
          <h2 className={s.h2}>Preparing reward...</h2>
          <ProgressIndicator />
        </>
      )}
      {step === 'ad' && (
        <>
          <div className={s.adBox}>
            <span className={s.adBadge}>Demo rewarded ad · development only</span>
            <p>Your sponsor's message would appear here.</p>
            <strong>{left}</strong>
          </div>
          <div className={s.titleBlock}>
            <p className={s.subtitle}>Reward unlocks in {left}s</p>
          </div>
        </>
      )}
      {step === 'done' && (
        <>
          <div className={`${s.resultIcon} ${s.resultOk}`}><span className={s.resultCircle}><CheckCircle2 size={44} /></span></div>
          <div className={s.titleBlock}>
            <h2 className={`${s.h2} ${s.okText}`}>Reward completed</h2>
            <p className={s.subtitle}>
              {fmtReward(claimed.reward.amount)} {gemWord(claimed.reward.amount)} credited · balance {fmtGems(claimed.balance)}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
