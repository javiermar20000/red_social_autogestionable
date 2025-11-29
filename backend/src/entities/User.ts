import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RolUsuario {
  OFERENTE = 'OFERENTE',
  VISITANTE = 'VISITANTE',
}

export enum EstadoRegistroUsuario {
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity({ name: 'usuario' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint', nullable: true })
  tenantId!: string | null;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ length: 150 })
  nombre!: string;

  @Column({
    name: 'rol_usuario',
    type: 'enum',
    enum: RolUsuario,
    enumName: 'rol_usuario_enum',
    default: RolUsuario.VISITANTE,
  })
  rol!: RolUsuario;

  @Column({
    name: 'estado_registro',
    type: 'enum',
    enum: EstadoRegistroUsuario,
    enumName: 'usuario_estado_registro_enum',
    default: EstadoRegistroUsuario.PENDIENTE_VALIDACION,
  })
  estadoRegistro!: EstadoRegistroUsuario;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fechaRegistro!: Date;

  @Column({ name: 'fecha_validacion', type: 'timestamptz', nullable: true })
  fechaValidacion!: Date | null;

  @Column({ default: true })
  activo!: boolean;
}
