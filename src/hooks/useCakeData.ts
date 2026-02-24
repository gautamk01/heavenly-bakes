import { useEffect, useState } from "react";
import { loadCakeData } from "@/lib/cakeLoader";
import type { CakeData } from "@/types/cake";

export function useCakeData() {
  const [cakes, setCakes] = useState<CakeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadCakeData()
      .then(setCakes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { cakes, loading, error };
}
