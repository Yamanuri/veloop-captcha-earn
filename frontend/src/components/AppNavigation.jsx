import { History, LogOut, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import s from './captcha.module.css';

export default function AppNavigation({ onLogout }) {
  return (
    <nav className={s.footer} aria-label="Main navigation">
      <NavLink to="/captcha-earn" className={({ isActive }) => `${s.navItem} ${isActive ? s.navActive : ''}`}>
        <Sparkles size={16} />
        <span>Earn Gems</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `${s.navItem} ${isActive ? s.navActive : ''}`}>
        <History size={16} />
        <span>Activity</span>
      </NavLink>
      <button className={s.navItem} type="button" onClick={onLogout}>
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </nav>
  );
}