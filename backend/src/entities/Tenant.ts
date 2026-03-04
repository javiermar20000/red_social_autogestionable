import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TenantEstado {
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  RECHAZADO = 'RECHAZADO',
}

@Entity({ name: 'tenant' })
export class Tenant {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ length: 255 })
  nombre!: string;

  @Column({ length: 255, nullable: true })
  dominio!: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: TenantEstado,
    enumName: 'tenant_estado_enum',
    default: TenantEstado.PENDIENTE_VALIDACION,
  })
  estado!: TenantEstado;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion!: Date;

  @Column({ name: 'creador_oferente_id', type: 'bigint' })
  creadorOferenteId!: string;

  @Column({ name: 'validador_admin_id', type: 'bigint', nullable: true })
  validadorAdminId!: string | null;
}
