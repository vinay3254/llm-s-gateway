import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import dotenv from 'dotenv';
import { GatewayConfig } from './types.js';

// Load environment variables from .env if present
dotenv.config();

const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), 'config.yaml');

function interpolateEnvVars(content: string): string {
  return content.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName.trim()] || '';
  });
}

export function loadConfig(configPath = DEFAULT_CONFIG_PATH): GatewayConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const interpolated = interpolateEnvVars(raw);
  const parsed = yaml.parse(interpolated) as GatewayConfig;

  // Fallback defaults
  if (!parsed.server) {
    parsed.server = { port: 20128, host: '0.0.0.0' };
  }
  if (process.env.PORT) {
    parsed.server.port = parseInt(process.env.PORT, 10);
  }
  if (!parsed.default_reviewer) {
    parsed.default_reviewer = 'claude-sonnet-4-6';
  }

  return parsed;
}

export const config = loadConfig();
