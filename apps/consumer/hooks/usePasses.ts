import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { Pass } from "../lib/shared";

interface UsePassesResult {
  passes: Pass[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePasses(): UsePassesResult {
  const { user } = useAuth();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPasses = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Fetch passes where user is issuer OR owner
      const { data, error: fetchError } = await supabase
        .from("passes")
        .select("*")
        .or(`issuer_user_id.eq.${user.id},owner_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setPasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch passes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, [user]);

  return { passes, isLoading, error, refetch: fetchPasses };
}
