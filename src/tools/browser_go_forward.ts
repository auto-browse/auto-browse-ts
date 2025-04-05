import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for going forward in browser history
 * Includes dummy property to satisfy Gemini's API requirement for non-empty object properties
 */
const goForwardSchema = z.object({
    _: z.string().optional().describe('No parameters required for this operation')
});

export const browser_go_forward = tool(
    async () => {
        try
        {
            console.log(`[Go Forward Tool] Starting operation`);

            const result = await runAndWait(
                context,
                'Navigated forward',
                async (page) => {
                    console.log(`[Go Forward Tool] Going forward to next page`);
                    await page.goForward();
                    console.log(`[Go Forward Tool] Operation successful`);
                },
                true
            );

            console.log(`[Go Forward Tool] Operation completed`);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to go forward: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Go Forward Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "goForward",
        description: "Go forward to the next page",
        schema: goForwardSchema
    }
);
