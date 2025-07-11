# Auto-Browse: AI Enabled Browser Automation

**Auto Browse** is the easiest way to connect your AI agents with the browser using natural language.

[![Auto-Browse Launch Video](https://img.youtube.com/vi/VxJg3RRShoY/maxresdefault.jpg)](https://youtu.be/VxJg3RRShoY)

🎥 [Watch the launch video](https://youtu.be/VxJg3RRShoY)

## Quick start

An AI-powered browser automation agent for automating browser tasks and Write Playwright tests that enables natural language interactions with web pages.

## Examples

Check out our [TypeScript BDD Example Repository](https://github.com/auto-browse/auto-browse-typescript-bdd-example) to see a complete implementation using Auto Browse with BDD testing patterns.

## Installation

```bash
npm install @auto-browse/auto-browse
```

## ⚠️ Important: Playwright Version Requirements

Auto Browse requires Playwright version 1.53.0 or higher.

### Required Versions

```bash
"@playwright/test": ">=1.53.0"
"playwright": ">=1.53.0"
```

### Installation

If you encounter version conflicts, use the legacy peer deps flag:

```bash
npm install --legacy-peer-deps
```

## Quick Setup

1. Create a `.env` file in your project root:

```env
# For OpenAI (default)
OPENAI_API_KEY=your_openai_api_key_here
LLM_PROVIDER=openai  # Optional
AUTOBROWSE_LLM_MODEL=gpt-4o-mini  # Optional

# Or for Google AI
GOOGLE_API_KEY=your_google_key_here
LLM_PROVIDER=google
AUTOBROWSE_LLM_MODEL=gemini-2.0-flash-lite
```

2. Start automating!

## Supported LLM Providers

- **OpenAI** (default) - GPT-4 and compatible models
- **Google AI** - Gemini models
- **Azure OpenAI** - GPT models on Azure
- **Anthropic** - Claude models
- **Google Vertex AI** - PaLM and Gemini models
- **Ollama** - Run models locally

## Usage

### Standalone Mode (Without Playwright Test)

Auto Browse can also be used outside of Playwright test context. Here's a complete form automation example:

```typescript
import { auto } from "@auto-browse/auto-browse";

async function main() {
	try {
		// Navigate to the form
		await auto("go to https://httpbin.org/forms/post");

		// Take a snapshot to analyze the page structure
		await auto("take a snapshot");

		// Fill out the form
		await auto('type "John Doe" in the customer name field');
		await auto('select "Large" for size');
		await auto('select "Mushroom" for topping');
		await auto('check "cheese" in extras');

		// Submit the form
		await auto("click the Order button");

		// Take a snapshot of the response page
		await auto("take a snapshot of the response page");
	} catch (error) {
		console.error("Error:", error);
	}
}

// Run the script
main().catch(console.error);
```

In standalone mode, Auto Browse automatically:

- Manages browser lifecycle
- Creates and configures pages
- Handles cleanup

To run standalone scripts:

```bash
npx ts-node your-script.ts
```

### Playwright Test Mode

```typescript
import { test, expect } from "@playwright/test";
import { auto } from "@auto-browse/auto-browse";

test("example test", async ({ page }) => {
	await page.goto("https://example.com");

	// Get text using natural language
	const headerText = await auto("get the header text", { page });

	// Type in an input using natural language
	await auto('type "Hello World" in the search box', { page });

	// Click elements using natural language
	await auto("click the login button", { page });
});
```

### Auto-Detection Mode

The package automatically detects the current page context, so you can skip passing the page parameter:

```typescript
import { test, expect } from "@playwright/test";
import { auto } from "@auto-browse/auto-browse";

test("simplified example", async ({ page }) => {
	await page.goto("https://example.com");

	// No need to pass page parameter
	const headerText = await auto("get the header text");
	await auto('type "Hello World" in the search box');
	await auto("click the login button");
});
```

### BDD Mode with Playwright-BDD

Auto Browse integrates with [playwright-bdd](https://github.com/vitalets/playwright-bdd) for behavior-driven development:

```gherkin
# features/homepage.feature
Feature: Playwright Home Page
  Scenario: Check title
    Given navigate to https://playwright.dev
    When click link "Get started"
    Then assert title "Installation"
```

```typescript
// One step definition handles all actions
import { auto } from "@auto-browse/auto-browse";
import { Given, When as aistep, Then } from "./fixtures";

aistep(/^(.*)$/, async ({ page }, action: string) => {
	await auto(action, { page });
});
```

### Key Actions

```typescript
// Navigation
await auto("go to https://example.com");

// Clicking
await auto("click the submit button");

// Typing
await auto('type "username" in the email field');

// Verification
await auto("verify the success message is visible");

// Taking snapshots
await auto("take a snapshot");
```

## Core Features

- **Natural Language Commands** - Write automation in plain English
- **AI-Powered Intelligence** - Smart element detection and interaction
- **Auto Context Detection** - Automatically manages browser and page contexts
- **Multiple LLM Support** - Works with OpenAI, Google AI, Anthropic, and more
- **Playwright Integration** - Seamless integration with Playwright tests
- **TypeScript Support** - Full type safety and IntelliSense
- **Zero Configuration** - Works out of the box with minimal setup

## Documentation

📚 [Full Documentation](https://typescript.docs.auto-browse.com/quickstart) - Complete guides, examples, and API reference

## Best Practices

- **Be descriptive**: `"click the submit button in the login form"` vs `"click submit"`
- **Use quotes for values**: `'type "John Doe" in the name field'`
- **Take snapshots**: `"take a snapshot"` helps the AI understand page context

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Thanks to Playwright Team for creating Playwright MCP and Playwright BDD.

## License

MIT
