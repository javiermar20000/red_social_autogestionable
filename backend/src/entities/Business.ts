import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum NegocioTipo {
  RESTAURANTE = 'RESTAURANTE',
  CAFETERIA = 'CAFETERIA',
  BAR = 'BAR',
  FOODTRUCK = 'FOODTRUCK',
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

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;
}
