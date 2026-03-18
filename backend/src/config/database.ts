import knex, { Knex } from 'knex';
import path from 'path';
import { env } from './env';

const isTest = env.nodeEnv === 'test';

const connection: Knex.PgConnectionConfig = isTest
  ? {
      host: env.testDb.host,
      port: env.testDb.port,
      database: env.testDb.name,
      user: env.testDb.user,
      password: env.testDb.password,
    }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    };

const db: Knex = knex({
  client: 'pg',
  connection,
  pool: { min: 0, max: isTest ? 5 : 10 },
  migrations: {
    directory: path.resolve(__dirname, '../db/migrations'),
    extension: 'ts',
  },
});

export default db;
