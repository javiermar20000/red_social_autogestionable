import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ReservaEstado {
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
}

export enum ReservaHorario {
  DESAYUNO = 'DESAYUNO',
  ALMUERZO = 'ALMUERZO',
  ONCE = 'ONCE',
  CENA = 'CENA',
}

@Entity({ name: 'reserva' })
export class Reservation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'negocio_id', type: 'bigint' })
  businessId!: string;

  @Column({ name: 'usuario_id', type: 'bigint', nullable: true })
  userId!: string | null;

  @Column({ name: 'codigo', length: 50, unique: true })
  code!: string;

  @Column({ name: 'titular_nombre', length: 200, nullable: true })
  holderName!: string | null;

  @Column({ name: 'nombre_invitado', length: 150, nullable: true })
  guestName!: string | null;

  @Column({ name: 'apellido_invitado', length: 150, nullable: true })
  guestLastName!: string | null;

  @Column({ name: 'rut_invitado', length: 20, nullable: true })
  guestRut!: string | null;

  @Column({ name: 'fecha_reserva', type: 'date' })
  date!: string;

  @Column({ name: 'hora_reserva', type: 'time' })
  time!: string;

  @Column({ name: 'horario', type: 'enum', enum: ReservaHorario, enumName: 'reserva_horario_enum' })
  schedule!: ReservaHorario;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ReservaEstado,
    enumName: 'reserva_estado_enum',
    default: ReservaEstado.CONFIRMADA,
  })
  status!: ReservaEstado;

  @Column({ name: 'monto', type: 'numeric', precision: 10, scale: 2, default: 0 })
  amount!: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;
}
