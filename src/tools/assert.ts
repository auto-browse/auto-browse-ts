/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { defineTool } from './tool.js';
import { expect } from '@playwright/test';
import * as javascript from '../javascript.js';

const pageAssertSchema = z.object({
  assertion: z.enum(['hasTitle', 'hasURL']).describe('Type of page assertion to perform'),
  expected: z.string().describe('Expected value for the assertion'),
});

const pageAssert = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_page_assert',
    title: 'Page assertion',
    description: 'Assert conditions on the page (title, URL)',
    inputSchema: pageAssertSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const page = tab.page;

    const code: string[] = [];
    let action: () => Promise<void>;

    switch (params.assertion) {
      case 'hasTitle':
        code.push(`// Assert page has title "${params.expected}"`);
        code.push(`await expect(page).toHaveTitle(${javascript.quote(params.expected)});`);
        action = async () => {
          await expect(page).toHaveTitle(params.expected);
        };
        break;

      case 'hasURL':
        code.push(`// Assert page has URL "${params.expected}"`);
        code.push(`await expect(page).toHaveURL(${javascript.quote(params.expected)});`);
        action = async () => {
          await expect(page).toHaveURL(params.expected);
        };
        break;

      default:
        throw new Error(`Unsupported page assertion: ${params.assertion}`);
    }

    return {
      code,
      action,
      captureSnapshot: false,
      waitForNetwork: false,
    };
  },
});

const elementAssertSchema = z.object({
  element: z.string().describe('Human-readable element description'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
  assertion: z.enum(['isVisible', 'hasText', 'isEnabled', 'isChecked']).describe('Type of element assertion to perform'),
  expected: z.string().optional().describe('Expected value for text assertions'),
});

const elementAssert = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert',
    title: 'Element assertion',
    description: 'Assert conditions on page elements (visibility, text, state)',
    inputSchema: elementAssertSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const snapshot = context.currentTabOrDie().snapshotOrDie();
    const locator = snapshot.refLocator(params);

    const code: string[] = [];
    let action: () => Promise<void>;

    switch (params.assertion) {
      case 'isVisible':
        code.push(`// Assert ${params.element} is visible`);
        code.push(`await expect(page.locator('aria-ref=${params.ref}')).toBeVisible();`);
        action = async () => {
          await expect(locator).toBeVisible();
        };
        break;

      case 'hasText':
        if (!params.expected) {
          throw new Error('Expected text value is required for hasText assertion');
        }
        code.push(`// Assert ${params.element} has text "${params.expected}"`);
        code.push(`await expect(page.locator('aria-ref=${params.ref}')).toHaveText(${javascript.quote(params.expected)});`);
        action = async () => {
          await expect(locator).toHaveText(params.expected!);
        };
        break;

      case 'isEnabled':
        code.push(`// Assert ${params.element} is enabled`);
        code.push(`await expect(page.locator('aria-ref=${params.ref}')).toBeEnabled();`);
        action = async () => {
          await expect(locator).toBeEnabled();
        };
        break;

      case 'isChecked':
        code.push(`// Assert ${params.element} is checked`);
        code.push(`await expect(page.locator('aria-ref=${params.ref}')).toBeChecked();`);
        action = async () => {
          await expect(locator).toBeChecked();
        };
        break;

      default:
        throw new Error(`Unsupported element assertion: ${params.assertion}`);
    }

    return {
      code,
      action,
      captureSnapshot: false,
      waitForNetwork: false,
    };
  },
});

const responseAssertSchema = z.object({
  assertion: z.enum(['isOK', 'hasStatus']).describe('Type of response assertion to perform'),
  expected: z.number().optional().describe('Expected status code for hasStatus assertion'),
});

const responseAssert = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_response_assert',
    title: 'Response assertion',
    description: 'Assert conditions on HTTP responses',
    inputSchema: responseAssertSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const requests = tab.requests();

    // Get the most recent response
    const responses = Array.from(requests.values()).filter(response => response !== null);
    if (responses.length === 0) {
      throw new Error('No responses available for assertion');
    }

    const lastResponse = responses[responses.length - 1]!;

    const code: string[] = [];
    let action: () => Promise<void>;

    switch (params.assertion) {
      case 'isOK':
        code.push(`// Assert response is OK (status 200-299)`);
        code.push(`expect(response.ok()).toBe(true);`);
        action = async () => {
          expect(lastResponse.ok()).toBe(true);
        };
        break;

      case 'hasStatus':
        if (!params.expected) {
          throw new Error('Expected status code is required for hasStatus assertion');
        }
        code.push(`// Assert response has status ${params.expected}`);
        code.push(`expect(response.status()).toBe(${params.expected});`);
        action = async () => {
          expect(lastResponse.status()).toBe(params.expected!);
        };
        break;

      default:
        throw new Error(`Unsupported response assertion: ${params.assertion}`);
    }

    return {
      code,
      action,
      captureSnapshot: false,
      waitForNetwork: false,
    };
  },
});

export default [
  pageAssert,
  elementAssert,
  responseAssert,
];
