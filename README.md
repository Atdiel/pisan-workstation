# PISANTECH Workstation

Escritorio de la **PISANTECH Suite**: Electron + React + TypeScript.
Incluye autenticación con Microsoft Entra ID, directorio, presencia, Planner,
bóveda de credenciales, perfil y gestión de sesiones por dispositivo.

## Requisitos

- Node.js 22–24
- npm 11+
- Backend de la suite accesible por HTTP/WS

## Desarrollo

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env.local` y ajusta el backend:

```env
VITE_API_URL=http://localhost:3000
```

MSAL se ejecuta únicamente en el proceso principal de Electron. El renderer no
recibe tokens de Microsoft.

## Verificación

```bash
npm run lint
npx tsc --noEmit
npx vite build
```

El empaquetado completo (`.exe`, `.dmg`, `.AppImage`) se genera con:

```bash
VITE_API_URL=https://tu-servicio.onrender.com npm run build
```

Los artefactos quedan en `release/<version>/`. La versión del instalador y de
`app.getVersion()` sale del campo `version` de `package.json`.

## Versionado

La suite usa una **versión única de suite** compartida con `pisan-backend`, con
tags `vX.Y.Z` en ambos repositorios.

```bash
npm run version:check
npm run release:set -- 0.2.0
```

Consulta [`VERSIONING.md`](VERSIONING.md) para el flujo de release,
compatibilidad de API y ramas. Los cambios se registran en
[`CHANGELOG.md`](CHANGELOG.md).
