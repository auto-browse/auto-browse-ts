import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test, expect } from '@playwright/test';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for page-level assertions
 */
const pageAssertSchema = z.object({
  assertion: z
    .string()
    .describe(
      'Type of assertion to perform (e.g., "hasTitle", "hasURL", "isOK")'
    ),
  expected: z
    .string()
    .optional()
    .describe('Expected value for title/URL assertions')
});

export const browser_page_assert = tool(
  async ({ assertion, expected }) => {
    try {
      console.log(`[Page Assert Tool] Starting operation:`, {
        assertion,
        expected
      });

      const result =
        await test.step(`Assert page ${assertion}${expected ? ` equals "${expected}"` : ''}`, async () => {
          return await runAndWait(
            context,
            `Asserted page ${assertion}${expected ? ` equals "${expected}"` : ''}`,
            async () => {
              const page = context.existingPage();
              console.log(`[Page Assert Tool] Performing assertion`);

              // Create descriptive message for both success and error cases
              const message = `${assertion} ${expected || ''}`;

              switch (assertion.toLowerCase()) {
                case 'hastitle':
                  if (!expected)
                    throw new Error(
                      'Expected value required for hasTitle assertion'
                    );
                  await expect(page, message).toHaveTitle(expected);
                  return message;
                case 'hasurl':
                  if (!expected)
                    throw new Error(
                      'Expected value required for hasURL assertion'
                    );
                  await expect(page, message).toHaveURL(expected);
                  return message;
                case 'isok': {
                  // TODO: Implement response tracking in context
                  throw new Error('Response assertions not yet implemented');
                }
                default:
                  throw new Error(
                    `Unsupported page assertion type: ${assertion}`
                  );
              }
            },
            true
          );
        });

      console.log(`[Page Assert Tool] Operation completed`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Page Assert Tool] Error: ${errorMessage}`);
      return errorMessage;
    }
  },
  {
    name: 'page_assert',
    description:
      "Assert conditions on the page or response using Playwright's assertions",
    schema: pageAssertSchema
  }
);
