import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "pin_authenticated";
const DEFAULT_PIN = "9999";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  signIn: (pin: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  signIn: async () => false,
  signOut: () => {},
});

async function fetchPin(): Promise<string> {
  const { data } = await supabase.from("settings").select("value").eq("key", "access_pin").maybeSingle();
  const v = (data?.value ?? null) as any;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof v.pin === "string") return v.pin;
  return DEFAULT_PIN;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthenticated(localStorage.getItem(STORAGE_KEY) === "1");
    setLoading(false);
  }, []);

  const signIn = useCallback(async (pin: string) => {
    const stored = await fetchPin();
    if (pin === stored) {
      localStorage.setItem(STORAGE_KEY, "1");
      setAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
