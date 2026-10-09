export default function GemIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="gemG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f0a020" />
        </linearGradient>
      </defs>
      <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#gemG)" />
      <path d="M2 9h20M9 3l-3 6 6 12M15 3l3 6-6 12" fill="none" stroke="#fff6d5" strokeOpacity=".7" strokeWidth=".9" />
    </svg>
  );
}
