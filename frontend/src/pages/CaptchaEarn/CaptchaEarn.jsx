import Header from '../../components/Header.jsx';
import AppNavigation from '../../components/AppNavigation.jsx';
import CaptchaChallenge from '../../components/CaptchaChallenge.jsx';
import CheckingState from '../../components/CheckingState.jsx';
import ResultCard from '../../components/ResultCard.jsx';
import MockAd from '../../components/MockAd.jsx';
import FlowBenefits from '../../components/FlowBenefits.jsx';
import { useWallet } from '../../hooks/useWallet.js';
import { useCaptchaFlow } from '../../hooks/useCaptchaFlow.js';
import { useAuth } from '../../context/AuthContext.jsx';
import s from '../../components/captcha.module.css';

export default function CaptchaEarn() {
  const { balance, error: walletError, refresh } = useWallet();
  const { logout } = useAuth();
  const flow = useCaptchaFlow({ refreshBalance: refresh });

  let stage;
  switch (flow.phase) {
    case 'loading':
      stage = (
        <div className={s.stack} aria-busy="true">
          <div className={s.skeleton} />
          <div className={s.skeleton} />
          <div className={s.skeleton} />
        </div>
      );
      break;
    case 'ready':
    case 'scanning':
      stage = (
        <CaptchaChallenge
          challenge={flow.challenge}
          selected={flow.selected}
          phase={flow.phase}
          onSelect={flow.select}
          onNewCode={flow.nextChallenge}
        />
      );
      break;
    case 'checking':
      stage = <CheckingState />;
      break;
    case 'result':
    case 'claiming':
      stage = (
        <ResultCard
          outcome={flow.outcome}
          balance={balance}
          claiming={flow.phase === 'claiming'}
          onClaim={flow.claim}
          onNoThanks={flow.nextChallenge}
        />
      );
      break;
    case 'ad':
      stage = <MockAd claimed={flow.claimed} onDone={flow.nextChallenge} />;
      break;
    default:
      stage = (
        <div className={`${s.stack} ${s.errorBox}`} role="alert">
          <h2 className={s.errorTitle}>{flow.error?.code === 'CHALLENGE_EXPIRED' ? 'This code expired' : 'Something went wrong'}</h2>
          <p className={s.subtitle}>{flow.error?.message}</p>
          <button type="button" className={`${s.cta} ${s.ctaGold}`} onClick={flow.nextChallenge}>Get New Code</button>
        </div>
      );
  }

  return (
    <div className={`${s.shell} ${s.earnShell}`}>
      <Header balance={balance} />
      {walletError && <p className={s.walletError} role="alert">Wallet balance could not be refreshed: {walletError.message}</p>}
      <div className={s.flowHeading}>
        <span className={s.pageEyebrow}>VELoop REWARDS · CAPTCHA EARN</span>
        <h1>Earn with confidence<span>.</span></h1>
        <p>A quick security check, with your reward ready on completion.</p>
      </div>
      <main className={`${s.panel} ${s.earnPanel}`}>{stage}</main>
      <FlowBenefits />
      <AppNavigation onLogout={logout} />
    </div>
  );
}
