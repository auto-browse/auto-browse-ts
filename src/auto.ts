import { test as base } from '@playwright/test';
import { AutoConfig } from './types';
import { sessionManager, context } from './browser';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { createLLMModel } from './llm';
import {
    browser_click, browser_type, browser_get_text, browser_navigate, browser_snapshot,
    browser_hover, browser_drag, browser_select_option, browser_take_screenshot,
    browser_go_back, browser_wait, browser_press_key, browser_save_pdf, browser_choose_file,
    browser_go_forward, browser_assert
} from './tools';

// Extend base test to automatically track page
export const test = base.extend({
    page: async ({ page }, use) => {
        sessionManager.setPage(page);
        await use(page);
    }
});

// Initialize the LangChain agent with more detailed instructions
const initializeAgent = () => {
    const model = createLLMModel();

    const prompt =
        `You are a web automation assistant. When given a natural language instruction:
        - Always call the snapshot tool first to analyze the page structure and elements, so you can understand the context ad the elements available on the page to perform the requested action
        - For "get" or "get text" instructions, use the getText tool to retrieve content
        - For "click" instructions, use the click tool to interact with elements
        - For "type" instructions, use the type tool with the text and target
        - For navigation, use the goto tool with the provided URL
        - For understanding page structure and elements, use the aria_snapshot tool
        - For hover interactions, use the hover tool over elements
        - For drag and drop operations, use the drag tool between elements
        - For selecting options in dropdowns, use the selectOption tool
        - For taking screenshots, use the takeScreenshot tool
        - For going back in history, use the goBack tool
        - For waiting for elements, use the wait tool
        - For pressing keys, use the pressKey tool
        - For saving PDFs, use the savePDF tool
        - For choosing files, use the chooseFile tool
        - For verification and assertions, use the assert tool
        Return the operation result or content as requested.`;

    const agent = createReactAgent({
        llm: model,
        tools: [
            browser_click, browser_type, browser_get_text, browser_navigate, browser_snapshot,
            browser_hover, browser_drag, browser_select_option, browser_take_screenshot,
            browser_go_back, browser_wait, browser_press_key, browser_save_pdf, browser_choose_file, browser_assert,
            browser_go_forward
        ],
        stateModifier: prompt
    });

    return { agent };
};

// Main auto function that processes instructions
export async function auto(instruction: string, config?: AutoConfig): Promise<any> {
    console.log(`[Auto] Processing instruction: "${instruction}"`);

    if (config?.page)
    {
        sessionManager.setPage(config.page);
        console.log(`[Auto] Page set from config`);
    } else
    {
        try
        {
            sessionManager.getPage();
        } catch
        {
            // In standalone mode, create a new page
            console.log(`[Auto] No existing page, creating new page`);
            await context.createPage();
        }
    }

    // Create and invoke the agent
    console.log(`[Auto] Creating agent for instruction`);
    const { agent } = initializeAgent();
    const result = await agent.invoke({
        messages: [new HumanMessage(instruction)]
    });

    console.log("Agent result:", result);
    // Process agent result
    const response = result.messages?.[-1]?.content;
    console.log(`[Auto] Agent response:`, response);

    if (typeof response === 'string')
    {
        // If it's a success message, return null to match original behavior
        if (response.startsWith('Successfully'))
        {
            console.log(`[Auto] Detected success message, returning null`);
            return null;
        }
        console.log(`[Auto] Returning response string`);
        return response;
    }

    console.log(`[Auto] No string response, returning null`);
    return null;
}

// Export everything needed for the package
export { sessionManager } from './browser';
export * from './types';
