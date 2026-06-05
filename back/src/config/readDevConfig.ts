import fs from 'fs';
import path from 'path';

export interface DevConfig {
  useExpoGo: boolean;
  useLocalDb: boolean;
  ipLocal: string;
  configPath: string;
}

function readConfigFile(): { content: string; configPath: string } {
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', '_config.js'),
    path.resolve(process.cwd(), '..', '_config.js'),
    path.resolve(process.cwd(), '_config.js'),
  ];

  const configPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!configPath) {
    throw new Error('_config.js not found. Expected at monorepo root.');
  }

  return { content: fs.readFileSync(configPath, 'utf8'), configPath };
}

function readBoolean(content: string, key: string): boolean {
  const match = content.match(new RegExp(`export const ${key}\\s*=\\s*(true|false)`));
  if (!match) {
    throw new Error(`${key} is not defined in _config.js`);
  }
  return match[1] === 'true';
}

function readString(content: string, key: string): string {
  const match = content.match(new RegExp(`export const ${key}\\s*=\\s*['"]([^'"]+)['"]`));
  if (!match) {
    throw new Error(`${key} is not defined in _config.js`);
  }
  return match[1];
}

/**
 * Reads shared dev toggles from monorepo root _config.js.
 */
export function readDevConfig(): DevConfig {
  const { content, configPath } = readConfigFile();

  return {
    useExpoGo: readBoolean(content, 'USE_EXPO_GO'),
    useLocalDb: readBoolean(content, 'USE_LOCAL_DB'),
    ipLocal: readString(content, 'IP_LOCAL'),
    configPath,
  };
}

/**
 * Public backend URL without /api — same host logic as front API_URL.
 */
export function resolveBaseUrl(): string {
  const { useExpoGo, ipLocal } = readDevConfig();
  const port = process.env.PORT || '3000';
  const host = useExpoGo ? ipLocal : 'localhost';
  return `http://${host}:${port}`;
}

/**
 * Backend API base URL — mirrors front API_URL.
 */
export function resolveApiUrl(): string {
  return `${resolveBaseUrl()}/api`;
}
