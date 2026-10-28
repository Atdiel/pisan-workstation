# 🛠️ DOCUMENTO DE ARQUITECTURA Y LÓGICA TÉCNICA

## Plataforma de Gestión de Trabajo Remoto (Electron Desktop App)

Este documento detalla la arquitectura técnica, los flujos de datos, la estructura de base de datos y la interacción entre módulos para el desarrollo del sistema.

## 1. VISIÓN GENERAL Y DIAGRAMA DE ARQUITECTURA

La aplicación sigue una arquitectura desacoplada basada en la estructura de seguridad de **Electron**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      INTERFAZ DE USUARIO (RENDERER)                   │
 │   React / Vue + Tailwind CSS (HTML, CSS, JS)                           │
 │                                                                        │
 │   [Módulo Comida]    [Módulo Bóveda]    [Módulo Avatares]  [Planner]   │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                     IPC Bridge (preload.js) - Totalmente Aislado
                                     │
 ┌───────────────────────────────────┴────────────────────────────────────┐
 │                      PROCESO PRINCIPAL (MAIN / NODE.JS)                │
 │                                                                        │
 │   - Gestión de Ventanas y Sistema Operativo                            │
 │   - Notificaciones Nativas & Audio                                     │
 │   - Encriptación / Desencriptación AES-256                             │
 │   - Autenticación OAuth (MSAL Node)                                    │
 └─────────────┬─────────────────────┬──────────────────────┬─────────────┘
               │                     │                      │
               │ (WebSockets)        │ (HTTPS Rest API)     │ (Graph API)
               ▼                     ▼                      ▼
┌─────────────────────────┐ ┌───────────────────┐ ┌─────────────────────┐
│  Servidor Realtime      │ │ Base de Datos     │ │ Microsoft Cloud     │
│  (Supabase / Socket.io) │ │ PostgreSQL        │ │ (Planner / Teams)   │
└─────────────────────────┘ └───────────────────┘ └─────────────────────┘

```

## 2. LÓGICA DE NEGOCIO Y DIAGRAMAS DE FLUJO

### A. Módulo de Estado de Disponibilidad y Comida (Tiempo Real)

Garantiza que la empresa sepa cuándo un empleado entra/sale de su hora de comida sin saturar el sistema.

```
[Usuario presiona "Iniciar Comida"]
               │
               ▼
   ¿Estado actual = Disponible?
      ├── NO ──► Mostrar mensaje de error
      └── SÍ ──► Continuar
               │
               ▼
   [IPC] Renderer envía evento 'CAMBIAR_ESTADO' -> Main Process
               │
               ▼
   Main registra timestamp local (started_at) y emite vía WebSocket
               │
               ▼
   ┌─────────────────────────────────────────────────────────┐
   │ Evento transmitido a todos los clientes conectados      │
   │ - Estado de Usuario X cambia a "En Comida"             │
   │ - Se inicia temporizador visible en UI de Usuario X     │
   └─────────────────────────────────────────────────────────┘
               │
               ▼
   ¿Tiempo transcurrido > Límite (ej. 60 min)?
      ├── SÍ ──► Disparar Notificación Nativa OS + Sonido
      └── NO ──► Mantener contador normal

```

### B. Módulo de Bóveda de Contraseñas (Cifrado de Grado Bancario)

Las contraseñas de SAP, VPNs y servidores **jamás se guardan o transmiten en texto plano**.

```
    [Crear/Editar Credencial]
               │
               ▼
    Texto Plano (Ej: "PasswordSAP2026")
               │
               ▼ (Lógica dentro del Proceso Principal Node.js)
    Algoritmo: AES-256-GCM
    - Generar Vector de Inicialización (IV) aleatorio
    - Cifrar usando la Secret Key de la empresa
               │
               ▼
    Resultado: { cipherText: "a8f3b...", iv: "f290...", tag: "7a81..." }
               │
               ▼
    Guardar objeto cifrado en Base de Datos PostgreSQL

```

#### Flujo de Lectura y Copiado Seguro:

1. El usuario hace clic en **"Copiar Contraseña"**.

2. La app verifica el rol del usuario en la base de datos (RBAC).

3. Si está autorizado, el proceso principal desencripta el valor en memoria temporal.

4. Se copia al portapapeles del sistema operativo (`clipboard.writeText`).

5. **Seguridad adicional:** Un temporizador elimina el contenido del portapapeles tras 30 segundos.

### C. Módulo de Integración con Microsoft Planner

Sincroniza las tareas del usuario mediante la API oficial de Microsoft.

```
┌──────────────┐          ┌──────────────────────┐          ┌──────────────────────────┐
│   App UI     │          │  Proceso Main (MSAL) │          │ Microsoft Graph API      │
└──────┬───────┘          └──────────┬───────────┘          └────────────┬─────────────┘
       │                             │                                   │
       │  1. Iniciar sesión MS       │                                   │
       ├────────────────────────────►│  2. Solicitud Token OAuth2        │
       │                             ├──────────────────────────────────►│
       │                             │  3. Retorna Access Token          │
       │                             │◄──────────────────────────────────┤
       │                             │                                   │
       │  4. Petición "Ver Tareas"   │                                   │
       ├────────────────────────────►│  5. GET /me/planner/tasks       │
       │                             ├──────────────────────────────────►│
       │                             │  6. Responde JSON + eTag          │
       │                             │◄──────────────────────────────────┤
       │  7. Renderiza Lista         │                                   │
       │◄────────────────────────────┤                                   │

