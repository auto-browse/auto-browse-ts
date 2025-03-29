import { test } from '../src';
import { auto } from '../src';

// Example using auto directly without fixture
test('basic example', async ({ page }) => {
    // Create a simple test page
    await page.setContent(`
        <h1>Welcome to Auto Browse</h1>
        <input type="text" placeholder="Search" aria-label="Search box">
        <button>Click me</button>
    `);

    // Get text using natural language
    await auto('get header text');
    await auto('verify header text is "Welcome to Auto Browse"');
    //expect(headerText).toBe('Welcome to Auto Browse');

    // Type in search box using natural language
    await auto('type "hello world" in Search');

    // Verify input value
    //const inputValue = await page.getByLabel('Search box').inputValue();
    await auto('get input value from Search box');
    await auto('verify input value is "hello world"');
    //expect(inputValue).toBe('hello world');

    // Click button using natural language
    await auto('click Click me');
});

// Example using the fixture
test('using fixture', async ({ page }) => {
    await page.setContent(`
        <div>
            <label>Username:
                <input type="text" name="username">
            </label>
            <label>Password:
                <input type="password" name="password">
            </label>
            <button>Login</button>
        </div>
    `);

    // Auto will automatically use the current page
    await auto('type "testuser" in Username');
    await auto('type "password123" in Password');
    await auto('click Login');
});

// Example with complex selectors
test('complex selectors', async ({ page }) => {
    await page.setContent(`
        <nav>
            <button aria-label="Menu">☰</button>
            <input type="search" placeholder="Search products...">
        </nav>
        <main>
            <section aria-label="Product list">
                <div data-testid="product-1">
                    <h2>Product 1</h2>
                    <button>Add to cart</button>
                </div>
            </section>
        </main>
    `);

    // Test different selector strategies
    await auto('click Menu');
    await auto('type "phone" in Search products');
    await auto('click Add to cart');

    // Get text from specific section
    await auto('get text from Product 1');
    //const productTitle = await auto('get text from Product 1');
    await auto('verify product title is "Product 1"');
    //expect(productTitle).toBe('Product 1');
});
