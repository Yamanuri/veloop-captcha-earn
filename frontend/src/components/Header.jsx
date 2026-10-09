import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WalletBalance from './WalletBalance.jsx';
import BrandMark from './BrandMark.jsx';
import s from './captcha.module.css';

export default function Header({ balance }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  return (
    <header className={s.header}>
      <button className={s.back} onClick={() => (pathname === '/captcha-earn' ? nav('/history') : nav('/captcha-earn'))} aria-label="Back">
        <ChevronLeft size={20} />
      </button>
      <BrandMark />
      <WalletBalance balance={balance} />
    </header>
  );
}
