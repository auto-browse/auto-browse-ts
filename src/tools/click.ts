import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for clicking elements with descriptions for the AI model
 */
const clickSchema = z.object({
    element: z.string().describe('Human-readable element description for the target element'),
    ref: z.string().describe('Element reference from page snapshot to locate the element')
});

export const clickTool = tool(
    async ({ element, ref }) => {
        try
        {
            console.log(`[Click Tool] Starting operation:`, { element, ref });

            const result = await runAndWait(
                context,
                `Clicked "${element}"`,
                async () => {
                    const locator = context.refLocator(ref);
                    console.log(`[Click Tool] Clicking element`);
                    await locator.click();
                    console.log(`[Click Tool] Operation successful`);
                },
                true
            );

            console.log(`[Click Tool] Operation completed with result:`, result);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to click: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Click Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "click",
        description: "Click an element on the page",
        schema: clickSchema
    }
);
