import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { AuthState } from '@/types/auth';

const defaultAuthState: AuthState = {
  isConfigured: false,
  isLoading: false,
  session: null,
  user: null,
  profile: null,
  refresh: async () => {},
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProviderValue({
  value,
  children,
}: PropsWithChildren<{ value: AuthState }>) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
