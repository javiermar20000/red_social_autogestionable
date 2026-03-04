import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum MediaTipo {
  IMAGEN = 'IMAGEN',
  VIDEO = 'VIDEO',
}

@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'publicacion_id', type: 'bigint' })
  publicationId!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ name: 'tipo', type: 'enum', enum: MediaTipo, enumName: 'media_tipo_enum' })
  tipo!: MediaTipo;

  @Column({ name: 'orden', type: 'int', nullable: true })
  orden!: number | null;

  @Column({ name: 'descripcion', length: 255, nullable: true })
  descripcion!: string | null;
}
