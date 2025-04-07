import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test } from '@playwright/test';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for getting text from elements with descriptions for the AI model
 */
const getTextSchema = z.object({
    element: z
        .string()
        .describe('Human-readable element description for the target element'),
    ref: z
        .string()
        .describe('Element reference from page snapshot to locate the element'),
});

export const browser_get_text = tool(
    async ({ element, ref }) => {
        try
        {
            console.log(`[Get Text Tool] Starting operation:`, {
                element,
                ref,
            });

            const result = await test.step(`Get text from "${element}"`, async () => {
                return await runAndWait(
                    context,
                    `Got text from "${element}"`,
                    async () => {
                        const locator = context.refLocator(ref);
                        const text = (await locator.innerText()) || '';
                        return text;
                    },
                    false,
                );
            });

            console.log(
                `[Get Text Tool] Operation completed with result:`,
                result,
            );
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to get text: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Get Text Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: 'getText',
        description: 'Get text content from an element on the page',
        schema: getTextSchema,
    },
);
