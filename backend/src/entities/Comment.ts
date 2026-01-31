import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ComentarioEstado {
  VISIBLE = 'VISIBLE',
  OCULTO = 'OCULTO',
  ELIMINADO = 'ELIMINADO',
}

@Entity({ name: 'comentario' })
export class Comment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'publicacion_id', type: 'bigint' })
  publicationId!: string;

  @Column({ name: 'usuario_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'comentario_padre_id', type: 'bigint', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text' })
  contenido!: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ComentarioEstado,
    enumName: 'comentario_estado_enum',
    default: ComentarioEstado.VISIBLE,
  })
  estado!: ComentarioEstado;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion!: Date;
}
