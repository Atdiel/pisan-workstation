# Changelog

Todos los cambios notables de PISANTECH Suite se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [SemVer](https://semver.org/lang/es/).

La versión de suite de este repositorio debe coincidir con la de
`pisan-backend/package.json`. La API de la suite permanece en `v1` salvo que se
indique lo contrario.

## [Unreleased]

## [0.2.0] - 2026-11-03

### Added

- Pantalla de Ajustes con secciones de General, Apariencia, Atajos de teclado,
  Notificaciones, Actualizaciones y Acerca de, y Sesión y seguridad.
- Preferencias por dispositivo para iniciar con Windows en builds empaquetados,
  abrir minimizada en la barra de tareas y recordar la última vista.
- Tres temas visuales: Default, Dark Forest y Moonlight, con
  persistencia local y vista previa en Ajustes.
- Notificaciones nativas de escritorio con interruptor maestro para cambios de
  estado del equipo y recordatorio diario de comida.
- Recordatorio de comida según horario laboral y zona horaria, con ventana de
  gracia y sin avisos duplicados.
- Al hacer clic en una notificación se restaura o enfoca la ventana y se navega
  a Estado y Comida.
- Actualizaciones desde la app con `electron-updater`: comprobación manual desde
  Ajustes, comprobación automática diaria a las 9:00 (hora local) y aviso en el
  footer global.
- Preferencia por dispositivo para activar o desactivar la comprobación
  automática de actualizaciones.
- Descarga e instalación de actualizaciones bajo confirmación del usuario, con
  progreso y opción de reiniciar para instalar.
- Generador de contraseñas y medidor de fortaleza en la bóveda, con opción para
  mostrar u ocultar la contraseña.
- Script `icons:generate` y assets de marca para la app, el instalador, la
  ventana y el favicon.
- Sección de atajos de teclado de referencia y estado de versión/canal estable
  en Ajustes.

### Changed

- La bóveda y sus modales usan portal, se adaptan a pantallas pequeñas y
  muestran textos y estados en español.
- El inicio de la pausa de comida comparte un único diálogo entre el header y
  Estado y Comida, y se sincroniza si la pausa se inicia desde otro dispositivo.
- La última vista recordada valida vistas conocidas y permisos de administrador;
  las vistas placeholder de Planner y Feed no se persisten.
- El idioma queda visible como Español (México) con la etiqueta «Próximamente».
- Las notificaciones y las opciones de arranque se guardan por dispositivo en el
  proceso principal de Electron; el tema y la última vista se conservan
  localmente en el renderer.
- Los avisos nativos se muestran mientras la app está abierta o minimizada; no
  hay bandeja ni servicio en segundo plano.
- La landing de descargas se rediseñó con la identidad visual de PISANTECH
  Workstation.
- La ventana, el favicon y los metadatos usan la identidad de PISANTECH
  Workstation; el isotipo incorpora el azul corporativo.
- Los temas claro y oscuro comparten tokens de color y reglas de contraste en
  toda la interfaz.
- El release draft incluye `latest.yml` y el `.blockmap`, y la app consulta
  actualizaciones desde GitHub Releases con el provider de GitHub configurado
  como draft.

### Fixed

- Se evitaron avisos duplicados de estado del equipo y recordatorios de comida
  repetidos.
- Se corrigió el desbordamiento de los modales de la bóveda en ventanas
  pequeñas.
- Se corrigió el regreso a Dashboard al cerrar sesión cuando «Recordar última
  vista» está desactivado.

### Security

- Las notificaciones nativas se validan y filtran en el proceso principal; el
  renderer no puede saltarse el interruptor maestro.
- Restablecer Ajustes no modifica credenciales ni sesión.
- La descarga y la instalación de actualizaciones requieren confirmación y no se
  ejecutan en segundo plano. `electron-updater` valida el SHA-512 publicado
  antes de instalar.
- Las builds de Windows siguen sin firma de código; SmartScreen puede advertir
  sobre el instalador y las actualizaciones.

## [0.1.0] - 2026-10-29

### Added

- Escritorio Electron con autenticación Microsoft Entra ID, directorio,
  presencia, bóveda de credenciales, perfil y administración de usuarios.
- Gestión de sesiones por dispositivo con revocación remota.
- Bloqueo local de la bóveda con clave maestra de 10 minutos.
- Configuración de empaquetado con identidad `PISANTECH Workstation`.
- Workflow de release para Windows que valida el tag contra `package.json`,
  genera el instalador y publica un draft en GitHub Releases con checksums.
- Landing estática de descargas en `docs/` y workflow de GitHub Pages.
- Script `release:tag-check` para validar tags antes de construir.
- Herramientas `version:check` y `release:set` para mantener sincronizada la
  versión de suite con el backend.

### Changed

- La versión de suite se gestiona de forma unificada con el backend.
- El instalador y `app.getVersion()` usan la versión de `package.json`.
- El CI valida `main` y `development` y usa la variable de repositorio
  `VITE_API_URL`.
- Los artefactos de escritorio usan nombres sin espacios.
- El empaquetado se separa en `build:renderer` y `package:*` para reutilizarlo
  desde CI.

### Security

- El workflow de release usa permisos mínimos y crea releases como borrador para
  revisión manual.
- MSAL permanece en el proceso principal de Electron.
- La sesión local se invalida cuando el backend revoca el dispositivo.
- Los tokens de Microsoft no se exponen al renderer.
