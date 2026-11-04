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
  **draft release** en GitHub Releases con el `.exe`, `checksums.txt`,
  `latest.yml` y `.blockmap`.
- El draft se revisa y se publica manualmente. Incluye el `.exe`, `checksums.txt`,
  `latest.yml` y el `.blockmap`, que son los metadatos que usa el cliente de
  actualizaciones. En una etapa posterior se pueden agregar macOS/Linux y firma
  de código.

El primer release se publica desde un tag creado sobre `main`:

```bash
npm run release:tag-check -- v0.1.0
git tag -a v0.1.0 -m "PISANTECH Suite v0.1.0"
git push origin v0.1.0
```

## Actualizaciones

La app comprueba actualizaciones automáticamente todos los días a las 9:00
(hora local) y también desde **Ajustes → Actualizaciones → Buscar
actualizaciones**. Cuando hay una versión nueva, el footer muestra el aviso y
permite descargarla; la instalación se confirma con **Reiniciar e instalar**.
No se descarga ni se instala nada en segundo plano.

El proceso main usa `electron-updater` y lee el `app-update.yml` que genera
`electron-builder`. El provider de GitHub está configurado como draft y el
workflow sube `latest.yml` y el `.blockmap` al release. Para pruebas con un
servidor genérico se puede definir `PISAN_UPDATE_FEED_URL`. Si el repositorio es
privado, el feed de GitHub necesita autenticación o un canal público alterno.

## Landing

La página estática de descargas está en [`docs/index.html`](docs/index.html). El
workflow `pages.yml` la publica en GitHub Pages cuando cambia `docs/` en `main`.

Para habilitarla:

1. Ve a `Settings → Pages`.
2. Selecciona **GitHub Actions** como origen.
3. Ejecuta el workflow `Deploy landing` o haz merge de un cambio en `docs/`.

## Iconos de escritorio

El icono de la app y del instalador se genera desde
[`src/assets/brand/logoPisantech.svg`](src/assets/brand/logoPisantech.svg):

```bash
npm run icons:generate
```

El comando actualiza:

- `build/icon.ico`: Windows.
- `build/icon.icns`: macOS.
- `build/icons/`: set de PNG para Linux.
- `build/icon.png` y `public/icon.png`: ventana de Electron y favicon del renderer.

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
