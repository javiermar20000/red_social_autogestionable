import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column } from 'typeorm';

@Entity()
export class TenantVisit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listingId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
