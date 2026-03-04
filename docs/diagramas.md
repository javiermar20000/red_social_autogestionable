# Diagramas UML y de Arquitectura

## Sistema y despliegue
```mermaid
flowchart TB
  subgraph DockerCompose
    FE[Nginx + Frontend]
    BE[Backend Express]
    DB[(PostgreSQL)]
    RD[(Redis)]
    INIT[db-init]
    BKP[db-backup]
  end

  FE -->|/api| BE
  BE --> DB
  BE --> RD
  INIT --> DB
  BKP --> DB
```

## Pipeline de peticion en backend
```mermaid
flowchart LR
  C[Cliente] --> R[Router Express]
  R --> M1[authMiddleware]
  M1 --> M2[resolveTenantScope]
  M2 --> CTX[runWithContext]
  CTX --> ORM[TypeORM Repos]
  ORM --> DB[(PostgreSQL + RLS)]
  DB --> ORM --> CTX --> R --> C
```

## Secuencia de login
```mermaid
sequenceDiagram
  participant U as Usuario
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL

  U->>FE: Ingresa credenciales
  FE->>API: POST /api/auth/login
  API->>DB: Buscar usuario o admin
  DB-->>API: Datos
  API-->>FE: JWT + perfil
  FE-->>U: Sesion iniciada
```

## Secuencia de publicacion y moderacion
```mermaid
sequenceDiagram
  participant O as Oferente
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL
  participant A as Admin

  O->>FE: Crea publicacion
  FE->>API: POST /api/businesses/:id/publications
  API->>DB: Guardar (PENDIENTE_VALIDACION)
  DB-->>API: OK
  API-->>FE: Publicacion creada

  A->>FE: Revisar pendientes
  FE->>API: GET /api/admin/publications/pending
  API->>DB: Listar pendientes
  DB-->>API: Pendientes
  API-->>FE: Pendientes

  A->>FE: Aprobar
  FE->>API: POST /api/admin/publications/:id/approve
  API->>DB: Estado PUBLICADA + revision
  DB-->>API: OK
  API-->>FE: Aprobada
```

## Secuencia de reserva y validacion QR
```mermaid
sequenceDiagram
  participant C as Cliente
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL
  participant O as Oferente

  C->>FE: Selecciona mesas y horario
  FE->>API: POST /api/reservations
  API->>DB: Verificar disponibilidad
  API->>DB: Crear reserva + links
  DB-->>API: OK
  API-->>FE: Codigo de reserva
  FE-->>C: Mostrar QR (MCF|codigo)

  O->>FE: Escanear QR
  FE->>API: GET /api/reservations/verify?code=...
  API->>DB: Marcar COMPLETADA y ocupar mesas
  DB-->>API: OK
  API-->>FE: Reserva valida
```
