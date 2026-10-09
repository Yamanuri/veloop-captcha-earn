import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

// The balance shown in the UI is always what the server says. Never computed locally.
export function useWallet() {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    try {
      const r = await api.getGems();
      setBalance(r.balance);
      setError(null);
      return r.balance;
    } catch (e) {
      setError(e);
      return null;
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { balance, error, refresh };
}
