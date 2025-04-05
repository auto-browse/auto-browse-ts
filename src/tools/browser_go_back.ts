import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for going back in browser history
 * Includes dummy property to satisfy Gemini's API requirement for non-empty object properties
 */
const goBackSchema = z.object({
    _: z.string().optional().describe('No parameters required for this operation')
});

export const browser_go_back = tool(
    async () => {
        try
        {
            console.log(`[Go Back Tool] Starting operation`);

            const result = await runAndWait(
                context,
                'Navigated back',
                async (page) => {
                    console.log(`[Go Back Tool] Going back to previous page`);
                    await page.goBack();
                    console.log(`[Go Back Tool] Operation successful`);
                },
                true
            );

            console.log(`[Go Back Tool] Operation completed`);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to go back: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Go Back Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "goBack",
        description: "Go back to the previous page",
        schema: goBackSchema
    }
);
