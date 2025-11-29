import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Business } from '../entities/Business.js';
import { Category } from '../entities/Category.js';
import { Tenant } from '../entities/Tenant.js';
import { Publication } from '../entities/Publication.js';
import { Media } from '../entities/Media.js';
import { PublicationCategory } from '../entities/PublicationCategory.js';
import { PublicationReview } from '../entities/PublicationReview.js';
import { AdminGlobal } from '../entities/AdminGlobal.js';

const {
  DB_HOST = 'db',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'red_social',
} = process.env;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  schema: 'public',
  entities: [AdminGlobal, User, Tenant, Business, Category, Publication, Media, PublicationCategory, PublicationReview],
  synchronize: false,
  logging: false,
});
