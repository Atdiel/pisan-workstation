# Changelog

Todos los cambios notables de PISANTECH Suite se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [SemVer](https://semver.org/lang/es/).

La versión de este repositorio debe coincidir con
`pisan-backend/package.json`.

## [Unreleased]

### Added

- Workflow de release para Windows que valida el tag contra `package.json`,
  genera el instalador y publica un draft en GitHub Releases con checksums.
- Landing estática de descargas en `docs/` y workflow de GitHub Pages.
- Script `release:tag-check` para validar tags antes de construir.

### Changed

- El CI valida `main` y `development` y usa la variable de repositorio
  `VITE_API_URL`.
- Los artefactos de escritorio usan nombres sin espacios.
- El empaquetado se separa en `build:renderer` y `package:*` para reutilizarlo
  desde CI.

### Security

- El workflow de release usa permisos mínimos y crea releases como borrador para
  revisión manual.

## [0.1.0] - 2026-10-27

### Added

- Escritorio Electron con autenticación Microsoft Entra ID, directorio,
  presencia, Planner, bóveda y perfil.
- Gestión de sesiones por dispositivo con revocación remota.
- Bloqueo local de la bóveda con clave maestra de 10 minutos.
- Configuración de empaquetado con identidad `PISANTECH Workstation`.
- Herramientas `version:check` y `release:set` para mantener sincronizada la
  versión de suite con el backend.

### Changed

- La versión de suite se gestiona de forma unificada con el backend.
- El instalador y `app.getVersion()` usan la versión de `package.json`.

### Security

- MSAL permanece en el proceso principal de Electron.
- La sesión local se invalida cuando el backend revoca el dispositivo.
- Los tokens de Microsoft no se exponen al renderer.
