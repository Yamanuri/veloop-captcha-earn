import { Check } from 'lucide-react';
import s from './captcha.module.css';

export default function CaptchaOption({ value, index, selected, locked, scanning, onSelect }) {
  const cls = [s.option, selected && s.optionSelected, locked && !selected && s.optionLocked, selected && scanning && s.optionScanning]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={cls}
      style={{ '--i': index }}
      disabled={locked}
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      <span className={s.optionText}>{value}</span>
      {selected && (
        <span className={s.optionCheck} aria-hidden="true">
          <Check size={13} strokeWidth={3.2} />
        </span>
      )}
    </button>
  );
}
