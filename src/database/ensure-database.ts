import { Client, type ClientConfig } from 'pg';

const parseBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const quoteIdentifier = (value: string): string =>
  `"${value.replaceAll('"', '""')}"`;

export const ensureDatabaseExists = async (): Promise<void> => {
  if (!parseBoolean(process.env.DB_AUTO_CREATE, false)) {
    return;
  }

  const targetDatabase = process.env.DB_NAME ?? 'promocode';
  const bootstrapDatabase = process.env.DB_BOOTSTRAP_DATABASE ?? 'postgres';

  const config: ClientConfig = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: bootstrapDatabase,
    ssl: parseBoolean(process.env.DB_SSL, false)
      ? { rejectUnauthorized: false }
      : false,
  };

  const client = new Client(config);

  await client.connect();

  try {
    const result = await client.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS "exists"',
      [targetDatabase],
    );

    if (result.rows[0]?.exists) {
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(targetDatabase)}`);
  } finally {
    await client.end();
  }
};
