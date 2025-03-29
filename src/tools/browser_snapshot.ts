import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { context } from '../browser/context';
import { captureAriaSnapshot } from './utils';

const snapshotSchema = z.object({});

export const browser_snapshot = tool(
    async () => {
        try
        {
            console.log(`[Aria Snapshot] Starting snapshot operation`);
            const result = await captureAriaSnapshot(context);
            console.log(`[Aria Snapshot] Operation completed successfully`);
            return result;
        } catch (error)
        {
            const errorMessage = `Failed to capture snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Aria Snapshot] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: "aria_snapshot",
        description: "Capture accessibility snapshot of the current page for better understanding of page structure",
        schema: snapshotSchema
    }
);
