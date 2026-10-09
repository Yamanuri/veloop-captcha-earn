import s from './captcha.module.css';

export default function ClaimButton({ children, onClick, disabled, tone = 'green' }) {
  return (
    <button type="button" className={`${s.cta} ${tone === 'green' ? s.ctaGreen : s.ctaGold}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
