import { Check } from 'lucide-react';
import s from './captcha.module.css';

const STEPS = ['Challenge', 'Verify', 'Reward'];

export default function FlowProgress({ current, result }) {
  return (
    <ol className={s.flowProgress} aria-label="CAPTCHA progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const complete = step < current;
        const active = step === current;
        const unsuccessful = active && step === 3 && result === 'WRONG';
        return (
          <li
            key={label}
            className={`${s.flowStep} ${complete ? s.flowStepComplete : ''} ${active ? s.flowStepActive : ''} ${unsuccessful ? s.flowStepError : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className={s.flowDot}>{complete ? <Check size={12} strokeWidth={3} /> : `0${step}`}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}