import { useQuery } from "@tanstack/react-query";
import { fetchVaultMetrics } from "../services/vault.service";
import { VaultMetrics } from "../types/vault";

/** Clave de caché compartida de las métricas de la bóveda. */
export const VAULT_METRICS_QUERY_KEY = ["vault", "metrics"] as const;

/**
 * Obtiene las métricas de la bóveda desde GET /vault/metrics usando React Query.
 * La caché se comparte entre componentes (StatsCards y VaultView), por lo que
 * una sola petición alimenta a todos. Para refrescarlas tras una mutación usa
 * queryClient.invalidateQueries({ queryKey: VAULT_METRICS_QUERY_KEY }).
 */
export function useVaultMetrics() {
  return useQuery<VaultMetrics>({
    queryKey: VAULT_METRICS_QUERY_KEY,
    queryFn: fetchVaultMetrics,
  });
}
