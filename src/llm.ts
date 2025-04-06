import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { ChatOllama } from "@langchain/ollama";
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

    if (provider === 'azure')
    {
        return new AzureChatOpenAI({
            temperature: 0,
            maxRetries: 2,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        });
    }

    if (provider === 'anthropic')
    {
        return new ChatAnthropic({
            model: model,
            temperature: 0,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    if (provider === 'vertex')
    {
        return new ChatVertexAI({
            model: model,
            temperature: 0
        });
    }
    if (provider === 'ollama')
    {
        return new ChatOllama({
            model: model,
            temperature: 0,
            baseUrl: process.env.BASE_URL || 'http://127.0.0.1:11434',
        });
    }

    return new ChatOpenAI({
        modelName: model,
        temperature: 0,
    });
}
