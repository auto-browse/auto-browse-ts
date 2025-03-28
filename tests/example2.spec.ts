import { test } from '@playwright/test';
// import { auto } from 'auto-browse';
import { auto } from '../src';

test('example test', async ({ page }) => {
    await page.goto('https://google.com/');

    // Get text using natural language
    // const text = await auto('get the header text', { page });

    // Type in inputs using natural language
    await auto('type "Hello World" in Search', { page });

    // Click elements using natural language
    await auto('click Search', { page });
});