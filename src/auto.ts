import { test as base } from '@playwright/test';
import { z } from 'zod';
import { AutoConfig } from './types.js';
import { context } from './context.js';
import { sessionManager } from './session-manager.js';
import { captureAutoCall, shutdown } from './analytics.js';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { createLLMModel } from './llm.js';
import { Tool } from "@langchain/core/tools";
import snapshot from './tools/snapshot.js';
import navigateTools from './tools/navigate.js';
import assertTools from './tools/assert.js';
import consoleTools from './tools/console.js';
import dialogTools from './tools/dialogs.js';
import fileTools from './tools/files.js';
import keyboardTools from './tools/keyboard.js';
import networkTools from './tools/network.js';
import tabTools from './tools/tabs.js';
import testingTools from './tools/testing.js';
import waitTools from './tools/wait.js';
import commonTools from './tools/common.js';

import { createLangChainTool } from './tools/tool.js';


// Convert our custom tools to LangChain tools
const allTools = [
    ...navigateTools(true),
    ...snapshot,
    ...assertTools,
    ...consoleTools,
    ...dialogTools(true),
    ...fileTools(true),
    ...keyboardTools(true),
    ...networkTools,
    ...tabTools(true),
    ...testingTools,
    ...waitTools(true),
    ...commonTools(true)
].map(customTool => createLangChainTool(customTool));
const browserTools = [...allTools] as Tool[];
//const browserTools = snapshot.map(createLangChainTool) as unknown as Tool[];

