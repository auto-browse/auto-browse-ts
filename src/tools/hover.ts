import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for hovering over elements with descriptions for the AI model
 */
const hoverSchema = z.object({
    element: z.string().describe('Human-readable element description for the target element'),
    ref: z.string().describe('Element reference from page snapshot to locate the element')
});

export const hoverTool = tool(
    async ({ element, ref }) => {
        try
        {
            console.log(`[Hover Tool] Starting operation:`, { element, ref });

            const result = await runAndWait(
                context,
                `Hovered over "${element}"`,
                async () => {
                    const locator = context.refLocator(ref);
                    console.log(`[Hover Tool] Hovering over element`);
                    await locator.hover();
                    console.log(`[Hover Tool] Operation successful`);
                },
                true
            );

            console.log(`[Hover Tool] Operation completed with result:`, result);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to hover: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Hover Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "hover",
        description: "Hover over an element on the page",
        schema: hoverSchema
    }
);
