import { useCallback, useEffect, useState } from "react";
import {
  createCredential,
  deleteCredential,
  fetchCredentials,
  updateCredential,
} from "../services/vault.service";
import { Credential, CredentialForm } from "../types/vault";

export function useCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setCredentials(await fetchCredentials());
    } catch (err) {
      console.error("Error al cargar la bóveda:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (form: CredentialForm) => {
    await createCredential(form);
    await load();
  };

  const update = async (id: string, form: Partial<CredentialForm>) => {
    await updateCredential(id, form);
    // El autor lo asigna el backend desde el JWT; recargamos para reflejarlo.
    await load();
  };

  const remove = async (id: string) => {
    await deleteCredential(id);
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  return { credentials, loading, create, update, remove };
}
