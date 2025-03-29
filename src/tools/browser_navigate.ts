import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for navigation with descriptions for the AI model
 */
const navigateSchema = z.object({
    url: z.string().describe('The URL to navigate to')
});

export const browser_navigate = tool(
    async ({ url }) => {
        try
        {
            console.log(`[Navigate Tool] Starting operation:`, { url });

            const result = await runAndWait(
                context,
                `Navigated to "${url}"`,
                async (page) => {
                    console.log(`[Navigate Tool] Navigating to URL`);
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    // Cap load event to 5 seconds, the page is operational at this point
                    await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
                    console.log(`[Navigate Tool] Operation successful`);
                },
                true
            );

            console.log(`[Navigate Tool] Operation completed`);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Navigate Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "goto",
        description: "Navigate to a URL using Playwright",
        schema: navigateSchema
    }
);
