import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { runAndWait } from './utils';
import { context } from '../browser/context';

/**
 * Schema for choosing files to upload
 */
const chooseFileSchema = z.object({
    paths: z
        .array(z.string())
        .describe(
            'The absolute paths to the files to upload. Can be a single file or multiple files.',
        ),
});

export const browser_choose_file = tool(
    async ({ paths }) => {
        try {
            console.log(`[Choose File Tool] Starting operation:`, { paths });

            const result = await runAndWait(
                context,
                `Chose files ${paths.join(', ')}`,
                async () => {
                    console.log(`[Choose File Tool] Submitting file chooser`);
                    await context.submitFileChooser(paths);
                    console.log(`[Choose File Tool] Operation successful`);
                },
                true,
            );

            console.log(`[Choose File Tool] Operation completed`);
            return result;
        } catch (error) {
            const errorMessage = `Failed to choose files: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Choose File Tool] Error:`, errorMessage);
            return errorMessage;
        }
    },
    {
        name: 'chooseFile',
        description: 'Choose one or multiple files to upload',
        schema: chooseFileSchema,
    },
);
