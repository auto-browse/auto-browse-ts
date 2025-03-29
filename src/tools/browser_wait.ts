import { tool } from "@langchain/core/tools";
import { z } from 'zod';

/**
 * Schema for waiting with descriptions for the AI model
 */
const waitSchema = z.object({
    time: z.number().describe('The time to wait in seconds')
});

export const browser_wait = tool(
    async ({ time }) => {
        try
        {
            console.log(`[Wait Tool] Starting operation:`, { time });

            // Cap wait time to 10 seconds like in common.ts
            const waitTime = Math.min(10000, time * 1000);
            console.log(`[Wait Tool] Waiting for ${waitTime}ms`);

            await new Promise(f => setTimeout(f, waitTime));

            console.log(`[Wait Tool] Operation successful`);
            return `Waited for ${time} seconds`;
        } catch (error)
        {
            const errorMessage = `Failed to wait: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Wait Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "wait",
        description: "Wait for a specified time in seconds",
        schema: waitSchema
    }
);
