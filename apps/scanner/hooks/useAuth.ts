import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isSignedIn: false,
    error: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message, isLoading: false }));
        return;
      }

      setAuthState({
        user: session?.user || null,
        isSignedIn: !!session?.user,
        isLoading: false,
        error: null,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          user: session?.user || null,
          isSignedIn: !!session?.user,
          isLoading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return authState;
}
