import { app, safeStorage, shell } from 'electron';
import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type ICachePlugin,
} from '@azure/msal-node';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const API_URL =
  import.meta.env.VITE_API_URL ?? process.env.PISAN_API_URL ?? 'http://localhost:3000';

/** Scopes mínimos para identificar al usuario (ID token). */
const ID_SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read'];
/** Scopes de Graph para Planner; se piden aparte para no bloquear el login. */
const GRAPH_SCOPES = ['Tasks.ReadWrite', 'User.Read'];
/**
 * Scope delegado para publicar el estado de comida en Microsoft Teams. Se usa
 * la forma completa del recurso para que el token tenga audiencia de Graph y no
 * se confunda con un permiso expuesto por la propia aplicación.
 */
const TEAMS_SCOPES = ['https://graph.microsoft.com/Presence.ReadWrite'];

export interface AuthAccount {
  username: string;
  name: string | null;
}

export interface AuthSession {
  authenticated: boolean;
  account: AuthAccount | null;
  idToken: string | null;
}

export interface AuthConfig {
  clientId: string;
  tenantId: string;
}

function toAccount(account: AccountInfo | null | undefined): AuthAccount | null {
  if (!account) return null;
  return {
    username: account.username,
    name: account.name ?? null,
  };
}

function tokenClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function logTeamsToken(token: string, username?: string): void {
  if (process.env.PISAN_DEBUG_TEAMS !== '1') return;

  const claims = tokenClaims(token);
  console.log('[teams] access token', {
    aud: claims.aud,
    scp: claims.scp,
    appid: claims.appid,
    ver: claims.ver,
    idp: claims.idp,
    tid: claims.tid,
    username,
  });
}

class AuthManager {
  private pca: PublicClientApplication | null = null;
  private config: AuthConfig | null = null;

  private getCachePath(): string {
    return path.join(app.getPath('userData'), 'msal-cache.bin');
  }

  private async getConfig(): Promise<AuthConfig> {
    if (this.config) return this.config;

    const response = await fetch(`${API_URL}/auth/config`);
    if (!response.ok) {
      throw new Error(
        `No se pudo obtener la configuración de autenticación (${response.status})`,
      );
    }

    this.config = (await response.json()) as AuthConfig;
    return this.config;
  }

