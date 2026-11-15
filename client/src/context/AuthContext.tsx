/**
 * TEMPORARY SCAFFOLD — Mock Auth Context
 * This is a stub for Member 5's real auth/profile system.
 * Replace with Member 5's AuthContext when available.
 * Label: MOCK_AUTH_SCAFFOLD
 */
import React, { createContext, useContext, useState } from 'react';

interface AuthUser {
  id: string;
  displayName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

// Demo user pre-seeded in seed.sql
const DEMO_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  displayName: 'Alice',
  email: 'alice@example.com',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_USER);
  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
