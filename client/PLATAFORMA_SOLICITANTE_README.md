# Plataforma del Solicitante — Ollas Comunes

Cliente web (React 18 + TypeScript + Vite + Tailwind CSS) para uso exclusivo
del **Dirigente de Olla Común**: postulación, padrón de beneficiarios,
seguimiento de la solicitud ante el Estado y consulta de la asignación de
insumos una vez aprobada.

## Cómo integrarlo a tu proyecto existente

Ya tienes un proyecto Vite+React+TS scaffolded (carpeta `client/`). Este
paquete trae únicamente el código fuente nuevo — no sobrescribe tu
`node_modules`. Para integrarlo:

1. Copia el contenido de la carpeta `client/src` de este paquete dentro de
   tu propio `client/src`, reemplazando `App.tsx`, `main.tsx`, `index.css`
   y `vite-env.d.ts`, y agregando las carpetas `types/`, `lib/`, `context/`,
   `components/`, `pages/`.
2. Copia `tailwind.config.js` y `postcss.config.js` a la raíz de tu `client/`.
3. Copia `.env.example` a la raíz de tu `client/` y renómbralo a `.env`,
   ajustando `VITE_API_BASE_URL` a la URL real de tu backend PHP en Azure.
4. Instala las dependencias nuevas que usa este código:

```bash
cd client
npm install react-router-dom@6
npm install -D tailwindcss@3 postcss autoprefixer
```

5. Levanta el entorno de desarrollo:

```bash
npm run dev
```

## Verificación realizada

Este código fue compilado y verificado antes de la entrega:

- `npx tsc --noEmit` → **0 errores** de TypeScript
- `npm run build` → build de producción exitoso (Vite)
- `npx oxlint src` → **0 errores**, solo 2 advertencias de estilo esperadas
  (patrón estándar de fetch-on-mount y hook de contexto), sin impacto
  funcional

## Estructura de carpetas

```
client/src/
├── types/index.ts            # Interfaces TS 1:1 con bd_operativa_central
├── lib/
│   ├── api.ts                 # Cliente REST (fetch + JWT)
│   ├── dniValidation.ts       # Módulo 11 + mock RENIEC
│   └── offlineQueue.ts        # Cola offline-first (cola_sincronizacion)
├── context/
│   └── AuthContext.tsx        # Sesión, login, registro, logout
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Layout con nav + indicador offline
│   │   ├── NavBar.tsx         # Nav superior (desktop) / inferior (móvil)
│   │   └── ProtectedRoute.tsx # Guard de rutas autenticadas
│   └── ui/
│       ├── StatusBadge.tsx
│       ├── Stepper.tsx
│       └── EmptyState.tsx
├── pages/
│   ├── LoginPage.tsx                  # Vista 1
│   ├── RegistroOllaPage.tsx           # Vista 2
│   ├── PadronPage.tsx                 # Vista 3
│   ├── ConfirmacionSolicitudPage.tsx  # Vista 4
│   ├── SeguimientoSolicitudPage.tsx   # Vista 5
│   ├── AsignacionPage.tsx             # Vista 6
│   ├── HistorialPage.tsx              # Vista 7
│   ├── NotificacionesPage.tsx         # Vista 8
│   └── PerfilPage.tsx                 # Vista 9
├── App.tsx                    # Rutas
└── main.tsx                   # Punto de entrada
```

## Endpoints REST que el backend PHP debe exponer

El cliente asume esta forma de API (ajusta rutas si tu backend usa otras):

| Método | Ruta | Uso |
|---|---|---|
| POST | `/auth/login` | Login por DNI o email |
| POST | `/auth/registro-dirigente` | Alta de cuenta, rol `SOLICITANTE_DIRIGENTE` |
| GET | `/reniec/verificar/:dni` | Mock RENIEC (bd_estado_reniec) |
| POST | `/ollas-comunes` | Crear olla común (Vista 2) |
| GET/PUT | `/ollas-comunes/:id` | Leer/editar datos de la olla |
| GET/POST | `/ollas-comunes/:id/beneficiarios` | Padrón (Vista 3) |
| GET | `/ollas-comunes/:id/resumen` | Resumen de expediente (Vista 4) |
| POST | `/ollas-comunes/:id/solicitudes` | Enviar solicitud formal |
| GET | `/ollas-comunes/:id/historial-postulaciones` | Historial (Vista 7) |
| GET | `/ollas-comunes/:id/asignacion-vigente` | Insumos/porciones (Vista 6) |
| GET | `/notificaciones` | Bandeja de avisos (Vista 8) |
| PUT | `/notificaciones/:id/leer` | Marcar notificación leída |
| PUT | `/usuarios/:id` | Editar datos de contacto (Vista 9) |
| PUT | `/usuarios/:id/contrasena` | Cambiar contraseña |
| POST | `/sincronizacion/transacciones` | Recepción de la cola offline |

## Notas de diseño

- Paleta y tipografía pensadas para dirigentas con distinta alfabetización
  digital: alto contraste, inputs de 48px de alto, un solo color de acento
  usado con moderación, sin jerga técnica en los textos.
- Offline-first: toda escritura (registro de olla, de beneficiario) intenta
  la API primero y cae a `lib/offlineQueue.ts` si no hay red, sincronizando
  automáticamente al reconectar (evento `online`).
- El algoritmo módulo 11 (`lib/dniValidation.ts`) da feedback inmediato en
  cliente; la verificación de identidad real siempre se confirma contra el
  mock RENIEC del backend.
