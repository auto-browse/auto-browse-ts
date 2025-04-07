import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test } from '@playwright/test';
import { runAndWait } from './utils';
import { context } from '../browser/context';

const typeSchema = z.object({
    element: z
        .string()
        .describe('Human-readable element description for the target field'),
    ref: z
        .string()
        .describe('Element reference from page snapshot to locate the field'),
    text: z.string().describe('The text to type into the element'),
    submit: z
        .boolean()
        .optional()
        .describe('Whether to submit by pressing Enter after typing'),
});

export const browser_type = tool(
    async ({ element, ref, text, submit }) => {
        try
        {
            console.log(`[Type Tool] Starting operation:`, { element, ref, text, submit });
            const result = await test.step(`Fill "${text}" in "${element}"`, async () => {
                return await runAndWait(
                    context,
                    `Typed "${text}" into "${element}"`,
                    async () => {
                        const locator = context.refLocator(ref);
                        await locator.fill(text);
                        if (submit)
                        {
                            await locator.press('Enter');
                        }
                    },
                    true,
                );
            });
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
        name: 'type',
        description: 'Type text into an editable element on the page',
        schema: typeSchema,
    },
);