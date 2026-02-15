import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AdPlanCode {
  INICIO = 'INICIO',
  IMPULSO = 'IMPULSO',
  DOMINIO = 'DOMINIO',
}

export enum AdPlanStatus {
  ACTIVA = 'ACTIVA',
  PENDIENTE = 'PENDIENTE',
  CANCELADA = 'CANCELADA',
  EXPIRADA = 'EXPIRADA',
}

@Entity({ name: 'suscripcion_publicidad' })
export class AdPlanSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId!: string;

  @Column({ name: 'usuario_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'plan_codigo', type: 'enum', enum: AdPlanCode, enumName: 'suscripcion_publicidad_plan_enum' })
  planCode!: AdPlanCode;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: AdPlanStatus,
    enumName: 'suscripcion_publicidad_estado_enum',
    default: AdPlanStatus.PENDIENTE,
  })
  status!: AdPlanStatus;

  @Column({ name: 'mp_preapproval_id', length: 120, nullable: true })
  mpPreapprovalId!: string | null;

  @Column({ name: 'mp_plan_id', length: 120, nullable: true })
  mpPlanId!: string | null;

  @Column({ name: 'mp_status', length: 50, nullable: true })
  mpStatus!: string | null;

  @Column({ name: 'fecha_inicio', type: 'timestamptz', nullable: true })
  startDate!: Date | null;

  @Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  updatedAt!: Date;
}
