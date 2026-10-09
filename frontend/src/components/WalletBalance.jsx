import GemIcon from './GemIcon.jsx';
import { fmtGems } from '../utils/format.js';
import s from './captcha.module.css';

export default function WalletBalance({ balance }) {
  return (
    <div className={s.pill} aria-label="Gem balance" aria-live="polite">
      <GemIcon size={16} />
      <span>{fmtGems(balance)}</span>
      <small className={s.walletLabel}>GEMS</small>
    </div>
  );
}
