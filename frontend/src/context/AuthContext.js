import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = guest, object = ascendant
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      setUser(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (email, username, password, firstName, lastName) => {
    try {
      const { data } = await api.post("/auth/register", { email, username, password, firstName, lastName });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await api.post("/auth/google", { credential });
      if (data.needsSetup) {
        return {
          ok: true,
          needsSetup: true,
          email: data.email,
          setupToken: data.setupToken,
          firstName: data.firstName,
          lastName: data.lastName,
        };
      }
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const completeGoogleSignup = async (setupToken, username, password, firstName, lastName) => {
    try {
      const { data } = await api.post("/auth/google/complete", { setupToken, username, password, firstName, lastName });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      /* ignore */
    }
    setUser(false);
  };

  const forgotPassword = async (email) => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const updateName = async (firstName, lastName) => {
    try {
      const { data } = await api.patch("/profile/name", { firstName, lastName });
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const deleteAccount = async (password) => {
    try {
      await api.delete("/auth/account", { data: { password } });
      setUser(false);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, checking, login, register, loginWithGoogle, completeGoogleSignup, logout,
        forgotPassword, resetPassword, updateName, deleteAccount, setUser, refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
