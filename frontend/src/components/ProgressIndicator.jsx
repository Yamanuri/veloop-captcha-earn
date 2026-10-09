import s from './captcha.module.css';

export default function ProgressIndicator() {
  return (
    <div className={s.progress} aria-hidden="true">
      <span />
    </div>
  );
}
