# Base de datos

## Resumen
La base de datos es PostgreSQL 15 con un modelo multi-tenant basado en `tenant_id` y politicas de Row Level Security (RLS). La inicializacion se define en `db/init.sql`.

## Archivo de inicializacion
- `db/init.sql` crea enums, tablas, indices, triggers de consistencia y politicas RLS.
- No incluye datos semilla; solo estructura.

## Tablas principales (public schema)
- `tenant`, `usuario`, `admin_global`.
- `negocio`, `publicacion`, `categoria`, `publicacion_categoria`.
- `media`, `comentario`, `favorito`, `notificacion`, `revision_publicacion`.

## Multi-tenant y RLS
- Las tablas incluyen `tenant_id` donde corresponde.
- RLS se basa en las variables de sesion `app.tenant_id` y `app.is_admin_global`.
- En backend, `runWithContext` setea esas variables por transaccion.

## Triggers de consistencia
- `trg_negocio_tenant_consistency`: negocio y owner deben compartir tenant.
- `trg_publicacion_tenant_consistency`: publicacion, negocio y autor deben pertenecer al mismo tenant.

## Consideraciones para futuras funciones
- Conversaciones en PinCards: tabla `chat_mensaje` o similar vinculada a `publicacion` y `usuario`.
- Calificacion de alimentos: tabla `rating` con promedio por negocio o publicacion.
- Reservas con cobros: tablas `reserva` + `pago` con estado y proveedor de pago.
