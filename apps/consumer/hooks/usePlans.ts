import { useEffect, useState } from "react";
import { getPlans } from "../lib/api";
import type { Plan } from "../lib/shared";

interface UsePlansResult {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const { plans: fetchedPlans } = await getPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, isLoading, error, refetch: fetchPlans };
}
