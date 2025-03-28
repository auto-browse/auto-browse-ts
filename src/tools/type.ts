import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { sessionManager } from '../browser';
import type { Context } from '../browser/context';

/**
 * Schema for typing text into elements with descriptions for the AI model
 */
const typeSchema = z.object({
    element: z.string().describe('Human-readable element description for the target field'),
    ref: z.string().describe('Element reference from page snapshot to locate the field'),
    text: z.string().describe('The text to type into the element'),
    submit: z.boolean().optional().describe('Whether to submit by pressing Enter after typing').default(false)
});

export const typeTool = tool(
    async ({ element, ref, text, submit }) => {
        try
        {
            console.log(`[Type Tool] Starting operation:`, { element, ref, text, submit });

            const context = {
                existingPage: () => sessionManager.getPage(),
                refLocator: (ref: string) => sessionManager.getPage().locator(ref)
            } as Context;

            const result = await runAndWait(
                context,
                `Typed "${text}" into "${element}"`,
                async () => {
                    const locator = context.refLocator(ref);
                    console.log(`[Type Tool] Filling text into element`);
                    await locator.fill(text);

                    if (submit)
                    {
                        console.log(`[Type Tool] Submitting with Enter key`);
                        await locator.press('Enter');
                    }
                    console.log(`[Type Tool] Operation successful`);
                },
                true
            );

            console.log(`[Type Tool] Operation completed with result:`, result);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to type: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Type Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "type",
        description: "Type text into an editable element on the page",
        schema: typeSchema
    }
);
