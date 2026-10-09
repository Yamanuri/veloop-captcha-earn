import { Check, Minus, X } from 'lucide-react';
import { fmtReward, gemWord } from '../utils/format.js';
import s from './captcha.module.css';

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDay(items) {
  const groups = [];
  for (const item of items) {
    const label = dayLabel(item.date);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, items: [item] });
    else last.items.push(item);
  }
  return groups;
}

function timeLabel(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function CaptchaHistory({ items }) {
  if (!items.length) return <p className={s.hint}>Nothing yet. Solve your first CAPTCHA to start earning.</p>;
  return (
    <div className={s.historyList}>
      {groupByDay(items).map((group) => (
        <section key={group.label} className={s.historyDay}>
          <h2 className={s.dayHead}>{group.label}</h2>
          <ul className={s.historyRows}>
            {group.items.map((r) => (
              <li key={r.challengeId} className={s.historyRow}>
                <div className={s.historyOutcome}>
                  <span className={`${s.historyIcon} ${r.result === 'CORRECT' ? s.historyIconOk : r.result === 'WRONG' ? s.historyIconBad : ''}`} aria-hidden="true">
                    {r.result === 'CORRECT' ? <Check size={15} /> : r.result === 'WRONG' ? <X size={15} /> : <Minus size={15} />}
                  </span>
                  <div className={s.historyCopy}>
                    <span className={`${s.tag} ${r.result === 'CORRECT' ? s.tagOk : r.result === 'WRONG' ? s.tagBad : s.tagNeutral}`}>
                      {r.result === 'CORRECT' ? 'Correct' : r.result === 'WRONG' ? 'Wrong' : 'Skipped'}
                    </span>
                    <time className={s.historyTime} dateTime={r.date}>{timeLabel(r.date)}</time>
                  </div>
                </div>
                <div className={s.historyDetails}>
                  <span className={s.historyReward}>{r.result ? `${fmtReward(r.reward)} ${gemWord(r.reward)}` : '—'}</span>
                  <span className={s.historyStatus}>
                    {r.rewardStatus === 'CLAIMED' ? 'Claimed' : r.rewardStatus === 'DISCARDED' ? 'Skipped' : r.rewardStatus === 'PENDING' ? 'Pending' : '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
