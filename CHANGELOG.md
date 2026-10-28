# Changelog

Todos los cambios notables de PISANTECH Suite se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [SemVer](https://semver.org/lang/es/).

La versión de este repositorio debe coincidir con
`pisan-backend/package.json`.

## [Unreleased]

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
