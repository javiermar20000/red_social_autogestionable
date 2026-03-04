# Frontend

## Resumen
Aplicacion web en React 18 + Vite 5. El UI utiliza componentes propios (PinCards, dialogs y grilla tipo masonry) y consume la API via `VITE_API_URL` (por defecto `/api`). Se usa Tailwind y Bootstrap para estilos.

## Estructura relevante
- `frontend/src/main.jsx`: punto de entrada.
- `frontend/src/App.jsx`: orquestacion de vistas, estado global y llamadas a la API.
- `frontend/src/components/`: componentes UI (Header, PinCard, PinDetailDialog, AuthDialog, ExploreDialog, AdPanel, MasonryGrid).
- `frontend/src/styles.css`: estilos base y configuracion Tailwind.

## Variables de entorno (ver `.env.example`)
- `VITE_API_URL`: base URL de la API (en Docker se usa `/api`).
- `VITE_API_PROXY_TARGET`: objetivo del proxy en dev local.
- `VITE_USE_HTTPS`, `VITE_HTTPS_KEY`, `VITE_HTTPS_CERT`: soporte HTTPS local.

## Estado y almacenamiento local
- Token JWT y usuario se guardan en `localStorage` (`token`, `user`, `tenantId`).
- Cache de feed y anuncios en `localStorage` para mejorar tiempos de carga.

## Flujos principales
- Autenticacion (login/registro) y persistencia de sesion.
- Feed publico y por tenant, con filtros por categoria/negocio.
- Publicaciones con detalle en `PinDetailDialog`.
- Paneles de oferente/admin para crear y moderar publicaciones.

## Pendientes funcionales (roadmap)
- Conversaciones dentro de PinCards.
- Calificacion de alimentos por usuarios.
- Reservas con cobros integrados para asistir a un lugar especifico.
