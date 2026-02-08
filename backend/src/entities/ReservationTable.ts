import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MesaEstado {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADA = 'OCUPADA',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

@Entity({ name: 'mesa' })
export class ReservationTable {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'negocio_id', type: 'bigint' })
  businessId!: string;

  @Column({ name: 'nombre', length: 120 })
  label!: string;

  @Column({ name: 'sillas', type: 'int', default: 1 })
  seats!: number;

  @Column({ name: 'estado', type: 'enum', enum: MesaEstado, enumName: 'mesa_estado_enum', default: MesaEstado.DISPONIBLE })
  status!: MesaEstado;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  updatedAt!: Date;
}