  private cachePlugin(): ICachePlugin {
    const cachePath = this.getCachePath();

    return {
      beforeCacheAccess: async (context) => {
        try {
          const encrypted = await fs.readFile(cachePath);
          context.tokenCache.deserialize(
            safeStorage.decryptString(encrypted),
          );
        } catch (error) {
          // Sin caché (primer login) o caché corrupta: se empieza vacío en vez
          // de dejar al usuario bloqueado.
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            await fs.unlink(cachePath).catch(() => undefined);
          }
        }
      },
      afterCacheAccess: async (context) => {
        if (!context.cacheHasChanged) return;
        const encrypted = safeStorage.encryptString(
          context.tokenCache.serialize(),
        );
        await fs.writeFile(cachePath, encrypted, { mode: 0o600 });
      },
    };
  }

  private async getPca(): Promise<PublicClientApplication> {
    if (this.pca) return this.pca;

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error(
        'El almacenamiento seguro del sistema no está disponible; no se pueden guardar los tokens.',
      );
    }

    const { clientId, tenantId } = await this.getConfig();
    this.pca = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
      cache: { cachePlugin: this.cachePlugin() },
    });

    return this.pca;
  }

  private async silent(
    scopes: string[],
    forceRefresh = false,
  ): Promise<{ result: AuthenticationResult | null; account: AccountInfo | null }> {
    const pca = await this.getPca();
    const accounts = await pca.getTokenCache().getAllAccounts();
    const account = accounts[0] ?? null;

    if (!account) return { result: null, account: null };

    const result = await pca.acquireTokenSilent({
      account,
      scopes,
      forceRefresh,
    });
    return { result, account: result.account ?? account };
  }

  async login(): Promise<AuthSession> {
    const pca = await this.getPca();

    const result = await pca.acquireTokenInteractive({
      scopes: ID_SCOPES,
      openBrowser: async (url) => {
        await shell.openExternal(url);
      },
      successTemplate:
        '<h3>PISANTECH Suite</h3><p>Autenticación completada. Ya puedes cerrar esta ventana y volver a la aplicación.</p>',
      errorTemplate:
        '<h3>PISANTECH Suite</h3><p>No se pudo completar la autenticación. Revisa la aplicación e inténtalo de nuevo.</p>',
    });

    return {
      authenticated: true,
      account: toAccount(result.account),
      idToken: result.idToken || null,
    };
  }

  async getSession(): Promise<AuthSession> {
    try {
      const { result, account } = await this.silent(ID_SCOPES);
      if (!account) {
        return { authenticated: false, account: null, idToken: null };
      }

      return {
        authenticated: true,
        account: toAccount(account),
        idToken: result?.idToken || null,
      };
    } catch {
      const pca = await this.getPca();
      const accounts = await pca.getTokenCache().getAllAccounts();
      return {
        authenticated: accounts.length > 0,
        account: toAccount(accounts[0]),
        idToken: null,
      };
    }
  }

  async getIdToken(): Promise<AuthSession> {
    const { result, account } = await this.silent(ID_SCOPES);
    if (!account || !result?.idToken) {
      throw new Error('No hay una sesión de Microsoft activa');
    }

    return {
      authenticated: true,
      account: toAccount(account),
      idToken: result.idToken,
    };
  }

  async getGraphToken(): Promise<string> {
    const { result } = await this.silent(GRAPH_SCOPES);
    if (!result?.accessToken) {
      throw new Error(
        'No se pudo obtener acceso a Microsoft Planner. Vuelve a iniciar sesión.',
      );
    }
    return result.accessToken;
  }

  /**
   * Token delegado para Microsoft Teams. El permiso Presence.ReadWrite se pide
   * aparte del login para no bloquear el acceso a la suite; la primera vez que
   * se necesita se solicita consentimiento interactivo.
   */
  async getTeamsToken(): Promise<string> {
    try {
      // forceRefresh evita reutilizar un token viejo con audiencia incorrecta
      // después de corregir los scopes de Graph.
      const { result, account } = await this.silent(TEAMS_SCOPES, true);
      if (result?.accessToken) {
        logTeamsToken(
          result.accessToken,
          result.account?.username ?? account?.username,
        );
        return result.accessToken;
      }
      if (!account) {
        throw new Error('No hay una sesión de Microsoft activa');
      }
    } catch (error) {
      if (!(error instanceof InteractionRequiredAuthError)) throw error;
    }

    const pca = await this.getPca();
    const account = (await pca.getTokenCache().getAllAccounts())[0] ?? null;
    if (!account) {
      throw new Error('No hay una sesión de Microsoft activa');
    }

    const result = await pca.acquireTokenInteractive({
      scopes: TEAMS_SCOPES,
      account,
      openBrowser: async (url) => {
        await shell.openExternal(url);
      },
      successTemplate:
        '<h3>PISANTECH Suite</h3><p>Acceso a Microsoft Teams autorizado. Ya puedes cerrar esta ventana y volver a la aplicación.</p>',
      errorTemplate:
        '<h3>PISANTECH Suite</h3><p>No se pudo autorizar el acceso a Microsoft Teams. Revisa la aplicación e inténtalo de nuevo.</p>',
    });

    if (!result.accessToken) {
      throw new Error(
        'Microsoft no devolvió un token para actualizar tu estado en Teams.',
      );
    }

    logTeamsToken(
      result.accessToken,
      result.account?.username ?? account.username,
    );
    return result.accessToken;
  }

  /** Object ID de Entra del usuario, usado en las rutas /users/{id} de Graph. */
  async getAccountOid(): Promise<string> {
    const pca = await this.getPca();
    const account = (await pca.getTokenCache().getAllAccounts())[0];
    const claimOid = account?.idTokenClaims?.oid;
    if (typeof claimOid === 'string' && claimOid.length > 0) {
      return claimOid;
    }
    if (account?.localAccountId) {
      return account.localAccountId;
    }
    throw new Error('No hay una sesión de Microsoft activa');
  }

  async logout(): Promise<void> {
    const pca = await this.getPca();
    const accounts = await pca.getTokenCache().getAllAccounts();
    for (const account of accounts) {
      await pca.signOut({ account });
    }
    pca.clearCache();

    try {
      await fs.unlink(this.getCachePath());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

export const authManager = new AuthManager();
