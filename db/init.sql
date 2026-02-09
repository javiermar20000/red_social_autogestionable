-- =========================================================
-- init.sql - Modelo multi-tenant red social/restaurantes
-- =========================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Esquema
CREATE SCHEMA IF NOT EXISTS public;
SET search_path TO public;

-- =========================================================
-- LIMPIEZA (POR SI SE REEJECUTA EL SCRIPT)
-- =========================================================

DROP TABLE IF EXISTS revision_publicacion CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS favorito CASCADE;
DROP TABLE IF EXISTS comentario CASCADE;
DROP TABLE IF EXISTS reserva_mesa CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS mesa CASCADE;
DROP TABLE IF EXISTS publicacion_categoria CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS publicacion CASCADE;
DROP TABLE IF EXISTS negocio CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS admin_global CASCADE;
DROP TABLE IF EXISTS tenant CASCADE;

DROP TYPE IF EXISTS revision_resultado_enum CASCADE;
DROP TYPE IF EXISTS notificacion_tipo_enum CASCADE;
DROP TYPE IF EXISTS comentario_estado_enum CASCADE;
DROP TYPE IF EXISTS reserva_estado_enum CASCADE;
DROP TYPE IF EXISTS reserva_horario_enum CASCADE;
DROP TYPE IF EXISTS mesa_estado_enum CASCADE;
DROP TYPE IF EXISTS categoria_tipo_enum CASCADE;
DROP TYPE IF EXISTS media_tipo_enum CASCADE;
DROP TYPE IF EXISTS publicacion_estado_enum CASCADE;
DROP TYPE IF EXISTS publicacion_tipo_enum CASCADE;
DROP TYPE IF EXISTS negocio_estado_enum CASCADE;
DROP TYPE IF EXISTS negocio_tipo_enum CASCADE;
DROP TYPE IF EXISTS usuario_estado_registro_enum CASCADE;
DROP TYPE IF EXISTS rol_usuario_enum CASCADE;
DROP TYPE IF EXISTS tenant_estado_enum CASCADE;

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE tenant_estado_enum AS ENUM (
  'PENDIENTE_VALIDACION',
  'ACTIVO',
  'SUSPENDIDO',
  'RECHAZADO'
);

CREATE TYPE rol_usuario_enum AS ENUM (
  'OFERENTE',
  'VISITANTE',
  'CLIENTE'
);

CREATE TYPE usuario_estado_registro_enum AS ENUM (
  'PENDIENTE_VALIDACION',
  'ACTIVO',
  'BLOQUEADO',
  'RECHAZADO'
);

CREATE TYPE negocio_tipo_enum AS ENUM (
  'RESTAURANTE',
  'CAFETERIA',
  'BAR',
  'FOODTRUCK'
);

CREATE TYPE negocio_estado_enum AS ENUM (
  'ACTIVO',
  'INACTIVO'
);

CREATE TYPE publicacion_tipo_enum AS ENUM (
  'PROMOCION',
  'EVENTO',
  'AVISO_GENERAL'
);

CREATE TYPE publicacion_estado_enum AS ENUM (
  'BORRADOR',
  'PENDIENTE_VALIDACION',
  'PUBLICADA',
  'VENCIDA',
  'RECHAZADA'
);

CREATE TYPE media_tipo_enum AS ENUM (
  'IMAGEN',
  'VIDEO'
);

CREATE TYPE categoria_tipo_enum AS ENUM (
  -- Tipos de café
  'ESPRESSO',
  'AMERICANO',
  'CAPPUCCINO',
  'LATTE',
  'MOCHA',
  'FLAT_WHITE',
  'MACCHIATO',
  'COLD_BREW',
  'AFFOGATO',
  -- Tipos de comida
  'PIZZA',
  'SUSHI',
  'HAMBURGUESAS',
  'PASTAS',
  'COMIDA_MEXICANA',
  'COMIDA_CHINA',
  'COMIDA_INDIAN',
  'POSTRES',
  'SANDWICHES',
  'ENSALADAS',
  -- Tipos de bar
  'CERVEZAS',
  'VINOS',
  'COCTELES',
  'DESTILADOS',
  'BEBIDAS_SIN_ALCOHOL',
  'TAPAS',
  'PICOTEO',
  -- Tipos de foodtruck
  'HOT_DOGS',
  'TACOS',
  'BURRITOS',
  'AREPAS',
  'EMPANADAS',
  'PAPAS_FRITAS',
  'WRAPS',
  'BROCHETAS',
  'HELADOS'
);