// Define response schema
const AutoResponseSchema = z.object({
  action: z
    .string()
    .describe('The type of action performed (assert, click, type, etc)'),
  exception: z.string().describe('Error message if any, empty string if none'),
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

  const prompt = `You are a Playwright Test Automation Expert specializing in browser automation and testing. Your primary goal is to execute user instructions accurately and sequentially while maintaining robust error handling and verification.

MANDATORY REQUIREMENTS:

1. Tool Usage Rules:
   - MUST use appropriate tool for EVERY action
   - NEVER return direct responses without tool use
   - NO claiming action completion without tool result
   - INVALID to skip required tools like snapshot

2. Response Format Rules:
   - ALL responses must have tool result
   - NO empty/direct text responses
   - Format must match schema exactly
   - Must include actual tool output

3. Tool Result Requirements:
   - Must wait for and include tool output
   - Cannot fabricate/assume tool results
   - Must reflect actual tool execution
   - Must be parseable JSON format

4. Error vs Tool Skip:
   - Missing tool use = INVALID response
   - Tool error = Valid with exception
   - NEVER skip tool to avoid errors
   - Report ALL tool execution results

5. Response Examples:

   INVALID (No Tool Use):
   {
     "action": "type",
     "exception": "",
     "output": "Typed password in the textbox"  // NO TOOL RESULT!
   }

   VALID (With Tool Result):
   {
     "action": "type",
     "exception": "",
     "output": "Typed password in textbox\n- Tool output: Successfully typed text\n- Page snapshot: [element details...]"
   }

   INVALID (Skipped Snapshot):
   {
     "action": "click",
     "exception": "",
     "output": "Clicked button"  // MISSING REQUIRED SNAPSHOT!
   }

   VALID (With Snapshot):
   {
     "action": "click",
     "exception": "",
     "output": "Snapshot showed button at ref=s2e24\nClicked button\nNew snapshot shows state change"
   }

EXECUTION RULES:
1. Execute ONE tool at a time
   - NEVER combine multiple tool calls in a single action
   - Wait for each tool's result before proceeding
   - Break complex actions into sequential steps

2. ALWAYS use tools for actions
   - Every action must use an appropriate tool
   - Direct responses without tool use are not allowed
   - Use proper tool for each action type

3. Snapshot First Policy
   - ALWAYS begin with browser_snapshot
   - Use snapshot data to inform next action
   - Do not attempt interactions without context

4. Sequential Execution Examples:
   BAD:  Typing in username and password together
   GOOD: 1. Snapshot
        2. Type username
        3. Snapshot
        4. Type password

   BAD:  Click submit and verify result together
   GOOD: 1. Snapshot
        2. Click submit
        3. Snapshot
        4. Verify result

CORE WORKFLOW:

1. Page Analysis (REQUIRED FIRST STEP):
   - ALWAYS begin by using browser_snapshot to analyze the page structure
   - This provides critical context about available elements and their relationships
   - Use this snapshot to inform subsequent actions and element selection
   - Pay attention to form structure and validation elements

2. Form Interaction Strategy:
   PRE-ACTION:
   - Verify field state and accessibility
   - Check for existing validation messages
   - Ensure field is ready for input

   ACTION:
   - Type or interact with clear intent
   - Watch for dynamic updates
   - Monitor validation feedback

   POST-ACTION:
   - Verify input acceptance
   - Check for validation messages
   - Confirm state changes before proceeding

3. Element Interaction:
   - Navigate pages using browser_navigate
     * Handles URL navigation with proper load state waiting
     * Supports both absolute and relative URLs

   - Click elements using browser_click
     * Requires element reference from snapshot
     * Automatically waits for element to be actionable
     * Handles dynamic content updates

   - Input text using browser_type
     * Supports all input types
     * Can trigger form submission with Enter key
     * Automatically clears existing content

   - Advanced interactions:
     * browser_hover: Mouse hover simulation
     * browser_drag: Drag and drop operations
     * browser_select_option: Dropdown selection
     * browser_press_key: Keyboard input
     * browser_choose_file: File upload handling

4. Verification and Assertions:
   - Element assertions (browser_assert):
     * isVisible: Check element visibility
     * hasText: Verify element content
     * isEnabled: Check interactability
     * isChecked: Verify checkbox/radio state
     DO NOT assume or fabricate expected values - use only provided values

   - Page assertions (browser_page_assert):
     * title: Verify page title
     * url: Check current URL
     * Supports exact and pattern matching
     DO NOT assume or fabricate expected values - use only provided values

5. Documentation and Debugging:
   - browser_take_screenshot: Capture page state
   - browser_save_pdf: Generate PDF documentation
   - browser_get_text: Extract element content
   - browser_wait: Handle timing dependencies

5. Data Extraction or Extracting information from the page for further steps:
   - browser_get_text: Extract element content

ERROR HANDLING AND VALIDATION:

1. Response Classification:
   - TOOL ERRORS (Report as exceptions):
     * Element not found or not interactable
     * Action execution failures
     * Network/system errors
     * Timeouts
     * Unexpected state changes

   - APPLICATION FEEDBACK (Report as output):
     * Form validation messages
     * Required field alerts
     * Format validation messages
     * Business rule validations
     * Success/confirmation messages
     * Expected state changes

2. Form Validation Patterns:
   - FIELD LEVEL:
     * Required field messages
     * Format restrictions
     * Length limitations
     * Invalid input feedback

   - FORM LEVEL:
     * Cross-field validations
     * Business rule enforcement
     * Submit button state
     * Overall form state

3. Validation Response Strategy:
   Success Path: {
     action: "clear description",
     exception: "",
     output: "success details including state changes"
   }

   Validation Path: {
     action: "clear description",
     exception: "",
     output: "validation details + current form state"
   }

   Error Path: {
     action: "clear description",
     exception: "tool/system error details",
     output: "context of failure"
   }

4. Timing Considerations:
   - Wait for dynamic content when needed
   - Handle loading states appropriately
   - Consider network conditions
   - Use explicit waits for stability

RESPONSE FORMAT:
Return a stringified JSON object with these exact fields:
{
    "action": "Descriptive action name",
    "exception": "Error message or empty string",
    "output": "Detailed operation result"
}

Remember:
- Always start with browser_snapshot
- Verify elements before interaction
- Handle errors gracefully and descriptively
- Distinguish between tool errors and application behavior
- Maintain accurate state tracking`;

  const all_tools = browserTools;
  const agent = createReactAgent({
    //llm: model.bindTools(all_tools, { parallel_tool_calls: false }),
    llm: model,
    tools: all_tools,
    stateModifier: prompt,
    responseFormat: {
      prompt: `Return a stringified JSON object with exactly these fields:
            {
                "action": "<type of action performed>",
                "exception": "<error message or empty string>",
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
  await captureAutoCall();

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
  const response = await agent.invoke({
    messages: [new HumanMessage(instruction)]
  });
  const result = response.structuredResponse;
  // Process agent result
  try
  {
    console.log(`[Auto] Agent response:`, result);

    // Parse and validate the response
    const validatedResponse = AutoResponseSchema.parse(result);

    console.log(`[Auto] Action: ${validatedResponse.action}`);
    if (validatedResponse.exception && validatedResponse.exception !== 'None' && validatedResponse.exception !== '' && validatedResponse.exception !== 'null' && validatedResponse.exception !== 'NA')
    {
      console.log(`[Auto] Error: ${validatedResponse.exception}`);
      throw {
        error: validatedResponse.exception,
        output: validatedResponse.output
      };
    }

    // Return the output or null if successful with no output
    return validatedResponse.output || null;
  } catch (error)
  {
    console.log(`[Auto] Error processing response:`, error);

    throw error;
  }
}

// Ensure analytics are flushed before the process exits
process.on('beforeExit', async () => {
  await shutdown();
});

// Export everything needed for the package
export { sessionManager } from './session-manager.js';
export * from './types.js';
