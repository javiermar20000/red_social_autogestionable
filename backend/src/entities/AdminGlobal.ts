import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'admin_global' })
export class AdminGlobal {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ length: 150 })
  nombre!: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fechaRegistro!: Date;

  @Column({ default: true })
  activo!: boolean;
}
