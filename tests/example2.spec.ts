import { test } from '@playwright/test';
// import { auto } from 'auto-browse';
import { auto } from '../src';

test('httpbin form test', async ({ page }) => {
    // 1. Navigate to the form
    //await page.goto('https://httpbin.org/forms/post');
    await auto('go to https://httpbin.org/forms/post', { page });

    // 2. Take a snapshot to analyze the page structure
    await auto('take a snapshot', { page });

    // 3. Fill out the form
    await auto('type "John Doe" in the customer name field', { page });
    await auto('select "Large" for size', { page });
    await auto('select "Mushroom" for topping', { page });
    await auto('check "cheese" in extras', { page });

    // 4. Submit the form
    await auto('click the Order button', { page });

    // 5. Take a snapshot of the response page
    await auto('take a snapshot of the response page', { page });
});