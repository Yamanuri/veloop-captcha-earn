import s from './captcha.module.css';

export default function BrandMark({ className = s.brand }) {
  return (
    <div className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l9 6-9 14L3 8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3 8h18M12 2v20" stroke="currentColor" strokeWidth="1" opacity=".6" />
      </svg>
      <span className={s.brandName}>VELOOP</span>
      <span className={s.brandSub}>REWARDS</span>
    </div>
  );
}