import { useEffect, useState } from "react";
import {
  hasMasterKey,
  setupMasterKey,
  verifyMasterKey,
} from "../services/masterKey.service";
import { Credential } from "../types/vault";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function useMasterKey() {
  // Si no hay clave guardada, el primer paso es el flujo de creación
  const [needsSetup, setNeedsSetup] = useState(() => !hasMasterKey());
  const [lastVerifiedAt, setLastVerifiedAt] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [selectedCredForUnlock, setSelectedCredForUnlock] =
    useState<Credential | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const isUnlocked =
    lastVerifiedAt !== null && Date.now() - lastVerifiedAt < TEN_MINUTES_MS;

  // Fuerza el bloqueo aunque el usuario no interactúe: sin este temporizador
  // una contraseña revelada podría seguir visible indefinidamente.
  useEffect(() => {
    if (lastVerifiedAt === null) return;

    const remaining = lastVerifiedAt + TEN_MINUTES_MS - Date.now();
    if (remaining <= 0) {
      setLastVerifiedAt(null);
      setRevealedIds([]);
      return;
    }

    const timer = setTimeout(() => {
      setLastVerifiedAt(null);
      setRevealedIds([]);
      setCopiedId(null);
    }, remaining);

    return () => clearTimeout(timer);
  }, [lastVerifiedAt]);

  const togglePasswordVisibility = (id: string) => {
    setRevealedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const revealAndToggle = (cred: Credential) => {
    if (revealedIds.includes(cred.id)) {
      togglePasswordVisibility(cred.id);
      return;
    }

    setRevealedIds((prev) =>
      prev.includes(cred.id) ? prev : [...prev, cred.id],
    );
  };

  const openUnlockModal = (cred?: Credential) => {
    if (isUnlocked) {
      if (cred) revealAndToggle(cred);
      return;
    }
    setVerifyError(null);
    setSelectedCredForUnlock(cred || null);
    setIsModalOpen(true);
  };

  /** Flujo de creación (primera vez): guarda la huella de la clave */
  const createMasterKey = async (newPassword: string) => {
    setVerifying(true);
    try {
      await setupMasterKey(newPassword);
      setNeedsSetup(false);
      setLastVerifiedAt(Date.now());
    } finally {
      setVerifying(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || verifying) return;

    setVerifying(true);
    setVerifyError(null);
    try {
      const ok = await verifyMasterKey(password);
      if (!ok) {
        setVerifyError("Clave maestra incorrecta.");
        return;
      }

      setLastVerifiedAt(Date.now());
      setIsModalOpen(false);
      setPassword("");

      if (selectedCredForUnlock) {
        const cred = selectedCredForUnlock;
        setSelectedCredForUnlock(null);
        revealAndToggle(cred);
      }
    } finally {
      setVerifying(false);
    }
  };

  const copy = (id: string, textToCopy: string) => {
    if (!isUnlocked) {
      openUnlockModal();
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return {
    needsSetup,
    isUnlocked,
    isModalOpen,
    setIsModalOpen,
    masterKey: password,
    setMasterKey: setPassword,
    showMasterPassword,
    setShowMasterPassword,
    rememberDevice,
    setRememberDevice,
    copiedId,
    revealedIds,
    verifyError,
    verifying,
    openUnlockModal,
    verifyMasterKey: verify,
    createMasterKey,
    togglePasswordVisibility,
    copy,
  };
}
