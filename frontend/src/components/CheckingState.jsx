import { Lock, ShieldCheck } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator.jsx';
import FlowProgress from './FlowProgress.jsx';
import s from './captcha.module.css';

export default function CheckingState() {
  return (
    <section className={s.stack} aria-live="polite" role="status">
      <FlowProgress current={2} />
      <div className={s.lockWrap}>
        <span className={`${s.ring} ${s.ring1}`} />
        <span className={`${s.ring} ${s.ring2}`} />
        <span className={`${s.ring} ${s.ring3}`} />
        <span className={s.lockCore}><Lock size={38} strokeWidth={2.2} /></span>
      </div>
      <div className={s.titleBlock}>
        <h2 className={s.h2}>Verifying...</h2>
        <p className={s.subtitle}>Checking your answer...</p>
      </div>
      <ProgressIndicator />
      <div className={s.note}>
        <ShieldCheck size={16} />
        <span>Do not close this screen while verification is in progress.</span>
      </div>
    </section>
  );
}
