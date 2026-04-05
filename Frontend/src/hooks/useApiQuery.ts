import type { DependencyList } from "react";
import { useCallback, useEffect, useState } from "react";

type UseApiQueryOptions<T> = {
  enabled?: boolean;
  initialData?: T;
};

export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: DependencyList,
  options?: UseApiQueryOptions<T>
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuna hitilafu.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, refetch, setData };
}
