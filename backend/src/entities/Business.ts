import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum NegocioTipo {
  RESTAURANTE = 'RESTAURANTE',
  CAFETERIA = 'CAFETERIA',
  BAR = 'BAR',
  FOODTRUCK = 'FOODTRUCK',
  PASTELERIA = 'PASTELERIA',
  HELADERIA = 'HELADERIA',
  PANADERIA = 'PANADERIA',
}

export enum NegocioEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

@Entity({ name: 'negocio' })
export class Business {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId!: string;

  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId!: string;

  @Column({ name: 'nombre', length: 255 })
  name!: string;

  @Column({ name: 'tipo', type: 'enum', enum: NegocioTipo, enumName: 'negocio_tipo_enum' })
  type!: NegocioTipo;

  @Column({
    name: 'tipo_etiquetas',
    type: 'enum',
    enum: NegocioTipo,
    enumName: 'negocio_tipo_enum',
    array: true,
    nullable: true,
  })
  typeTags!: NegocioTipo[] | null;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'telefono', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'direccion', length: 255, nullable: true })
  address!: string | null;

  @Column({ name: 'ciudad', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'region', length: 100, nullable: true })
  region!: string | null;

  @Column({ name: 'amenidades', type: 'text', array: true, nullable: true })
  amenities!: string[] | null;

  @Column({ name: 'latitud', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude!: string | null;

  @Column({ name: 'longitud', type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude!: string | null;

  @Column({ name: 'estado', type: 'enum', enum: NegocioEstado, enumName: 'negocio_estado_enum', default: NegocioEstado.INACTIVO })
  status!: NegocioEstado;

  @Column({ name: 'horario_manana_inicio', type: 'time', nullable: true })
  morningStart!: string | null;

  @Column({ name: 'horario_manana_fin', type: 'time', nullable: true })
  morningEnd!: string | null;

  @Column({ name: 'horario_tarde_inicio', type: 'time', nullable: true })
  afternoonStart!: string | null;

  @Column({ name: 'horario_tarde_fin', type: 'time', nullable: true })
  afternoonEnd!: string | null;

  @Column({ name: 'dias_funcionamiento', type: 'int', array: true, nullable: true })
  operatingDays!: number[] | null;

  @Column({ name: 'feriados', type: 'text', array: true, nullable: true })
  holidayDates!: string[] | null;

  @Column({ name: 'vacaciones', type: 'jsonb', nullable: true })
  vacationRanges!: { start: string; end: string; label?: string | null }[] | null;

  @Column({ name: 'cierre_temporal_activo', type: 'boolean', default: false })
  temporaryClosureActive!: boolean;

  @Column({ name: 'cierre_temporal_desde', type: 'date', nullable: true })
  temporaryClosureStart!: string | null;

  @Column({ name: 'cierre_temporal_hasta', type: 'date', nullable: true })
  temporaryClosureEnd!: string | null;

  @Column({ name: 'cierre_temporal_mensaje', type: 'text', nullable: true })
  temporaryClosureMessage!: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;
}
