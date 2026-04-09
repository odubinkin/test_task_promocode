import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './typeorm.config';

export const AppDataSource = new DataSource(getDataSourceOptions());

export default AppDataSource;
