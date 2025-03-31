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

> **Note:** Auto Browse currently requires specific versions of Playwright. This requirement will be relaxed in future versions.

### Required Versions

```bash
"@playwright/test": "1.52.0-alpha-1743011787000"
"playwright": "1.52.0-alpha-1743011787000"
```

### Version Conflicts

If you're using Auto Browse alongside an existing Playwright setup, you must upgrade to these specific versions. Here's how to handle common issues:

1. **Installation Conflicts**

   ```bash
   npm install --legacy-peer-deps
   ```

   This flag helps resolve peer dependency conflicts during installation.

2. **Multiple Playwright Versions**

   - Remove existing Playwright installations
   - Clear npm cache if needed: `npm cache clean --force`
   - Reinstall with the required versions

3. **Project Compatibility**
   - Update your project's Playwright configuration
   - Ensure your existing tests are compatible with the alpha version
   - Consider using a separate test environment if needed

> 🔄 Future releases will support a wider range of Playwright versions. Subscribe to our GitHub repository for updates.

## Configuration

Auto Browse requires environment variables for the LLM (Language Model) configuration. Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

You can find an example configuration in `example.env`.

### Environment Variables

| Variable         | Description                    | Default       |
| ---------------- | ------------------------------ | ------------- |
| `OPENAI_API_KEY` | Your OpenAI API key (required) | -             |
| `LLM_MODEL`      | The LLM model to use           | `gpt-4o-mini` |

## Supported LLM Providers

Currently supported:

- OpenAI (gpt-4o-mini and compatible models)

Coming soon:

- Anthropic Claude
- Google Gemini
- Local LLMs
- Meta Llama

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

Auto Browse seamlessly integrates with [playwright-bdd](https://github.com/vitalets/playwright-bdd) for behavior-driven development. This allows you to write expressive feature files and implement steps using natural language commands.

#### Example Feature File

```gherkin
# features/homepage.feature
Feature: Playwright Home Page

  Scenario: Check title
    Given navigate to https://playwright.dev
    When click link "Get started"
    Then assert title "Installation"
```

#### Step Definitions

```typescript
import { auto } from "@auto-browse/auto-browse";
import { Given, When as aistep, Then } from "./fixtures";

// Generic step that handles any natural language action
aistep(/^(.*)$/, async ({ page }, action: string) => {
	await auto(action, { page });
});

```

#### Setup Requirements

1. Install dependencies:

```bash
npm install --save-dev @playwright/test @cucumber/cucumber playwright-bdd
```

2. Configure `playwright.config.ts`:

```typescript
import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
	testDir: "./features",
	use: {
		baseURL: "https://playwright.dev"
	}
};

export default config;
```

This integration enables:

- Natural language test scenarios
- Reusable step definitions
- Cucumber reporter integration
- Built-in Playwright context management

### Supported Actions

1. **Clicking Elements**

   ```typescript
   await auto("click the submit button");
   await auto("click the link that says Learn More");
   ```

2. **Typing Text**

   ```typescript
   await auto('type "username" in the email field');
   await auto('enter "password123" in the password input');
   ```

## Features

Core Features:

- Natural language commands for browser automation
- AI-powered computer and browser agent
- Automate any browser task
- Automatic page/context detection
- TypeScript support
- Playwright test integration
- Zero configuration required

Supported Operations:

- Page Navigation (goto URL, back, forward)
- Element Interactions (click, type, hover, drag-and-drop)
- Form Handling (select options, file uploads, form submission)
- Visual Verification (snapshots, screenshots, PDF export)
- Keyboard Control (key press, text input)
- Wait and Timing Control
- Assertions and Validation

## Best Practices

1. **Be Descriptive**

   ```typescript
   // Good
   await auto("click the submit button in the login form");

   // Less Clear
   await auto("click submit");
   ```

2. **Use Quotes for Input Values**

   ```typescript
   // Good
   await auto('type "John Doe" in the name field');

   // Not Recommended
   await auto("type John Doe in the name field");
   ```

3. **Leverage Existing Labels**
   - Use actual labels and text from your UI in commands
   - Maintain good accessibility practices in your app for better automation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Thanks to Playwright Team for creating Playwright MCP and Playwright BDD.

## License

MIT
