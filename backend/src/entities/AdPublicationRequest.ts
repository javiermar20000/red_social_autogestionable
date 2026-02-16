import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SolicitudPublicidadEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity({ name: 'solicitud_publicidad' })
export class AdPublicationRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId!: string;

  @Column({ name: 'usuario_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'suscripcion_id', type: 'bigint' })
  subscriptionId!: string;

  @Column({ name: 'publicacion_id', type: 'bigint' })
  publicationId!: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: SolicitudPublicidadEstado,
    enumName: 'solicitud_publicidad_estado_enum',
    default: SolicitudPublicidadEstado.PENDIENTE,
  })
  status!: SolicitudPublicidadEstado;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  updatedAt!: Date;
}
