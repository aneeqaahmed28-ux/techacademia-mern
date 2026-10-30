import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  const applySession = useCallback((userData) => {
    setUser(userData || null);
    setLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await api("/api/auth/user");
      if (!response.ok) {
        setUser(null);
        return null;
      }
      const data = await response.json();
      const nextUser = data.userData || null;
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      console.error(error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    }
    setUser(null);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api("/api/data/services");
        if (!response.ok) return;
        const data = await response.json();
        const rows = Array.isArray(data.services) ? data.services : data.msg;
        if (!cancelled) {
          setServices(Array.isArray(rows) ? rows : []);
        }
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      isLoggedIn: Boolean(user),
      user,
      loading,
      services,
      applySession,
      logout,
    }),
    [user, loading, services, applySession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const authContextValue = useContext(AuthContext);
  if (!authContextValue) {
    throw new Error("useAuth used outside of the Provider");
  }
  return authContextValue;
};
