// Servicio de clave maestra LOCAL (offline-first).
// La clave nunca se guarda: solo su "huella" derivada con PBKDF2.
// Si se olvida, no hay forma de recuperarla → se re-hace login con Microsoft.

const STORAGE_KEY = "pisan.masterkey.v1";
const ITERATIONS = 250_000;

interface StoredKey {
  salt: string; // hex
  hash: string; // hex
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

function randomSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toHex(salt.buffer);
}

export function hasMasterKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function setupMasterKey(password: string): Promise<void> {
  const salt = randomSalt();
  const hash = await deriveHash(password, salt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ salt, hash } satisfies StoredKey));
}

export async function verifyMasterKey(password: string): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const { salt, hash } = JSON.parse(raw) as StoredKey;
  return (await deriveHash(password, salt)) === hash;
}

/** Borra la clave (recuperación vía re-login con Microsoft) */
export function clearMasterKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
