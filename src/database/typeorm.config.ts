import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Activation } from '../entities/activation.entity';
import { Promocode } from '../entities/promocode.entity';

const parseBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'promocode',
  entities: [Promocode, Activation],
  synchronize: parseBoolean(process.env.TYPEORM_SYNCHRONIZE, false),
  logging: parseBoolean(process.env.TYPEORM_LOGGING, false),
  ssl: parseBoolean(process.env.DB_SSL, false)
    ? { rejectUnauthorized: false }
    : false,
});

export const getDataSourceOptions = (): DataSourceOptions =>
  getTypeOrmConfig() as DataSourceOptions;
