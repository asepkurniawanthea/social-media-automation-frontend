import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../constants/menu.config";

interface User {
  id: number;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const VALID_ROLES: Role[] = ["ADMIN", "EDITOR", "SCHEDULER"];

  function normalizeRole(role: string): Role {
    const upper = role.toUpperCase();
    if (!VALID_ROLES.includes(upper as Role)) {
      throw new Error(`Role tidak valid: ${role}`);
    }
    return upper as Role;
  }

  const login = (newToken: string, userData: User) => {
    const normalizedUser: User = {
      ...userData,
      role: normalizeRole(userData.role),
    };
    setToken(newToken);
    setUser(normalizedUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// The context hook intentionally shares this module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
};
