import { useEffect, useState } from 'react';
import { Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import CaptchaOption from './CaptchaOption.jsx';
import RewardCard from './RewardCard.jsx';
import FlowProgress from './FlowProgress.jsx';
import s from './captcha.module.css';

function remainingSeconds(expiresAt) {
  if (!expiresAt) return null;
  return Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000));
}

export default function CaptchaChallenge({ challenge, selected, phase, onSelect, onNewCode }) {
  const locked = phase !== 'ready';
  const [left, setLeft] = useState(() => remainingSeconds(challenge.expiresAt));

  useEffect(() => {
    setLeft(remainingSeconds(challenge.expiresAt));
    const t = setInterval(() => setLeft(remainingSeconds(challenge.expiresAt)), 1000);
    return () => clearInterval(t);
  }, [challenge.challengeId, challenge.expiresAt]);

  return (
    <section className={s.stack} aria-label="CAPTCHA challenge">
      <FlowProgress current={phase === 'scanning' ? 2 : 1} />
      <div className={s.titleBlock}>
        <h1 className={s.title}>Earn <span className={s.gold}>Gems</span></h1>
        <p className={s.subtitle}>Complete a quick security check to earn rewards.</p>
      </div>

      <div className={s.codeBox}>
        <div className={s.codeHead}>
          <span className={s.codeLabel}>CAPTCHA CODE</span>
          <span className={s.challengeStatus}><i />{challenge.status || 'ACTIVE'}</span>
        </div>
        <div className={s.code} aria-label={`Code ${challenge.question.split('').join(' ')}`} key={challenge.challengeId}>
          {challenge.question.split('').map((ch, i) => (
            <span key={i} style={{ '--i': i }} className={s.codeChar}>{ch}</span>
          ))}
        </div>
        {left != null && (
          <>
            <p className={`${s.expiry} ${s.earnExpiry} ${left <= 15 ? s.expiryWarn : ''}`}>
              <Clock3 size={14} />
              {left === 0 ? 'This code expired' : `Expires in ${left}s`}
            </p>
            <div className={s.expiryTrack} aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(100, (left / Math.max(1, challenge.expiresInSeconds || 120)) * 100))}%` }} />
            </div>
          </>
        )}
        <button type="button" className={s.newCode} onClick={onNewCode} disabled={locked && left !== 0}>
          <RefreshCw size={14} /> New Code
        </button>
      </div>

      <p className={s.prompt}>Select the matching code</p>
      <div className={s.grid} role="group" aria-label="Answer options">
        {challenge.options.map((opt, i) => (
          <CaptchaOption
            key={challenge.challengeId + opt}
            value={opt}
            index={i}
            selected={selected === opt}
            locked={locked || left === 0}
            scanning={phase === 'scanning'}
            onSelect={onSelect}
          />
        ))}
      </div>

      <RewardCard reward={challenge.reward} />
      <div className={s.note}>
        <ShieldCheck size={16} />
        <span>This helps protect your account from automated access.</span>
      </div>
    </section>
  );
}
