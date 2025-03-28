import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sessionManager } from '../browser';

// Tool to type text
export const typeTool = tool(
    async ({ value, target }) => {
        try
        {
            const page = sessionManager.getPage();
            const element = await page.getByLabel(target, { exact: false })
                .or(page.getByPlaceholder(target, { exact: false }))
                .or(page.getByRole('textbox', { name: target }))
                .or(page.getByTestId(target));

            await element.fill(value);
            return "Successfully entered text";
        } catch (error)
        {
            return `Failed to type: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    },
    {
        name: "type",
        description: "Type text into an input field",
        schema: z.object({
            value: z.string().describe("The text to type"),
            target: z.string().describe("The input field identifier (label, placeholder, or test ID)"),
        }),
    }
);
