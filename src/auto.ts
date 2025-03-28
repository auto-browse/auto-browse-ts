import { test as base } from '@playwright/test';
import { AutoConfig } from './types';
import { sessionManager } from './browser';
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';
import { clickTool, typeTool, getTextTool, gotoTool } from './tools';

// Load environment variables
dotenv.config();

// Extend base test to automatically track page
export const test = base.extend({
    page: async ({ page }, use) => {
        sessionManager.setPage(page);
        await use(page);
    }
});

// Initialize the LangChain agent with more detailed instructions
const initializeAgent = () => {
    const model = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0,
        maxTokens: 1000
    });

    const agent = createReactAgent({
        llm: model,
        tools: [gotoTool, clickTool, typeTool, getTextTool]
    });

    // Add the system message for better instruction handling
    const systemMessage = new SystemMessage(
        `You are a web automation assistant. When given a natural language instructions use the tools to perform.`
    );

    return {
        agent,
        systemMessage
    };
};



// Main auto function that processes instructions
export async function auto(instruction: string, config?: AutoConfig): Promise<any> {
    console.log(`[Auto] Processing instruction: "${instruction}"`);

    if (config?.page)
    {
        sessionManager.setPage(config.page);
        console.log(`[Auto] Page set from config`);
    }

    const page = sessionManager.getPage();
    if (!page)
    {
        throw new Error('No page available. Make sure to set a page before using auto.');
    }

    // Create and invoke the agent
    console.log(`[Auto] Creating agent for instruction`);
    const { agent, systemMessage } = initializeAgent();
    const result = await agent.invoke({
        messages: [systemMessage, new HumanMessage(instruction)]
    });

    // Process agent result
    const response = result.messages?.[0]?.content;
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
