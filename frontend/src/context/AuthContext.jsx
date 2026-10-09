import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, setUnauthorizedHandler } from '../services/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setAuthed(false);
  }, []);
  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    tokenStore.set(res.token);
    setAuthed(true);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.register(name, email, password);
    tokenStore.set(res.token);
    setAuthed(true);
  }, []);

  const value = useMemo(() => ({ authed, login, register, logout }), [authed, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
