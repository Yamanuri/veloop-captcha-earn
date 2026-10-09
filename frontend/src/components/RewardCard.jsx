import GemIcon from './GemIcon.jsx';
import { fmtReward, gemWord } from '../utils/format.js';
import s from './captcha.module.css';

export default function RewardCard({ reward }) {
  return (
    <div className={s.rewardCard}>
      <span className={s.rewardIcon}><GemIcon size={26} /></span>
      <div>
        <p className={s.rewardLine}>
          Complete verification to earn <b>{reward ? `${fmtReward(reward.correct)} ${gemWord(reward.correct)}` : '…'}</b>
        </p>
        {reward && <p className={s.rewardSub}>Any completed attempt earns {fmtReward(reward.wrong)} {gemWord(reward.wrong)}.</p>}
      </div>
    </div>
  );
}
