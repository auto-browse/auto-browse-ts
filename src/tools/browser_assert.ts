import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test, expect } from '@playwright/test';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for assertions with descriptions for the AI model
 */
const assertSchema = z.object({
    element: z
        .string()
        .describe('Human-readable element description for the target element'),
    ref: z
        .string()
        .describe('Element reference from page snapshot to locate the element'),
    assertion: z
        .string()
        .describe(
            'Type of assertion to perform (e.g., "isVisible", "hasText", "isEnabled", "isChecked")',
        ),
    expected: z
        .string()
        .optional()
        .describe('Expected value for text assertions'),
});

export const browser_assert = tool(
    async ({ element, ref, assertion, expected }) => {
        try
        {
            console.log(`[Assert Tool] Starting operation:`, {
                element,
                ref,
                assertion,
                expected,
            });

            const result = await test.step(
                `Assert "${element}" ${assertion}${expected ? ` equals "${expected}"` : ''}`,
                async () => {
                    return await runAndWait(
                        context,
                        `Asserted "${element}" ${assertion}${expected ? ` equals "${expected}"` : ''}`,
                        async () => {
                            const locator = context.refLocator(ref);
                            console.log(`[Assert Tool] Performing assertion`);

                            // Create descriptive message for both success and error cases
                            const message = `${element} ${assertion} ${expected || ''}`;

                            switch (assertion.toLowerCase())
                            {
                                case 'isvisible':
                                    await expect(locator, message).toBeVisible();
                                    return message;
                                case 'hastext':
                                    if (!expected)
                                        throw new Error(
                                            'Expected value required for hasText assertion',
                                        );
                                    await expect(locator, message).toHaveText(expected);
                                    return message;
                                case 'isenabled':
                                    await expect(locator, message).toBeEnabled();
                                    return message;
                                case 'ischecked':
                                    await expect(locator, message).toBeChecked();
                                    return message;
                                default:
                                    throw new Error(
                                        `Unsupported assertion type: ${assertion}`,
                                    );
                            }
                        },
                        true,
                    );
                },
            );

            console.log(`[Assert Tool] Operation completed`);
            return result;
        } catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[Assert Tool] Error: ${errorMessage}`);
            return errorMessage;

        }
    },
    {
        name: 'assert',
        description:
            "Assert conditions on elements using Playwright's assertions",
        schema: assertSchema,
    },
);
