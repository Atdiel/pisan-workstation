import { apiFetch } from "./apiClient";
import {
  CredentialApi,
  CredentialForm,
  mapApiToCredential,
  Credential,
  VaultMetrics,
} from "../types/vault";

export async function fetchCredentials(): Promise<Credential[]> {
  const res = await apiFetch("/vault");
  if (!res.ok) throw new Error(await res.text());
  const data: CredentialApi[] = await res.json();
  return data.map(mapApiToCredential);
}

export async function fetchVaultMetrics(): Promise<VaultMetrics> {
  const res = await apiFetch("/vault/metrics");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCredential(form: CredentialForm): Promise<void> {
  const res = await apiFetch("/vault", {
    method: "POST",
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function updateCredential(
  id: string,
  form: Partial<CredentialForm>,
): Promise<void> {
  const res = await apiFetch(`/vault/${id}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteCredential(id: string): Promise<void> {
  const res = await apiFetch(`/vault/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}
