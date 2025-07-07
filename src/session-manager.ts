import { Page, BrowserContext } from '@playwright/test';

class SessionManager {
  private static instance: SessionManager;
  private currentPage: Page | null = null;
  private currentContext: BrowserContext | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  setPage(page: Page) {
    this.currentPage = page;
  }

  setContext(context: BrowserContext) {
    this.currentContext = context;
  }

  getPage(): Page {
    if (!this.currentPage) {
      throw new Error(
        'No active page found. Make sure you are running within a Playwright test.'
      );
    }
    return this.currentPage;
  }

  getContext(): BrowserContext {
    if (!this.currentContext) {
      throw new Error(
        'No active browser context found. Make sure you are running within a Playwright test.'
      );
    }
    return this.currentContext;
  }
}

export const sessionManager = SessionManager.getInstance();
