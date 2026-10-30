import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { Navigate } from "react-router-dom";

export const Logout = () => {
  const { logout } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    logout().finally(() => {
      if (!cancelled) {
        setDone(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  if (!done) {
    return null;
  }

  return <Navigate to="/login" />;
};
