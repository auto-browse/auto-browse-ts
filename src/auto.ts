import { test as base } from '@playwright/test';
import { z } from 'zod';
import { AutoConfig } from './types';
import { sessionManager, context } from './browser';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { createLLMModel } from './llm';
import {
  browser_click,
  browser_type,
  browser_get_text,
  browser_navigate,
  browser_snapshot,
  browser_hover,
  browser_drag,
  browser_select_option,
  browser_take_screenshot,
  browser_go_back,
  browser_wait,
  browser_press_key,
  browser_save_pdf,
  browser_choose_file,
  browser_go_forward,
  browser_assert,
  browser_page_assert
} from './tools';

// Define response schema
const AutoResponseSchema = z.object({
  action: z
    .string()
    .describe('The type of action performed (assert, click, type, etc)'),
  error: z.string().describe('Error message if any, empty string if none'),
  output: z.string().describe('Raw output from the action')
});

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

  const prompt = `You are a web automation assistant. When given a natural language instruction:
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
        - While calling the verification and assertion tools, DO NOT assume or make up any expected values. Use the values as provided in the instruction only.
        - For verification and assertions like {"isVisible", "hasText", "isEnabled", "isChecked"}, use the browser_assert tool
        - For page assertions like {page title, current page url} use the browser_page_assert tools
        Return a stringified JSON object with exactly these fields:
            {
                "action": "<type of action performed>",
                "error": "<error message or empty string>",
                "output": "<your output message>"
            }`;

  const agent = createReactAgent({
    llm: model,
    tools: [
      browser_click,
      browser_type,
      browser_get_text,
      browser_navigate,
      browser_snapshot,
      browser_hover,
      browser_drag,
      browser_select_option,
      browser_take_screenshot,
      browser_go_back,
      browser_wait,
      browser_press_key,
      browser_save_pdf,
      browser_choose_file,
      browser_assert,
      browser_go_forward,
      browser_page_assert
    ],
    stateModifier: prompt,
    responseFormat: {
      prompt: `Return a stringified JSON object with exactly these fields:
            {
                "action": "<type of action performed>",
                "error": "<error message or empty string>",
                "output": "<your output message>"
            }`,
      schema: AutoResponseSchema
    }
  });

  return { agent };
};

// Main auto function that processes instructions
export async function auto(
  instruction: string,
  config?: AutoConfig
): Promise<any> {
  console.log(`[Auto] Processing instruction: "${instruction}"`);

  if (config?.page) {
    sessionManager.setPage(config.page);
    console.log(`[Auto] Page set from config`);
  } else {
    try {
      sessionManager.getPage();
    } catch {
      // In standalone mode, create a new page
      console.log(`[Auto] No existing page, creating new page`);
      await context.createPage();
    }
  }

  // Create and invoke the agent
  console.log(`[Auto] Creating agent for instruction`);
  const { agent } = initializeAgent();
  const response = await agent.invoke({
    messages: [new HumanMessage(instruction)]
  });
  const result = response.structuredResponse;
  // Process agent result
  try {
    console.log(`[Auto] Agent response:`, result);

    // Parse and validate the response
    const validatedResponse = AutoResponseSchema.parse(result);

    console.log(`[Auto] Action: ${validatedResponse.action}`);
    if (validatedResponse.error) {
      console.log(`[Auto] Error: ${validatedResponse.error}`);
      throw {
        error: validatedResponse.error,
        output: validatedResponse.output
      };
    }

    // Return the output or null if successful with no output
    return validatedResponse.output || null;
  } catch (error) {
    console.log(`[Auto] Error processing response:`, error);
    throw error;
  }
}

// Export everything needed for the package
export { sessionManager } from './browser';
export * from './types';