CREATE TYPE comentario_estado_enum AS ENUM (
  'VISIBLE',
  'OCULTO',
  'ELIMINADO'
);

CREATE TYPE mesa_estado_enum AS ENUM (
  'DISPONIBLE',
  'OCUPADA',
  'MANTENIMIENTO'
);

CREATE TYPE reserva_horario_enum AS ENUM (
  'DESAYUNO',
  'ALMUERZO',
  'ONCE',
  'CENA'
);

CREATE TYPE reserva_estado_enum AS ENUM (
  'CONFIRMADA',
  'CANCELADA',
  'COMPLETADA'
);

CREATE TYPE notificacion_tipo_enum AS ENUM (
  'SISTEMA',
  'PUBLICACION',
  'MODERACION'
);

CREATE TYPE revision_resultado_enum AS ENUM (
  'APROBADA',
  'RECHAZADA'
);

-- =========================================================
-- TABLAS PRINCIPALES
-- =========================================================

-- ADMIN GLOBAL (NO PERTENECE A NINGÚN TENANT)
CREATE TABLE admin_global (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  fecha_registro  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- USUARIOS NORMALES (OFERENTE + VISITANTE)
CREATE TABLE usuario (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        BIGINT,  -- FK se agrega luego (ciclo con tenant)
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  nombre           VARCHAR(150) NOT NULL,
  rol_usuario      rol_usuario_enum NOT NULL,
  estado_registro  usuario_estado_registro_enum NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
  fecha_registro   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_validacion TIMESTAMP WITH TIME ZONE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE
);

-- TENANT (MULTI-CLIENTE)
CREATE TABLE tenant (
  id                  BIGSERIAL PRIMARY KEY,
  nombre              VARCHAR(255) NOT NULL,
  dominio             VARCHAR(255) UNIQUE,
  estado              tenant_estado_enum NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
  fecha_creacion      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creador_oferente_id BIGINT NOT NULL,
  validador_admin_id  BIGINT,
  CONSTRAINT fk_tenant_creador_oferente
    FOREIGN KEY (creador_oferente_id) REFERENCES usuario(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_tenant_validador_admin
    FOREIGN KEY (validador_admin_id) REFERENCES admin_global(id)
    ON DELETE SET NULL
);

-- Ahora agregamos la FK usuario.tenant_id -> tenant.id (ciclo resuelto)
ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES tenant(id)
  ON DELETE SET NULL;

-- NEGOCIO
CREATE TABLE negocio (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      BIGINT NOT NULL,
  owner_id       BIGINT NOT NULL,
  nombre         VARCHAR(255) NOT NULL,
  tipo           negocio_tipo_enum NOT NULL,
  descripcion    TEXT,
  telefono       VARCHAR(30),
  imagen_url     TEXT,
  direccion      VARCHAR(255),
  ciudad         VARCHAR(100),
  region         VARCHAR(100),
  amenidades     TEXT[],
  latitud        DECIMAL(9,6),
  longitud       DECIMAL(9,6),
  estado         negocio_estado_enum NOT NULL DEFAULT 'ACTIVO',
  horario_manana_inicio TIME,
  horario_manana_fin    TIME,
  horario_tarde_inicio  TIME,
  horario_tarde_fin     TIME,
  dias_funcionamiento   INTEGER[],
  feriados              TEXT[],
  vacaciones            JSONB,
  cierre_temporal_activo BOOLEAN NOT NULL DEFAULT FALSE,
  cierre_temporal_desde DATE,
  cierre_temporal_hasta DATE,
  cierre_temporal_mensaje TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_negocio_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenant(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_negocio_owner
    FOREIGN KEY (owner_id) REFERENCES usuario(id)
    ON DELETE RESTRICT
);

-- MESA (PARA RESERVAS)
CREATE TABLE mesa (
  id                BIGSERIAL PRIMARY KEY,
  negocio_id        BIGINT NOT NULL,
  nombre            VARCHAR(120) NOT NULL,
  sillas            INTEGER NOT NULL DEFAULT 1,
  estado            mesa_estado_enum NOT NULL DEFAULT 'DISPONIBLE',
  ocupada_hasta     TIMESTAMP WITH TIME ZONE,
  fecha_creacion    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_mesa_negocio
    FOREIGN KEY (negocio_id) REFERENCES negocio(id)
    ON DELETE CASCADE
);

-- RESERVA
CREATE TABLE reserva (
  id              BIGSERIAL PRIMARY KEY,
  negocio_id      BIGINT NOT NULL,
  usuario_id      BIGINT,
  codigo          VARCHAR(50) NOT NULL UNIQUE,
  titular_nombre  VARCHAR(200),
  nombre_invitado VARCHAR(150),
  apellido_invitado VARCHAR(150),
  rut_invitado    VARCHAR(20),
  fecha_reserva   DATE NOT NULL,
  hora_reserva    TIME NOT NULL,
  horario         reserva_horario_enum NOT NULL,
  notas           TEXT,
  estado          reserva_estado_enum NOT NULL DEFAULT 'CONFIRMADA',
  monto           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fecha_validacion TIMESTAMP WITH TIME ZONE,
  fecha_creacion  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reserva_negocio
    FOREIGN KEY (negocio_id) REFERENCES negocio(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reserva_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON DELETE SET NULL
);

-- RESERVA - MESA (N:M)
CREATE TABLE reserva_mesa (
  reserva_id  BIGINT NOT NULL,
  mesa_id     BIGINT NOT NULL,
  mesa_nombre VARCHAR(120) NOT NULL,
  mesa_sillas INTEGER NOT NULL,
  PRIMARY KEY (reserva_id, mesa_id),
  CONSTRAINT fk_reserva_mesa_reserva
    FOREIGN KEY (reserva_id) REFERENCES reserva(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reserva_mesa_mesa
    FOREIGN KEY (mesa_id) REFERENCES mesa(id)
    ON DELETE RESTRICT
);

-- PUBLICACION
CREATE TABLE publicacion (
  id                   BIGSERIAL PRIMARY KEY,
  negocio_id           BIGINT NOT NULL,
  autor_id             BIGINT NOT NULL,
  titulo               VARCHAR(255) NOT NULL,
  contenido            TEXT NOT NULL,
  tipo                 publicacion_tipo_enum NOT NULL,
  estado               publicacion_estado_enum NOT NULL DEFAULT 'BORRADOR',
  fecha_creacion       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_publicacion    TIMESTAMP WITH TIME ZONE,
  fecha_fin_vigencia   TIMESTAMP WITH TIME ZONE,
  visitas              INTEGER NOT NULL DEFAULT 0,
  likes                INTEGER NOT NULL DEFAULT 0,
  es_publicidad        BOOLEAN NOT NULL DEFAULT FALSE,
  extras               JSONB,
  precio               NUMERIC(10, 2),
  CONSTRAINT fk_publicacion_negocio
    FOREIGN KEY (negocio_id) REFERENCES negocio(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_publicacion_autor
    FOREIGN KEY (autor_id) REFERENCES usuario(id)
    ON DELETE RESTRICT
);

-- MEDIA
CREATE TABLE media (
  id             BIGSERIAL PRIMARY KEY,
  publicacion_id BIGINT NOT NULL,
  url            TEXT NOT NULL,
  tipo           media_tipo_enum NOT NULL,
  orden          INTEGER,
  descripcion    VARCHAR(255),
  CONSTRAINT fk_media_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion(id)
    ON DELETE CASCADE
);

-- CATEGORIA
CREATE TABLE categoria (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      BIGINT NOT NULL,
  nombre         VARCHAR(100) NOT NULL,
  slug           VARCHAR(100) NOT NULL,
  tipo_categoria categoria_tipo_enum NOT NULL,
  CONSTRAINT uq_categoria_tenant_slug UNIQUE (tenant_id, slug),
  CONSTRAINT fk_categoria_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenant(id)
    ON DELETE CASCADE
);

-- RELACIÓN PUBLICACION-CATEGORIA (N:M)
CREATE TABLE publicacion_categoria (
  publicacion_id BIGINT NOT NULL,
  categoria_id   BIGINT NOT NULL,
  PRIMARY KEY (publicacion_id, categoria_id),
  CONSTRAINT fk_publicacion_categoria_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_publicacion_categoria_categoria
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
    ON DELETE CASCADE
);

-- COMENTARIO
CREATE TABLE comentario (
  id             BIGSERIAL PRIMARY KEY,
  publicacion_id BIGINT NOT NULL,
  usuario_id     BIGINT NOT NULL,
  comentario_padre_id BIGINT,
  contenido      TEXT NOT NULL,
  es_calificacion BOOLEAN NOT NULL DEFAULT FALSE,
  calificacion   SMALLINT,
  estado         comentario_estado_enum NOT NULL DEFAULT 'VISIBLE',
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_comentario_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comentario_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_comentario_padre
    FOREIGN KEY (comentario_padre_id) REFERENCES comentario(id)
    ON DELETE SET NULL
);

ALTER TABLE comentario
  ADD CONSTRAINT chk_comentario_calificacion
  CHECK (calificacion IS NULL OR (calificacion >= 1 AND calificacion <= 5));

CREATE UNIQUE INDEX uq_comentario_calificacion_usuario
  ON comentario (publicacion_id, usuario_id)
  WHERE es_calificacion = TRUE;

-- FAVORITO
CREATE TABLE favorito (
  usuario_id     BIGINT NOT NULL,
  publicacion_id BIGINT NOT NULL,
  fecha_guardado TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, publicacion_id),
  CONSTRAINT fk_favorito_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_favorito_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion(id)
    ON DELETE CASCADE
);

-- NOTIFICACION
CREATE TABLE notificacion (
  id           BIGSERIAL PRIMARY KEY,
  usuario_id   BIGINT NOT NULL,
  tipo         notificacion_tipo_enum NOT NULL,
  titulo       VARCHAR(255) NOT NULL,
  mensaje      TEXT NOT NULL,
  leida        BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_envio  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notificacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON DELETE CASCADE
);

-- REVISION PUBLICACION (MODERACIÓN ADMIN GLOBAL)
CREATE TABLE revision_publicacion (
  id                 BIGSERIAL PRIMARY KEY,
  publicacion_id     BIGINT NOT NULL,
  revisor_admin_id   BIGINT NOT NULL,
  resultado          revision_resultado_enum NOT NULL,
  comentarios_revisor TEXT,
  fecha_revision     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_revision_publicacion_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_revision_publicacion_admin
    FOREIGN KEY (revisor_admin_id) REFERENCES admin_global(id)
    ON DELETE SET NULL
);

-- =========================================================
-- ÍNDICES ÚTILES
-- =========================================================

CREATE INDEX idx_usuario_tenant_id ON usuario (tenant_id);
CREATE INDEX idx_negocio_tenant_id ON negocio (tenant_id);
CREATE INDEX idx_negocio_owner_id ON negocio (owner_id);
CREATE INDEX idx_mesa_negocio_id ON mesa (negocio_id);
CREATE INDEX idx_reserva_negocio_id ON reserva (negocio_id);
CREATE INDEX idx_reserva_usuario_id ON reserva (usuario_id);
CREATE INDEX idx_reserva_fecha_reserva ON reserva (fecha_reserva);
CREATE INDEX idx_reserva_mesa_reserva_id ON reserva_mesa (reserva_id);
CREATE INDEX idx_reserva_mesa_mesa_id ON reserva_mesa (mesa_id);
CREATE INDEX idx_publicacion_negocio_id ON publicacion (negocio_id);
CREATE INDEX idx_publicacion_autor_id ON publicacion (autor_id);
CREATE INDEX idx_media_publicacion_id ON media (publicacion_id);
CREATE INDEX idx_categoria_tenant_id ON categoria (tenant_id);
CREATE INDEX idx_comentario_publicacion_id ON comentario (publicacion_id);
CREATE INDEX idx_comentario_usuario_id ON comentario (usuario_id);
CREATE INDEX idx_comentario_padre_id ON comentario (comentario_padre_id);
CREATE INDEX idx_favorito_usuario_id ON favorito (usuario_id);
CREATE INDEX idx_favorito_publicacion_id ON favorito (publicacion_id);
CREATE INDEX idx_notificacion_usuario_id ON notificacion (usuario_id);

-- =========================================================
-- TRIGGERS DE CONSISTENCIA MULTI-TENANT
-- =========================================================

-- Garantizar que negocio.tenant_id = usuario.tenant_id (owner)
CREATE OR REPLACE FUNCTION trg_negocio_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id BIGINT;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM usuario
  WHERE id = NEW.owner_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'El owner_id % no tiene tenant asignado', NEW.owner_id;
  END IF;

  IF NEW.tenant_id IS NULL OR NEW.tenant_id <> v_tenant_id THEN
    RAISE EXCEPTION 'Inconsistencia de tenant: negocio.tenant_id % debe coincidir con usuario.tenant_id %',
      NEW.tenant_id, v_tenant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_negocio_tenant_consistency
BEFORE INSERT OR UPDATE ON negocio
FOR EACH ROW
EXECUTE FUNCTION trg_negocio_tenant_consistency();

-- Garantizar que publicacion pertenece al mismo tenant de negocio y autor
CREATE OR REPLACE FUNCTION trg_publicacion_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_negocio BIGINT;
  v_tenant_autor   BIGINT;
BEGIN
  SELECT tenant_id INTO v_tenant_negocio
  FROM negocio
  WHERE id = NEW.negocio_id;

  SELECT tenant_id INTO v_tenant_autor
  FROM usuario
  WHERE id = NEW.autor_id;

  IF v_tenant_negocio IS NULL OR v_tenant_autor IS NULL THEN
    RAISE EXCEPTION 'Negocio o autor sin tenant asignado';
  END IF;

  IF v_tenant_negocio <> v_tenant_autor THEN
    RAISE EXCEPTION 'Inconsistencia de tenant entre negocio (%) y autor (%)',
      v_tenant_negocio, v_tenant_autor;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_publicacion_tenant_consistency
BEFORE INSERT OR UPDATE ON publicacion
FOR EACH ROW
EXECUTE FUNCTION trg_publicacion_tenant_consistency();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- =========================================================

-- Convención:
--   app.tenant_id        -> BIGINT del tenant actual (NULL para admin_global / visitante)
--   app.is_admin_global  -> 'true' / 'false' como texto

-- Helpers en las políticas:
--   COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
--   current_setting('app.tenant_id', true)  -- puede ser NULL

-- Habilitar RLS
ALTER TABLE usuario               ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocio               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva_mesa          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria             ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicacion           ENABLE ROW LEVEL SECURITY;
ALTER TABLE media                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicacion_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario            ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorito              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion          ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_publicacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant                ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_global          ENABLE ROW LEVEL SECURITY;

-- 1) admin_global: normalmente solo accesible desde contexto de admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_global'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY admin_global_all ON admin_global
      USING ( COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true' )
      WITH CHECK ( COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true' );
    $pol$;
  END IF;
END$$;

-- 2) tenant: visible solo para admin_global (o si quieres extender luego para oferentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenant'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY tenant_admin_only ON tenant
      USING ( COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true' )
      WITH CHECK ( COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true' );
    $pol$;
  END IF;
END$$;

-- 3) usuario: admin ve todo; por defecto se filtra por tenant_id si está seteado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'usuario'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY usuario_tenant_isolation ON usuario
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
        OR (
          current_setting('app.tenant_id', true) IS NULL
          AND tenant_id IS NULL
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
        OR (
          current_setting('app.tenant_id', true) IS NULL
          AND tenant_id IS NULL
        )
      );
    $pol$;
  END IF;
END$$;

-- 4) negocio: por tenant, admin ve todo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'negocio'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY negocio_tenant_isolation ON negocio
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 4.1) mesa: por tenant del negocio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mesa'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY mesa_tenant_isolation ON mesa
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = mesa.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = mesa.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 4.2) reserva: por tenant del negocio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reserva'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY reserva_tenant_isolation ON reserva
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = reserva.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = reserva.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 4.3) reserva_mesa: por tenant del negocio via mesa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reserva_mesa'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY reserva_mesa_tenant_isolation ON reserva_mesa
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM mesa m
          JOIN negocio n ON n.id = m.negocio_id
          WHERE m.id = reserva_mesa.mesa_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM mesa m
          JOIN negocio n ON n.id = m.negocio_id
          WHERE m.id = reserva_mesa.mesa_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 5) categoria: por tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categoria'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY categoria_tenant_isolation ON categoria
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR (
          current_setting('app.tenant_id', true) IS NOT NULL
          AND tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 6) publicacion: se aisla por el tenant del negocio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'publicacion'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY publicacion_tenant_isolation ON publicacion
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = publicacion.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM negocio n
          WHERE n.id = publicacion.negocio_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 7) media: por publicacion -> negocio -> tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY media_tenant_isolation ON media
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = media.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = media.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 8) publicacion_categoria
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'publicacion_categoria'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY publicacion_categoria_tenant_isolation ON publicacion_categoria
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = publicacion_categoria.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = publicacion_categoria.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 9) comentario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comentario'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY comentario_tenant_isolation ON comentario
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = comentario.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = comentario.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 10) favorito
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'favorito'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY favorito_tenant_isolation ON favorito
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = favorito.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = favorito.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      );
    $pol$;
  END IF;
