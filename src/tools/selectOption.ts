import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for selecting options in dropdowns with descriptions for the AI model
 */
const selectOptionSchema = z.object({
    element: z.string().describe('Human-readable element description for the dropdown'),
    ref: z.string().describe('Element reference from page snapshot to locate the dropdown'),
    values: z.array(z.string()).describe('Array of values to select in the dropdown. Can be a single value or multiple values.')
});

export const selectOptionTool = tool(
    async ({ element, ref, values }) => {
        try
        {
            console.log(`[Select Option Tool] Starting operation:`, { element, ref, values });

            const result = await runAndWait(
                context,
                `Selected options in "${element}"`,
                async () => {
                    const locator = context.refLocator(ref);
                    console.log(`[Select Option Tool] Selecting values:`, values);
                    await locator.selectOption(values);
                    console.log(`[Select Option Tool] Operation successful`);
                },
                true
            );

            console.log(`[Select Option Tool] Operation completed with result:`, result);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to select options: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Select Option Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "selectOption",
        description: "Select one or more options in a dropdown element",
        schema: selectOptionSchema
    }
);
