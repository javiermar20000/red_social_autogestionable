import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum PublicacionTipo {
  PROMOCION = 'PROMOCION',
  EVENTO = 'EVENTO',
  AVISO_GENERAL = 'AVISO_GENERAL',
}

export enum PublicacionEstado {
  BORRADOR = 'BORRADOR',
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  PUBLICADA = 'PUBLICADA',
  VENCIDA = 'VENCIDA',
  RECHAZADA = 'RECHAZADA',
}

@Entity({ name: 'publicacion' })
export class Publication {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'negocio_id', type: 'bigint' })
  businessId!: string;

  @Column({ name: 'autor_id', type: 'bigint' })
  authorId!: string;

  @Column({ length: 255 })
  titulo!: string;

  @Column({ type: 'text' })
  contenido!: string;

  @Column({
    name: 'precio',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  precio!: number | null;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: PublicacionTipo,
    enumName: 'publicacion_tipo_enum',
  })
  tipo!: PublicacionTipo;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: PublicacionEstado,
    enumName: 'publicacion_estado_enum',
    default: PublicacionEstado.BORRADOR,
  })
  estado!: PublicacionEstado;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion!: Date;

  @Column({ name: 'fecha_publicacion', type: 'timestamptz', nullable: true })
  fechaPublicacion!: Date | null;

  @Column({ name: 'fecha_fin_vigencia', type: 'timestamptz', nullable: true })
  fechaFinVigencia!: Date | null;

  @Column({ default: 0 })
  visitas!: number;

  @Column({ default: 0 })
  likes!: number;
}
