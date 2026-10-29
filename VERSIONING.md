# Versionado y releases

PISANTECH Suite usa **SemVer** con una **versión única de suite** para
`pisan-backend` y `pisan-workstation`. La versión vive en el `package.json` de
cada repositorio y debe ser idéntica en ambos.

El contrato HTTP/WS se versiona aparte. Hoy es **API v1** y se publica en
`GET /health` como `apiVersion`.

## Repositorios

| Repositorio | Contenido | Artefacto |
| --- | --- | --- |
| `pisan-backend` | API central, WebSocket, PostgreSQL | Servicio en Render |
| `pisan-workstation` | Electron + React | Instalador de escritorio |

Son dos repositorios Git independientes. Un release de suite se identifica con
el mismo tag `vX.Y.Z` en ambos.

## Fuente de verdad y herramientas

- La versión de suite es el campo `version` de ambos `package.json`.
- `npm run version:check` valida que backend, escritorio y `package-lock.json`
  estén sincronizados.
- `npm run release:set -- X.Y.Z` actualiza ambos repositorios sin crear commit
  ni tag.
- Los scripts buscan los repos como hermanos. Si el checkout tiene otra
  estructura, define `PISAN_BACKEND_DIR` y `PISAN_FRONTEND_DIR`.
- `GET /health` devuelve `version` (suite) y `apiVersion` (`v1`).

## Reglas SemVer

- **MAJOR**: cambio incompatible de API/WS, migración que obliga a actualizar el
  escritorio, o cambio que no puede convivir con clientes anteriores.
- **MINOR**: funcionalidad nueva compatible hacia atrás.
- **PATCH**: correcciones compatibles, seguridad y ajustes internos.
- **Prerelease** (`0.2.0-rc.1`): solo para pruebas; no se publica como release
  estable ni se usa en producción.

La versión instalada del escritorio puede ir por detrás de la del backend,
porque Render despliega de forma independiente. Por eso el backend debe seguir
aceptando al menos la versión de escritorio anterior mientras los usuarios
actualizan.

Con versión única, todo release sube el número en ambos repositorios aunque solo
cambie uno. Si el escritorio no cambia funcionalmente, se puede recompilar el
instalador desde el tag para mantener la paridad, o indicar en las notas que el
instalador es equivalente al anterior. Lo que no se permite es dejar los
`package.json` desincronizados.

## Contrato de API

- **API v1** es la versión estable actual. No lleva prefijo en la URL para no
  romper al cliente existente.
- Los cambios aditivos (nuevos endpoints, campos opcionales, nuevos eventos) son
  compatibles y van en MINOR o PATCH.
- Eliminar o renombrar campos, volver obligatorio un campo opcional, cambiar
  códigos de error existentes o cambiar la semántica de un endpoint es un cambio
  incompatible.
- Un cambio incompatible requiere una **API v2** con convivencia temporal y un
  release MAYOR de la suite. No se introduce un corte abrupto en `main`.
- El escritorio envía `appVersion` al crear la sesión; el backend la guarda en
  `UserSession` y la muestra en el perfil. Esa es la referencia para saber qué
  clientes siguen conectados.

## Ramas y commits

- `main` siempre debe poder desplegarse.
- Trabaja en ramas cortas: `feat/<tema>`, `fix/<tema>`, `chore/<tema>`,
  `docs/<tema>`, `refactor/<tema>`.
- Usa Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `security:`.
- No hagas commit de `.env`, secretos, `node_modules`, `dist`, `dist-electron`,
  `release`, `coverage` ni archivos de caché.
- Los cambios de versión se hacen con `release:set`, no editando un solo
  `package.json` a mano.

## Checklist de release

### 1. Verificar

```bash
# Backend
npm ci
npm run verify
npm run version:check

# Escritorio
cd ../pisan-workstation
npm ci
npm run lint
npx tsc --noEmit
npx vite build
```

### 2. Versionar y etiquetar

```bash
# Desde cualquiera de los dos repos
npm run release:set -- 0.2.0
```

Actualiza `CHANGELOG.md` en ambos repositorios y luego, en cada uno:

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v0.2.0"
git tag -a v0.2.0 -m "PISANTECH Suite v0.2.0"
```

### 3. Construir y desplegar

El escritorio se construye en GitHub Actions al empujar el tag:

```bash
git push origin v0.2.0
```

El workflow `release-desktop.yml` valida que el tag coincida con `package.json`,
compila el renderer y genera el instalador de Windows. Al terminar crea un
**draft release** con el `.exe` y `checksums.txt`.

Revisa el draft, descarga el instalador y pruébalo en una máquina limpia antes de
publicarlo.

Construcción manual de respaldo:

```bash
# Escritorio
VITE_API_URL=https://tu-servicio.onrender.com npm run build:renderer
npm run package:win
# Artefactos en release/0.2.0/

# Backend
npm run db:deploy
# Desplegar el commit etiquetado en Render
```

Prueba de humo mínima:

```bash
curl https://tu-servicio.onrender.com/health
```

Debe responder `status: "ok"`, la `version` esperada y `apiVersion: "v1"`.

### 4. Publicar

- Empuja `main` y el tag en ambos repositorios: `git push origin main --tags`.
- Publica el draft release del escritorio después de probar el instalador.
- En las notas del release incluye los commits de backend y escritorio, la
  versión de API y cualquier migración o variable de entorno nueva.
- Si el release cambia la API, indica qué versiones de escritorio siguen siendo
  compatibles.
- Adjunta `checksums.txt` y conserva los instaladores anteriores para permitir
  rollback a una versión estable.

## Hotfix

1. Crea la rama desde el tag afectado: `git switch -c fix/<tema> vX.Y.Z`.
2. Corrige, agrega la prueba y ejecuta el gate correspondiente.
3. Ejecuta `npm run release:set -- X.Y.(Z+1)` en ambos repos.
4. Actualiza ambos `CHANGELOG.md`, haz commit y crea el tag del patch.
5. Despliega el backend y, si aplica, publica el instalador del escritorio.

## Referencias

- [Semantic Versioning](https://semver.org/lang/es/)
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
