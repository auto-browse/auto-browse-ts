/**
 * Browser context factory for auto-browse-ts
 * Integrates with session manager to use existing browser contexts
 */

import * as playwright from 'playwright';
import { sessionManager } from './session-manager';

export interface BrowserContextFactory {
  createContext(): Promise<{ browserContext: playwright.BrowserContext, close: () => Promise<void> }>;
}

/**
 * Browser context factory that uses the session manager's existing browser context
 * instead of creating new ones. This preserves the integration with auto-browse-ts
 * while enabling the sophisticated context management from playwright-mcp.
 */
export class SessionManagerContextFactory implements BrowserContextFactory {
  async createContext(): Promise<{ browserContext: playwright.BrowserContext, close: () => Promise<void> }> {
    // Get the existing browser context from session manager
    const browserContext = sessionManager.getContext();

    // Return the context with a no-op close function since the session manager
    // is responsible for managing the browser context lifecycle
    return {
      browserContext,
      close: async () => {
        // Don't actually close the context since it's managed by session manager
        // The session manager will handle cleanup when appropriate
      }
    };
  }
}

/**
 * Create a browser context factory that integrates with the session manager
 */
export function createSessionManagerContextFactory(): BrowserContextFactory {
  return new SessionManagerContextFactory();
}
