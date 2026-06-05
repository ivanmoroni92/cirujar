import { readDevConfig } from './readDevConfig';

function describeMongoTarget(uri: string): string {
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const dbName = parsed.pathname.replace(/^\//, '') || '(default)';
    return `${parsed.hostname}:${parsed.port || '27017'}/${dbName}`;
  } catch {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }
}

/**
 * Picks MONGO_URI_LOCAL or MONGO_URI_CLOUD based on _config.js.
 */
export function resolveMongoUri(): string {
  const { useLocalDb, configPath } = readDevConfig();
  const envKey = useLocalDb ? 'MONGO_URI_LOCAL' : 'MONGO_URI_CLOUD';
  const mongoUri = process.env[envKey];

  if (!mongoUri) {
    throw new Error(`${envKey} is not defined in back/.env`);
  }

  console.log(`MongoDB: ${useLocalDb ? 'local' : 'nube'} (${envKey})`);
  console.log(`MongoDB target: ${describeMongoTarget(mongoUri)}`);
  console.log(`MongoDB toggle read from: ${configPath}`);
  return mongoUri;
}
