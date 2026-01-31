import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'publicacion_categoria' })
export class PublicationCategory {
  @PrimaryColumn({ name: 'publicacion_id', type: 'bigint' })
  publicationId!: string;

  @PrimaryColumn({ name: 'categoria_id', type: 'bigint' })
  categoryId!: string;
}
