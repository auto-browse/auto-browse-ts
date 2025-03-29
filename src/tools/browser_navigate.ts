import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sessionManager } from '../browser';

// Tool to navigate to URLs
export const browser_navigate = tool(
    async ({ url }) => {
        try
        {
            const page = sessionManager.getPage();
            await page.goto(url);
            return "Successfully navigated to the page";
        } catch (error)
        {
            return `Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    },
    {
        name: "goto",
        description: "Navigate to a URL using Playwright",
        schema: z.object({
            url: z.string().describe("The URL to navigate to"),
        }),
    }
);
