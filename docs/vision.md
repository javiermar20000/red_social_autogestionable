# Vision de Producto - Match Coffee

## Que es
Match Coffee es una plataforma web tipo red social para negocios de comida y cafe. Permite que cafeterias, restaurantes, bares y negocios similares publiquen promociones, eventos y avisos, mientras los clientes pueden explorar, comentar, calificar y reservar mesas.

## Problema que resuelve
Los negocios gastronomicos suelen depender de redes sociales genericas y no cuentan con una vitrina especializada para promociones, reservas y publicidad local. Match Coffee busca centralizar estas funciones y ofrecer herramientas de gestion simples para cada negocio.

## Objetivos
- Dar visibilidad a negocios locales con un feed de publicaciones ordenado y filtrable.
- Facilitar la gestion de publicaciones con moderacion y control de calidad.
- Habilitar reservas de mesas con validacion por QR.
- Ofrecer planes de publicidad y reservas con suscripciones.
- Mantener aislamiento multi-tenant para que cada negocio gestione su contenido.

## Roles y actores
- Admin global: valida oferentes, modera publicaciones, administra planes y solicitudes de publicidad.
- Oferente: crea su tenant, registra negocios, publica contenido, gestiona mesas y reservas.
- Cliente o visitante: explora publicaciones, comenta, califica y reserva.

## Alcance actual
- Autenticacion JWT con roles.
- Multi-tenant con RLS en PostgreSQL.
- CRUD de negocios, categorias y publicaciones con moderacion.
- Feed publico y feed por tenant con filtros.
- Publicidad con planes y solicitudes de anuncios.
- Reservas de mesas con verificacion QR.
- PWA con service worker, mapas y rutas.

## Fuera de alcance por ahora
- Pagos transaccionales por reserva.
- Conversaciones en tiempo real entre usuarios.
- Almacenamiento de imagenes en S3 o CDN.
- Reportes analiticos avanzados.

## Resultados esperados
- Incrementar la visibilidad de negocios locales y sus promociones.
- Reducir fricciones al coordinar reservas.
- Ofrecer una base para monetizar el servicio mediante planes.
