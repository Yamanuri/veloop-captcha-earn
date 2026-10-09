import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useWallet } from '../hooks/useWallet.js';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import AppNavigation from '../components/AppNavigation.jsx';
import CaptchaHistory from '../components/CaptchaHistory.jsx';
import s from '../components/captcha.module.css';

export default function History() {
  const { balance, error: walletError } = useWallet();
  const { logout } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    api.history(page, 8)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return (
    <div className={s.shell}>
      <Header balance={balance} />
      {walletError && <p className={s.walletError} role="alert">Wallet balance could not be refreshed: {walletError.message}</p>}
      <main className={s.panel}>
        <div className={s.stack}>
          <div className={s.titleBlock}>
            <span className={s.pageEyebrow}>YOUR REWARDS</span>
            <h1 className={s.title}>CAPTCHA Activity</h1>
            <p className={s.subtitle}>Your completed checks and Gem rewards.</p>
          </div>
          {error && <p className={s.formError}>{error}</p>}
          {!data && !error && <div className={s.skeleton} />}
          {data && <CaptchaHistory items={data.items} />}
          <div className={s.pager}>
            <button className={s.ghost} style={{ width: 'auto', padding: '0 14px' }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>{page} / {pages}</span>
            <button className={s.ghost} style={{ width: 'auto', padding: '0 14px' }} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </main>
      <AppNavigation onLogout={logout} />
    </div>
  );
}
