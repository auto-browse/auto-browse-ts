import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export function createLLMModel() {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.AUTOBROWSE_LLM_MODEL || 'gpt-4o-mini';

    if (provider === 'google')
    {
        return new ChatGoogleGenerativeAI({
            model: model
        });
    }

    return new ChatOpenAI({
        modelName: model,
        temperature: 0,
    });
}
