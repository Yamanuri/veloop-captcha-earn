import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BrandMark from '../components/BrandMark.jsx';
import s from '../components/captcha.module.css';

export default function Login() {
  const { authed, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegistering = mode === 'register';
  if (authed) return <Navigate to="/captcha-earn" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegistering && password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (isRegistering) await register(name.trim(), email, password);
      else await login(email, password);
      nav('/captcha-earn');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.shell}>
      <main className={`${s.panel} ${s.loginPanel}`}>
        <form className={`${s.stack} ${s.loginForm}`} onSubmit={submit}>
          <BrandMark className={`${s.brand} ${s.loginBrand}`} />
          <div className={s.titleBlock}>
            <h1 className={s.title}>{isRegistering ? 'Create account' : 'Welcome back'}</h1>
            <p className={s.subtitle}>{isRegistering ? 'Set up your VELoop Rewards account.' : 'Sign in to VELoop Rewards to start earning Gems.'}</p>
          </div>
          {isRegistering && (
            <label className={s.field}>Name
              <input className={s.input} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
            </label>
          )}
          <label className={s.field}>Email
            <input className={s.input} type="email" autoComplete="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className={s.field}>Password
            <input className={s.input} type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={isRegistering ? 8 : undefined} maxLength={128} required />
          </label>
          {isRegistering && (
            <label className={s.field}>Confirm password
              <input className={s.input} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} maxLength={128} required />
            </label>
          )}
          {error && <p className={s.formError} role="alert">{error}</p>}
          <button className={`${s.cta} ${s.ctaGold}`} disabled={busy}>{busy ? (isRegistering ? 'Creating account…' : 'Signing in…') : (isRegistering ? 'Create account' : 'Sign in')}</button>
          <p className={s.authPrompt}>
            {isRegistering ? 'Already have an account?' : 'New to VELoop?'}{' '}
            <button className={s.authSwitch} type="button" onClick={() => { setMode(isRegistering ? 'login' : 'register'); setError(''); }}>
              {isRegistering ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
