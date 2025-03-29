import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { sessionManager } from '../browser';

// Tool to get text content
export const browser_get_text = tool(
    async ({ target }) => {
        try
        {
            const page = sessionManager.getPage();

            // Try multiple strategies to find the text
            // 1. Try heading first
            const heading = await page.getByRole('heading', { name: new RegExp(target, 'i') });
            if (await heading.count() > 0)
            {
                return await heading.textContent() || '';
            }

            // 2. Try exact text match
            const exactText = await page.getByText(target, { exact: true });
            if (await exactText.count() > 0)
            {
                return await exactText.textContent() || '';
            }

            // 3. Try partial text match
            const partialText = await page.getByText(target, { exact: false });
            if (await partialText.count() > 0)
            {
                return await partialText.textContent() || '';
            }

            // 4. Try finding by test ID
            if (target.includes('product-'))
            {
                const element = await page.locator(`[data-testid="${target}"]`);
                if (await element.count() > 0)
                {
                    return await element.textContent() || '';
                }
            }

            // 5. Fallback to evaluating all elements
            const text = await page.evaluate((searchTarget: string) => {
                const elements = document.querySelectorAll('*');
                const targetLower = searchTarget.toLowerCase();

                for (const el of elements)
                {
                    const text = el.textContent || '';
                    if (text.toLowerCase().includes(targetLower))
                    {
                        return text.trim();
                    }
                }
                return null;
            }, target);

            if (text)
            {
                return text;
            }

            return `No element found containing text "${target}"`;
        } catch (error)
        {
            return `Failed to get text: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    },
    {
        name: "getText",
        description: "Get text content from an element on the page",
        schema: z.object({
            target: z.string().describe("The text or identifier to search for"),
        }),
    }
);
