import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isTest = process.env['NODE_ENV'] === 'test';

const connection: Knex.PgConnectionConfig = isTest
  ? {
      host: process.env['TEST_DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['TEST_DB_PORT'] ?? '5432', 10),
      database: process.env['TEST_DB_NAME'] ?? 'kavabanga_test',
      user: process.env['TEST_DB_USER'] ?? 'postgres',
      password: process.env['TEST_DB_PASSWORD'] ?? '',
    }
  : {
      host: process.env['DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
      database: process.env['DB_NAME'] ?? 'kavabanga',
      user: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASSWORD'] ?? '',
    };

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: path.resolve(__dirname, '../db/migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.resolve(__dirname, '../db/seeds'),
    },
  },
  test: {
    client: 'pg',
    connection,
    migrations: {
      directory: path.resolve(__dirname, '../db/migrations'),
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, '../db/migrations'),
      extension: 'ts',
    },
  },
};

export default config;
module.exports = config;
