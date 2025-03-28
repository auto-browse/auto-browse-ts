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
        `You are a web automation assistant. When given a natural language instruction:
        - For "get" or "get text" instructions, use the getText tool to retrieve content. Return only the extracted text.
        - For "click" instructions, use the click tool to interact with elements
        - For "type" instructions, parse the quoted text and target, then use the type tool
        - For navigation, use the goto tool with the provided URL
        Only return the actual content or result of the operation, not a description of what you did.`
    );

    return {
        agent,
        systemMessage
    };
};

// Parse input string for typing commands
const parseTypeCommand = (instruction: string) => {
    const valueMatch = instruction.match(/["']([^"']+)["']/);
    const targetMatch = instruction.match(/(?:in|into|to)\s+(?:the\s+)?(.+?)\s*$/i);
    return {
        value: valueMatch?.[1] || '',
        target: targetMatch?.[1] || ''
    };
};

// Extract target text from get command
const parseGetCommand = (instruction: string) => {
    const targetMatch = instruction.match(/get(?:\s+text(?:\s+from)?)?(?:\s+the)?\s+(.+?)(?:\s+text)?$/i);
    return targetMatch?.[1] || instruction;
};

// Main auto function that processes instructions
export async function auto(instruction: string, config?: AutoConfig): Promise<any> {
    if (config?.page)
    {
        sessionManager.setPage(config.page);
    }

    const page = sessionManager.getPage();
    if (!page)
    {
        throw new Error('No page available. Make sure to set a page before using auto.');
    }

    try
    {
        // Pre-process type instructions
        if (instruction.toLowerCase().includes('type'))
        {
            const { value, target } = parseTypeCommand(instruction);
            if (value && target)
            {
                const result = await typeTool.invoke({ value, target });
                return result === "Successfully entered text" ? null : result;
            }
        }

        // Pre-process get instructions
        if (instruction.toLowerCase().startsWith('get'))
        {
            const target = parseGetCommand(instruction);
            const result = await getTextTool.invoke({ target });
            if (result && !result.startsWith('No element found') && !result.startsWith('Failed to get text'))
            {
                return result;
            }
        }

        // Create and invoke the agent
        const { agent, systemMessage } = initializeAgent();
        const result = await agent.invoke({
            messages: [systemMessage, new HumanMessage(instruction)]
        });

        // Process agent result
        const response = result.messages?.[0]?.content;
        if (typeof response === 'string')
        {
            // If it's a success message, return null to match original behavior
            if (response.startsWith('Successfully'))
            {
                return null;
            }
            return response;
        }

        return null;
    } catch (error)
    {
        throw new Error(`Failed to execute instruction "${instruction}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Export everything needed for the package
export { sessionManager } from './browser';
export * from './types';
