import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  signIn: (pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  signIn: async () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen first, then read existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("pin-login", { body: { pin } });
      if (error || !data?.access_token || !data?.refresh_token) return false;
      const { error: setErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (setErr) return false;
      setAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
