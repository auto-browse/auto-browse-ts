# Auto Browse

An AI-powered automation layer for Playwright tests that enables natural language interactions with web pages.

## Installation

```bash
npm install auto-browse
```

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

## Usage

### Basic Example

```typescript
import { test, expect } from "@playwright/test";
import { auto } from "auto-browse";

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
import { auto } from "auto-browse";

test("simplified example", async ({ page }) => {
	await page.goto("https://example.com");

	// No need to pass page parameter
	const headerText = await auto("get the header text");
	await auto('type "Hello World" in the search box');
	await auto("click the login button");
});
```

### Standalone Mode (Without Playwright Test)

Auto Browse can also be used outside of Playwright test context. Here's a complete form automation example:

```typescript
import { auto } from "auto-browse";

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

3. **Getting Text**
   ```typescript
   const text = await auto("get the header text");
   const error = await auto("get the error message");
   ```

### Selector Strategies

Auto Browse uses multiple strategies to find elements:

1. Role-based (recommended)
2. Text content
3. Labels
4. Placeholders
5. Test IDs

## Features

- Natural language commands
- Automatic page/context detection
- Multiple selector strategies
- TypeScript support
- Playwright test integration
- Zero configuration required

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

## License

MIT
