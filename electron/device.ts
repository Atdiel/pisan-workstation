import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DeviceInfo } from './ipc-types.js';

const DEVICE_ID_FILE = 'device-id';
let cached: DeviceInfo | null = null;
let pending: Promise<DeviceInfo> | null = null;

function deviceIdPath(): string {
  return path.join(app.getPath('userData'), DEVICE_ID_FILE);
}

async function readOrCreateDeviceId(): Promise<string> {
  const file = deviceIdPath();

  try {
    const stored = (await fs.readFile(file, 'utf8')).trim();
    if (stored.length >= 8 && stored.length <= 100) return stored;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[device] No se pudo leer el id del dispositivo:', error);
    }
  }

  const deviceId = randomUUID();
  try {
    await fs.writeFile(file, deviceId, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    // Si no se puede persistir, la sesión funciona igual; solo se perderá la
    // identidad del equipo al reiniciar la aplicación.
    console.warn('[device] No se pudo guardar el id del dispositivo:', error);
  }
  return deviceId;
}

/**
 * Identidad del equipo usada por el backend para listar y revocar sesiones.
 * Se guarda en `userData`; no es un secreto, solo un identificador estable.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const info: DeviceInfo = {
      deviceId: await readOrCreateDeviceId(),
      deviceName: os.hostname() || 'Equipo sin nombre',
      platform: process.platform,
      appVersion: app.getVersion(),
    };
    cached = info;
    return info;
  })().finally(() => {
    pending = null;
  });

  return pending;
}
