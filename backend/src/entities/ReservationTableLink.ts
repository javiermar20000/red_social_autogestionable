import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'reserva_mesa' })
export class ReservationTableLink {
  @PrimaryColumn({ name: 'reserva_id', type: 'bigint' })
  reservationId!: string;

  @PrimaryColumn({ name: 'mesa_id', type: 'bigint' })
  tableId!: string;

  @Column({ name: 'mesa_nombre', length: 120 })
  tableLabel!: string;

  @Column({ name: 'mesa_sillas', type: 'int' })
  tableSeats!: number;
}
