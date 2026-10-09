import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { sleep } from '../utils/format.js';

/**
 * phases: loading -> ready -> scanning (0.5s UI animation) -> checking (waits for backend)
 *         -> result (correct | wrong) -> claiming -> ad (mock) -> loading -> ready ...
 *         error (any failure: expired, duplicate, network ...)
 * Every business value (result, reward, balance) comes from the API response.
 */
export function useCaptchaFlow({ refreshBalance }) {
  const [phase, setPhase] = useState('loading');
  const [challenge, setChallenge] = useState(null);
  const [selected, setSelected] = useState(null);
  const [outcome, setOutcome] = useState(null); // { result, reward:{amount,currency} }
  const [claimed, setClaimed] = useState(null); // { reward, balance }
  const [error, setError] = useState(null);
  const busy = useRef(false);

  const load = useCallback(async (fetcher) => {
    setPhase('loading');
    setError(null);
    setSelected(null);
    setOutcome(null);
    setClaimed(null);
    try {
      const { challenge: c } = await fetcher();
      setChallenge(c);
      setPhase('ready');
    } catch (e) {
      setError(e);
      setPhase('error');
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    load(api.getCurrent);
  }, [load]);

  const select = useCallback(
    async (option) => {
      if (busy.current || phase !== 'ready') return; // options lock immediately
      busy.current = true;
      setSelected(option);
      setPhase('scanning');
      const req = api.verify(challenge.challengeId, option).then((r) => ({ r }), (e) => ({ e }));
      await sleep(300);
      setPhase('checking');
      const [res] = await Promise.all([req, sleep(200)]); // ~0.5s UI minimum; result ALWAYS comes from the backend
      if (res.e) {
        setError(res.e);
        setPhase('error');
      } else {
        await refreshBalance();
        setOutcome(res.r);
        setPhase('result');
      }
      busy.current = false;
    },
    [challenge, phase, refreshBalance]
  );

  const claim = useCallback(async () => {
    if (busy.current || phase !== 'result') return;
    busy.current = true;
    setPhase('claiming');
    try {
      const r = await api.claim(challenge.challengeId);
      setClaimed(r);
      await refreshBalance();
      setPhase('ad');
    } catch (e) {
      setError(e);
      setPhase('error');
    } finally {
      busy.current = false;
    }
  }, [challenge, phase, refreshBalance]);

  const nextChallenge = useCallback(() => {
    if (busy.current && phase !== 'ad') return;
    busy.current = true;
    load(api.newChallenge);
  }, [load, phase]);

  return { phase, challenge, selected, outcome, claimed, error, select, claim, nextChallenge };
}
