import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test } from '@playwright/test';
import { context } from '../browser/context';
import { run } from './utils';

/**
 * Schema with dummy property to satisfy Gemini's API requirement for non-empty object properties
 */
const snapshotSchema = z.object({
  _: z.string().optional().describe('No parameters required for this operation')
});

export const browser_snapshot = tool(
  async () => {
    try {
      console.log(`[Aria Snapshot] Starting snapshot operation`);
      const result =
        await test.step(`Capture Accessibility Snapshot`, async () => {
          return await run(context, {
            callback: async () => {}, // Empty callback since we just want the snapshot
            captureSnapshot: true
          });
        });

      console.log(`[Aria Snapshot] Operation completed successfully`);
      return result;
    } catch (error) {
      const errorMessage = `Failed to capture snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Aria Snapshot] Error:`, errorMessage);
      return errorMessage;
    }
  },
  {
    name: 'aria_snapshot',
    description:
      'Capture accessibility snapshot of the current page for better understanding of page structure',
    schema: snapshotSchema
  }
);
