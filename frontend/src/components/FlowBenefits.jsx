import { Gift, LockKeyhole, Smartphone, Sparkles, Zap } from 'lucide-react';
import s from './captcha.module.css';

const BENEFITS = [
  { icon: LockKeyhole, title: 'SECURE', text: 'Advanced protection for your account' },
  { icon: Gift, title: 'REWARDING', text: 'Earn Gems for each verification' },
  { icon: Zap, title: 'FAST', text: 'Instant verification and rewards' },
  { icon: Smartphone, title: 'MOBILE FIRST', text: 'Optimized for every device' },
  { icon: Sparkles, title: 'TRUSTED', text: 'Your security is our priority' },
];

export default function FlowBenefits() {
  return (
    <ul className={s.benefits} aria-label="VELoop Rewards benefits">
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li className={s.benefit} key={title}>
          <Icon size={18} aria-hidden="true" />
          <span>
            <strong>{title}</strong>
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
