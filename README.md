# PISANTECH Workstation

Escritorio de la **PISANTECH Suite**: Electron + React + TypeScript.
Incluye autenticación con Microsoft Entra ID, directorio, presencia, Planner,
bóveda de credenciales, perfil y gestión de sesiones por dispositivo.

## Descarga e instalación

Los instaladores se publican en
[GitHub Releases](https://github.com/Atdiel/pisan-workstation/releases). La
primera etapa está disponible para **Windows 10/11 x64**.

El instalador aún no está firmado, por lo que Windows puede mostrar SmartScreen.
Antes de instalar, compara el archivo con el `checksums.txt` publicado en el
release. Si el repositorio es privado, los assets del release también requieren
acceso al repositorio.

Para despliegue corporativo en equipos administrados, evalúa Intune o el portal
de aplicaciones de la empresa en lugar de la descarga manual.

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

El empaquetado se separa en dos pasos para que el CI pueda reutilizarlos:

```bash
npm run build:renderer
npm run package:win
```

Los artefactos quedan en `release/<version>/`. La versión del instalador y de
`app.getVersion()` sale del campo `version` de `package.json`.

## CI y releases

- `CI` corre en `push` y `pull_request` hacia `main` y `development`.
- La variable de repositorio `VITE_API_URL` define el backend que se incrusta en
  el build. Si no existe, se usa `https://pisan-backend.onrender.com` como
  respaldo.
- Un tag `vX.Y.Z` dispara `release-desktop.yml`.
- El workflow valida que el tag coincida con `package.json`, ejecuta lint,
  typecheck, compila el renderer, genera el instalador de Windows y crea un
  **draft release** en GitHub Releases con el `.exe` y `checksums.txt`.
- El draft se revisa y se publica manualmente. En una etapa posterior se pueden
  agregar macOS/Linux, firma de código y auto-update.

El primer release se publica desde un tag creado sobre `main`:

```bash
npm run release:tag-check -- v0.1.0
git tag -a v0.1.0 -m "PISANTECH Suite v0.1.0"
git push origin v0.1.0
```

## Landing

La página estática de descargas está en [`docs/index.html`](docs/index.html). El
workflow `pages.yml` la publica en GitHub Pages cuando cambia `docs/` en `main`.

Para habilitarla:

1. Ve a `Settings → Pages`.
2. Selecciona **GitHub Actions** como origen.
3. Ejecuta el workflow `Deploy landing` o haz merge de un cambio en `docs/`.

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
