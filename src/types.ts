import { Page, BrowserContext } from '@playwright/test';

export type AutoAction = {
  type: 'click' | 'type' | 'select' | 'navigate' | 'query';
  target?: string;
  value?: string;
};

export type AutoResult = {
  success: boolean;
  value?: any;
  error?: string;
};

export type AutoConfig = {
  page?: Page;
  context?: BrowserContext;
  timeout?: number;
};
