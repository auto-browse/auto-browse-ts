import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sessionManager } from '../browser';

// Tool to click elements
export const clickTool = tool(
    async ({ target }) => {
        try
        {
            const page = sessionManager.getPage();
            const element = await page.getByRole('button', { name: target })
                .or(page.getByRole('link', { name: target }))
                .or(page.getByText(target, { exact: false }))
                .or(page.getByLabel(target, { exact: false }))
                .or(page.getByTestId(target));

            await element.click();
            return "Successfully clicked the element";
        } catch (error)
        {
            return `Failed to click: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    },
    {
        name: "click",
        description: "Click an element on the page by its text, role, label, or test ID",
        schema: z.object({
            target: z.string().describe("The text or identifier of the element to click"),
        }),
    }
);
