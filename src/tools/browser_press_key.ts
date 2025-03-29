import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for pressing keyboard keys
 */
const pressKeySchema = z.object({
    key: z.string().describe('Name of the key to press or a character to generate, such as `ArrowLeft` or `a`')
});

export const browser_press_key = tool(
    async ({ key }) => {
        try
        {
            console.log(`[Press Key Tool] Starting operation:`, { key });

            const result = await runAndWait(
                context,
                `Pressed key ${key}`,
                async (page) => {
                    console.log(`[Press Key Tool] Pressing key`);
                    await page.keyboard.press(key);
                    console.log(`[Press Key Tool] Operation successful`);
                },
                true
            );

            console.log(`[Press Key Tool] Operation completed`);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to press key: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Press Key Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "pressKey",
        description: "Press a key on the keyboard",
        schema: pressKeySchema
    }
);
