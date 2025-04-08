import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { test } from '@playwright/test';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for drag and drop operations with descriptions for the AI model
 */
const dragSchema = z.object({
  startElement: z
    .string()
    .describe(
      'Human-readable source element description for the element to drag'
    ),
  startRef: z
    .string()
    .describe(
      'Source element reference from page snapshot to locate the draggable element'
    ),
  endElement: z
    .string()
    .describe('Human-readable target element description for the drop target'),
  endRef: z
    .string()
    .describe(
      'Target element reference from page snapshot to locate the drop target'
    )
});

export const browser_drag = tool(
  async ({ startElement, startRef, endElement, endRef }) => {
    try {
      console.log(`[Drag Tool] Starting operation:`, {
        startElement,
        startRef,
        endElement,
        endRef
      });

      const result =
        await test.step(`Drag "${startElement}" to "${endElement}"`, async () => {
          return await runAndWait(
            context,
            `Dragged "${startElement}" to "${endElement}"`,
            async () => {
              const startLocator = context.refLocator(startRef);
              const endLocator = context.refLocator(endRef);
              await startLocator.dragTo(endLocator);
            },
            true
          );
        });

      console.log(`[Drag Tool] Operation completed with result:`, result);
      return result;
    } catch (error) {
      const errorMessage = `Failed to drag: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Drag Tool] Error:`, errorMessage);
      return errorMessage;
    }
  },
  {
    name: 'drag',
    description: 'Drag and drop an element to a target location on the page',
    schema: dragSchema
  }
);
