import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { context } from '../browser/context';
import os from 'os';
import path from 'path';

/**
 * Schema for saving PDF
 * Includes dummy property to satisfy Gemini's API requirement for non-empty object properties
 */
const pdfSchema = z.object({
  _: z.string().optional().describe('No parameters required for this operation')
});

export const browser_save_pdf = tool(
  async () => {
    try {
      console.log(`[Save PDF Tool] Starting operation`);

      const page = context.existingPage();
      const fileName = path.join(
        os.tmpdir(),
        `/page-${new Date().toISOString()}.pdf`
      );

      console.log(`[Save PDF Tool] Saving PDF to:`, fileName);
      await page.pdf({ path: fileName });
      console.log(`[Save PDF Tool] Operation successful`);

      return `Saved as ${fileName}`;
    } catch (error) {
      const errorMessage = `Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Save PDF Tool] Error:`, errorMessage);
      return errorMessage;
    }
  },
  {
    name: 'savePdf',
    description: 'Save page as PDF',
    schema: pdfSchema
  }
);
