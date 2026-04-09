import { config } from 'dotenv';

const result = config({
  path: '.env.test',
  override: true,
  quiet: true,
});

if (result.error) {
  throw new Error(
    `Failed to load .env.test for e2e tests: ${result.error.message}`,
  );
}
