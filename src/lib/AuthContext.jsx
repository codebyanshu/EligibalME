import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appAuthApi } from "@/lib/appApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      const result = await appAuthApi.me();
      setUser(result.user);
      setAuthError(null);
      return result.user;
    } catch (error) {
      setUser(null);
      setAuthError(error.status === 401 ? null : error);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const completeLogin = useCallback((result) => {
    setUser(result.user);
    setAuthError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await appAuthApi.logout();
    } catch (error) {
      console.error("Could not clear the server session:", error);
    } finally {
      setUser(null);
      window.location.assign("/login");
    }
  }, []);

  const navigate = useNavigate();
  const navigateToLogin = useCallback(() => navigate("/login"), [navigate]);
  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    authChecked: !isLoadingAuth,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState: checkUserAuth,
    completeLogin,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
