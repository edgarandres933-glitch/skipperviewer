import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (user: string, pass: string, remember?: boolean) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_USER = "adminSCviewer";
const VALID_PASS = "SkipC@P@.%!1.";
const STORAGE_KEY = "skipperview_auth_token";
const USER_KEY = "skipperview_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return token === "authenticated_session_active";
  });

  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (token === "authenticated_session_active") {
        setIsAuthenticated(true);
        setUsername(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || VALID_USER);
      }
    }
  }, []);

  const login = (user: string, pass: string, remember = true): boolean => {
    const cleanUser = user.trim();
    const cleanPass = pass.trim();

    if (cleanUser === VALID_USER && cleanPass === VALID_PASS) {
      setIsAuthenticated(true);
      setUsername(cleanUser);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY, "authenticated_session_active");
      storage.setItem(USER_KEY, cleanUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}