```

## 3. MODELO DE DATOS (ESQUEMA DE BASE DE DATOS)

Estructura de tablas recomendada para PostgreSQL / Supabase:

### Tabla: `usuarios`

| 

| **Campo** | **Tipo** | **Descripción** | 
| `id` | UUID (PK) | Identificador único del usuario | 
| `nombre` | VARCHAR(100) | Nombre completo | 
| `email` | VARCHAR(150) | Correo corporativo (Único) | 
| `rol` | VARCHAR(20) | `'admin'`, `'leader'`, `'consultant'` | 
| `avatar_config` | JSONB | Semilla y estilo de DiceBear `{"seed": "ramon", "style": "notionists"}` | 
| `created_at` | TIMESTAMP | Fecha de registro | 

### Tabla: `estados_presencia`

| **Campo** | **Tipo** | **Descripción** | 
| `id` | UUID (PK) | ID del registro de estado | 
| `usuario_id` | UUID (FK) | Relación con la tabla `usuarios` | 
| `estado` | VARCHAR(20) | `'disponible'`, `'comida'`, `'reunion'`, `'offline'` | 
| `comida_inicio` | TIMESTAMP | Marca de tiempo al iniciar hora de comida | 
| `comida_fin` | TIMESTAMP | Marca de tiempo al finalizar comida (Nullable) | 
| `updated_at` | TIMESTAMP | Última actualización en tiempo real | 

### Tabla: `boveda_credenciales`

| **Campo** | **Tipo** | **Descripción** | 
| `id` | UUID (PK) | ID de la credencial | 
| `titulo` | VARCHAR(100) | Nombre del acceso (Ej. "VPN Cliente X", "SAP Producción") | 
| `servicio` | VARCHAR(50) | Categoría (`'VPN'`, `'SAP'`, `'DB'`, `'Server'`) | 
| `usuario_acceso` | VARCHAR(100) | Nombre de usuario / Login | 
| `password_cifrado` | TEXT | Cadena encriptada en AES-256 | 
| `iv` | VARCHAR(64) | Vector de Inicialización único para la desencriptación | 
| `auth_tag` | VARCHAR(64) | Tag de autenticación para validar la integridad | 
| `actualizado_por` | UUID (FK) | Usuario que realizó el último cambio | 
| `updated_at` | TIMESTAMP | Fecha de última modificación | 

### Tabla: `auditoria_credenciales`

| **Campo** | **Tipo** | **Descripción** | 
| `id` | UUID (PK) | ID del evento de auditoría | 
| `credencial_id` | UUID (FK) | Credencial consultada o modificada | 
| `usuario_id` | UUID (FK) | Usuario que realizó la acción | 
| `accion` | VARCHAR(20) | `'VER'`, `'COPIAR'`, `'EDITAR'`, `'CREAR'` | 
| `fecha` | TIMESTAMP | Fecha y hora exacta de la acción | 

## 4. ESTRATEGIA DE COMUNICACIÓN IPC (PRELOAD BRIDGE)

Para mantener la seguridad estricta en Electron, la interfaz de usuario **solamente** tiene acceso a métodos expuestos de forma explícita en `preload.js`:

```
// preload.js - Definición de la API Segura
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appAPI', {
  // Módulo de Estado
  cambiarEstado: (nuevoEstado) => ipcRenderer.invoke('presencia:cambiar', nuevoEstado),
  onEstadoActualizado: (callback) => ipcRenderer.on('presencia:notificar', (_event, data) => callback(data)),

  // Módulo Bóveda
  obtenerCredenciales: () => ipcRenderer.invoke('boveda:obtenerTodas'),
  copiarPasswordSeguro: (idCredencial) => ipcRenderer.invoke('boveda:copiarPassword', idCredencial),

  // Módulo Planner
  obtenerTareasPlanner: () => ipcRenderer.invoke('planner:obtenerTareas'),
  completarTareaPlanner: (taskId, etag) => ipcRenderer.invoke('planner:completarTarea', { taskId, etag })
});

```

## 5. REQUISITOS DE DESPLIEGUE Y COMPILACIÓN

1. **Variables de Entorno Mantenidas fuera de la UI (`.env`):**

   * `DATABASE_URL`: Conexión segura a PostgreSQL.

   * `ENCRYPTION_SECRET_KEY`: Llave de 32 bytes para la bóveda.

   * `AZURE_CLIENT_ID`: ID de aplicación de Microsoft Entra.

2. **Empaquetado (Electron Builder):**

   * Salida para Windows: `.exe` estandarizado con asistente de instalación NSIS.

   * Registro de accesos directos e identidad del sistema (`AppUserModelId`).