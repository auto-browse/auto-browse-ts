/**
 * Configuration types and utilities for auto-browse-ts
 * Adapted from playwright-mcp to work with session manager
 */

import path from 'path';

export interface FullConfig {
  browser: {
    browserName: 'chromium' | 'firefox' | 'webkit';
    launchOptions?: any;
    contextOptions?: any;
    userDataDir?: string;
    isolated?: boolean;
    cdpEndpoint?: string;
    remoteEndpoint?: string;
    browserAgent?: string;
  };
  network?: {
    allowedOrigins?: string[];
    blockedOrigins?: string[];
  };
  saveTrace?: boolean;
  imageResponses?: 'allow' | 'omit' | 'auto';
}

export async function outputFile(config: FullConfig, filename: string): Promise<string> {
  // Create a downloads directory in the current working directory
  const downloadsDir = path.join(process.cwd(), 'downloads');

  // Ensure the directory exists
  const fs = await import('fs');
  await fs.promises.mkdir(downloadsDir, { recursive: true });

  return path.join(downloadsDir, filename);
}

// Default configuration for auto-browse-ts
export const defaultConfig: FullConfig = {
  browser: {
    browserName: 'chromium',
    launchOptions: {
      headless: false,
      channel: 'chrome'
    },
    contextOptions: {},
    isolated: false
  },
  imageResponses: 'auto',
  saveTrace: false
};
