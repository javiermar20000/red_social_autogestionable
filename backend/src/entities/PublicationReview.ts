import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RevisionResultado {
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity({ name: 'revision_publicacion' })
export class PublicationReview {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'publicacion_id', type: 'bigint' })
  publicationId!: string;

  @Column({ name: 'revisor_admin_id', type: 'bigint' })
  adminId!: string;

  @Column({
    name: 'resultado',
    type: 'enum',
    enum: RevisionResultado,
    enumName: 'revision_resultado_enum',
  })
  resultado!: RevisionResultado;

  @Column({ name: 'comentarios_revisor', type: 'text', nullable: true })
  comentarios!: string | null;

  @CreateDateColumn({ name: 'fecha_revision', type: 'timestamptz' })
  fechaRevision!: Date;
}
