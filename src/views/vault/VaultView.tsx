import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCredentials } from "../../hooks/useCredentials";
import { useMasterKey } from "../../hooks/useMasterKey";
import {
  VAULT_METRICS_QUERY_KEY,
  useVaultMetrics,
} from "../../hooks/useVaultMetrics";
import {
  Credential,
  CredentialForm,
  EMPTY_CREDENTIAL_FORM,
} from "../../types/vault";
import { CreateCredentialModal } from "./components/CreateCredentialModal";
import { CredentialsTable } from "./components/CredentialsTable";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { EditCredentialModal } from "./components/EditCredentialModal";
import { MasterKeyModal } from "./components/MasterKeyModal";
import { SetupMasterKeyModal } from "./components/SetupMasterKeyModal";
import { StatsCards, VaultHeader } from "./components/VaultHeader";
import { VaultToolbar } from "./components/VaultToolbar";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function VaultView({
  currentUser,
  onMasterKeyRecovery,
}: {
  currentUser?: CurrentUser | null;
  onMasterKeyRecovery?: () => void;
}) {
  const { credentials, loading, create, update, remove } = useCredentials();
  const masterKey = useMasterKey();

  const queryClient = useQueryClient();
  const { data: metrics } = useVaultMetrics();
  const total = metrics?.total ?? 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("ALL");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Refresca las métricas de la bóveda tras cada mutación (React Query)
  const refreshMetrics = () => {
    void queryClient.invalidateQueries({ queryKey: VAULT_METRICS_QUERY_KEY });
  };

  // Edición
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [editForm, setEditForm] = useState<CredentialForm>(
    EMPTY_CREDENTIAL_FORM,
  );
  const [savingEdit, setSavingEdit] = useState(false);

  // Creación
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CredentialForm>(
    EMPTY_CREDENTIAL_FORM,
  );
  const [savingCreate, setSavingCreate] = useState(false);

  // Borrado
  const [credToDelete, setCredToDelete] = useState<Credential | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreate(true);
    try {
      await create(createForm);
      setIsCreateOpen(false);
      setCreateForm(EMPTY_CREDENTIAL_FORM);
      refreshMetrics();
    } catch (err) {
      console.error("Error al crear la credencial:", err);
      alert("No se pudo crear la credencial. Revisa la consola.");
    } finally {
      setSavingCreate(false);
    }
  };

  const openCreate = () => {
    setCreateForm(EMPTY_CREDENTIAL_FORM);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cred: Credential) => {
    setEditingCred(cred);
    setEditForm({
      systemName: cred.systemName,
      type: cred.type,
      environment: cred.environment,
      username: cred.username,
      // Se deja vacío para no reenviar la contraseña actual en cada edición;
      // solo se reemplaza si el usuario escribe una nueva.
      password: "",
      url: cred.url ?? "",
      notes: cred.notes ?? "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCred) return;
    setSavingEdit(true);
    try {
      const payload: Partial<CredentialForm> = { ...editForm };
      if (!payload.password?.trim()) {
        delete payload.password;
      }
      await update(editingCred.id, payload);
      setEditingCred(null);
      refreshMetrics();
    } catch (err) {
      console.error("Error al actualizar la credencial:", err);
      alert("No se pudo actualizar la credencial. Revisa la consola.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!credToDelete) return;
    setDeleting(true);
    try {
      await remove(credToDelete.id);
      setCredToDelete(null);
      refreshMetrics();
    } catch (err) {
      console.error("Error al eliminar la credencial:", err);
      alert("No se pudo eliminar la credencial. Revisa la consola.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleMenu = (id: string) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleCopy = (cred: Credential) => {
    if (!masterKey.isUnlocked) {
      masterKey.openUnlockModal(cred);
      return;
    }

    if (!cred.realPassword) {
      console.error("La credencial no incluye una contraseña para copiar.");
      return;
    }

    masterKey.copy(cred.id, cred.realPassword);
  };

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = selectedEnv === "ALL" || cred.environment === selectedEnv;
    return matchesSearch && matchesEnv;
  });

  if (loading) return <div>Cargando credenciales de la Bóveda...</div>;

  return (
    <div className="w-full h-full flex-1 space-y-6 text-slate-100 p-6 relative overflow-y-auto">
      <VaultHeader onAdd={openCreate} />
      <StatsCards />

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <VaultToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedEnv={selectedEnv}
          onEnvChange={setSelectedEnv}
          total={total}
        />

        <CredentialsTable
          credentials={filteredCredentials}
          isUnlocked={masterKey.isUnlocked}
          revealedIds={masterKey.revealedIds}
          copiedId={masterKey.copiedId}
          menuOpenId={menuOpenId}
          onToggleMenu={toggleMenu}
          onOpenEdit={handleOpenEdit}
          onDelete={(cred) => {
            setCredToDelete(cred);
            setMenuOpenId(null);
          }}
          onToggleVisibility={masterKey.openUnlockModal}
          onCopy={handleCopy}
        />

        <div className="p-4 border-t border-dark-border flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Contraseñas cifradas en reposo con AES-256-GCM
          </div>
          <span>
            Mostrando {filteredCredentials.length} de {total}
          </span>
        </div>
      </div>

      <CreateCredentialModal
        open={isCreateOpen}
        form={createForm}
        saving={savingCreate}
        currentUserName={currentUser?.name ?? "—"}
        onChange={setCreateForm}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <DeleteConfirmDialog
        credential={credToDelete}
        deleting={deleting}
        onCancel={() => setCredToDelete(null)}
        onConfirm={handleDelete}
      />

      <EditCredentialModal
        credential={editingCred}
        form={editForm}
        saving={savingEdit}
        currentUserName={currentUser?.name ?? "—"}
        onChange={setEditForm}
        onClose={() => setEditingCred(null)}
        onSubmit={handleSaveEdit}
      />

      <MasterKeyModal
        open={masterKey.isModalOpen}
        masterKey={masterKey.masterKey}
        showPassword={masterKey.showMasterPassword}
        rememberDevice={masterKey.rememberDevice}
        error={masterKey.verifyError}
        verifying={masterKey.verifying}
        onForgot={onMasterKeyRecovery}
        onMasterKeyChange={masterKey.setMasterKey}
        onTogglePassword={() =>
          masterKey.setShowMasterPassword(!masterKey.showMasterPassword)
        }
        onRememberChange={masterKey.setRememberDevice}
        onClose={() => masterKey.setIsModalOpen(false)}
        onSubmit={masterKey.verifyMasterKey}
      />

      <SetupMasterKeyModal
        open={masterKey.needsSetup}
        verifying={masterKey.verifying}
        onSubmit={masterKey.createMasterKey}
        onClose={() => {}}
      />
    </div>
  );
}
