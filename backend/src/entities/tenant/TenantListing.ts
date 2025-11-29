import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TenantListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
  imageUrls!: string[];

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'numeric', nullable: true })
  price?: number;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
