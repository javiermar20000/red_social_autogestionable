import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReservationPlanCode {
  RESERVAS = 'RESERVAS',
}

export enum ReservationPlanStatus {
  ACTIVA = 'ACTIVA',
  PENDIENTE = 'PENDIENTE',
  CANCELADA = 'CANCELADA',
  EXPIRADA = 'EXPIRADA',
}

@Entity({ name: 'suscripcion_reservas' })
export class ReservationPlanSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId!: string;

  @Column({ name: 'usuario_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'plan_codigo', type: 'enum', enum: ReservationPlanCode, enumName: 'suscripcion_reservas_plan_enum' })
  planCode!: ReservationPlanCode;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ReservationPlanStatus,
    enumName: 'suscripcion_reservas_estado_enum',
    default: ReservationPlanStatus.PENDIENTE,
  })
  status!: ReservationPlanStatus;

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