END$$;

-- 11) notificacion: por usuario -> tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notificacion'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY notificacion_tenant_isolation ON notificacion
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM usuario u
          WHERE u.id = notificacion.usuario_id
            AND (
              (current_setting('app.tenant_id', true) IS NOT NULL
               AND u.tenant_id = current_setting('app.tenant_id')::BIGINT)
              OR (current_setting('app.tenant_id', true) IS NULL
                  AND u.tenant_id IS NULL)
            )
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM usuario u
          WHERE u.id = notificacion.usuario_id
            AND (
              (current_setting('app.tenant_id', true) IS NOT NULL
               AND u.tenant_id = current_setting('app.tenant_id')::BIGINT)
              OR (current_setting('app.tenant_id', true) IS NULL
                  AND u.tenant_id IS NULL)
            )
        )
      );
    $pol$;
  END IF;
END$$;

-- 12) revision_publicacion: admin_global y tenant de la publicación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'revision_publicacion'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY revision_publicacion_policy ON revision_publicacion
      USING (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
        OR EXISTS (
          SELECT 1
          FROM publicacion p
          JOIN negocio n ON n.id = p.negocio_id
          WHERE p.id = revision_publicacion.publicacion_id
            AND current_setting('app.tenant_id', true) IS NOT NULL
            AND n.tenant_id = current_setting('app.tenant_id')::BIGINT
        )
      )
      WITH CHECK (
        COALESCE(current_setting('app.is_admin_global', true), 'false') = 'true'
      );
    $pol$;
  END IF;
END$$;
