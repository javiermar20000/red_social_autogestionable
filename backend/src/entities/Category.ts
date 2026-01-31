import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum CategoriaTipo {
  ESPRESSO = 'ESPRESSO',
  AMERICANO = 'AMERICANO',
  CAPPUCCINO = 'CAPPUCCINO',
  LATTE = 'LATTE',
  MOCHA = 'MOCHA',
  FLAT_WHITE = 'FLAT_WHITE',
  MACCHIATO = 'MACCHIATO',
  COLD_BREW = 'COLD_BREW',
  AFFOGATO = 'AFFOGATO',
  PIZZA = 'PIZZA',
  SUSHI = 'SUSHI',
  HAMBURGUESAS = 'HAMBURGUESAS',
  PASTAS = 'PASTAS',
  COMIDA_MEXICANA = 'COMIDA_MEXICANA',
  COMIDA_CHINA = 'COMIDA_CHINA',
  COMIDA_INDIAN = 'COMIDA_INDIAN',
  POSTRES = 'POSTRES',
  SANDWICHES = 'SANDWICHES',
  ENSALADAS = 'ENSALADAS',
  CERVEZAS = 'CERVEZAS',
  VINOS = 'VINOS',
  COCTELES = 'COCTELES',
  DESTILADOS = 'DESTILADOS',
  BEBIDAS_SIN_ALCOHOL = 'BEBIDAS_SIN_ALCOHOL',
  TAPAS = 'TAPAS',
  PICOTEO = 'PICOTEO',
  HOT_DOGS = 'HOT_DOGS',
  TACOS = 'TACOS',
  BURRITOS = 'BURRITOS',
  AREPAS = 'AREPAS',
  EMPANADAS = 'EMPANADAS',
  PAPAS_FRITAS = 'PAPAS_FRITAS',
  WRAPS = 'WRAPS',
  BROCHETAS = 'BROCHETAS',
  HELADOS = 'HELADOS',
}

@Entity({ name: 'categoria' })
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId!: string;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'slug', length: 100 })
  slug!: string;

  @Column({
    name: 'tipo_categoria',
    type: 'enum',
    enum: CategoriaTipo,
    enumName: 'categoria_tipo_enum',
  })
  type!: CategoriaTipo;
}
