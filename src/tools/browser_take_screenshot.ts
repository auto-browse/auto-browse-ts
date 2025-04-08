import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { context } from '../browser/context';
import type * as playwright from 'playwright';

/**
 * Schema for taking screenshots with descriptions for the AI model
 */
const screenshotSchema = z.object({
  raw: z
    .boolean()
    .optional()
    .describe(
      'Whether to return without compression (in PNG format). Default is false, which returns a JPEG image.'
    )
});

export const browser_take_screenshot = tool(
  async ({ raw }) => {
    try {
      console.log(`[Screenshot Tool] Starting operation:`, { raw });

      const page = context.existingPage();
      const options: playwright.PageScreenshotOptions = raw
        ? { type: 'png', scale: 'css' }
        : { type: 'jpeg', quality: 50, scale: 'css' };

      console.log(`[Screenshot Tool] Taking screenshot with options:`, options);
      const screenshot = await page.screenshot(options);
      console.log(`[Screenshot Tool] Screenshot captured successfully`);

      const result = {
        content: [
          {
            type: 'image',
            data: screenshot.toString('base64'),
            mimeType: raw ? 'image/png' : 'image/jpeg'
          }
        ]
      };

      console.log(`[Screenshot Tool] Operation completed successfully`);
      return result;
    } catch (error) {
      const errorMessage = `Failed to take screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Screenshot Tool] Error:`, errorMessage);
      return errorMessage;
    }
  },
  {
    name: 'screenshot',
    description:
      'Take a screenshot of the current page. Note: Use browser_snapshot for actions, not this tool.',
    schema: screenshotSchema
  }
);
