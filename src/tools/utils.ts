/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type * as playwright from 'playwright';
import type { ToolResult } from './tool';
import type { Context } from '../browser/context';
import yaml from 'yaml';

type PageOrFrameLocator = playwright.Page | playwright.FrameLocator;

async function waitForCompletion<R>(
    page: playwright.Page,
    callback: () => Promise<R>,
): Promise<R> {
    const requests = new Set<playwright.Request>();
    let frameNavigated = false;
    let waitCallback: () => void = () => { };
    const waitBarrier = new Promise<void>((f) => {
        waitCallback = f;
    });

    const requestListener = (request: playwright.Request) =>
        requests.add(request);
    const requestFinishedListener = (request: playwright.Request) => {
        requests.delete(request);
        if (!requests.size) waitCallback();
    };

    const frameNavigateListener = (frame: playwright.Frame) => {
        if (frame.parentFrame()) return;
        frameNavigated = true;
        dispose();
        clearTimeout(timeout);
        void frame.waitForLoadState('load').then(() => {
            waitCallback();
        });
    };

    const onTimeout = () => {
        dispose();
        waitCallback();
    };

    page.on('request', requestListener);
    page.on('requestfinished', requestFinishedListener);
    page.on('framenavigated', frameNavigateListener);
    const timeout = setTimeout(onTimeout, 10000);

    const dispose = () => {
        page.off('request', requestListener);
        page.off('requestfinished', requestFinishedListener);
        page.off('framenavigated', frameNavigateListener);
        clearTimeout(timeout);
    };

    try
    {
        const result = await callback();
        if (!requests.size && !frameNavigated) waitCallback();
        await waitBarrier;
        await page.evaluate(() => new Promise((f) => setTimeout(f, 1000)));
        return result;
    } finally
    {
        dispose();
    }
}

export async function run(
    context: Context,
    options: {
        callback: (page: playwright.Page) => Promise<any>;
        status?: string;
        captureSnapshot?: boolean;
        waitForCompletion?: boolean;
        noClearFileChooser?: boolean;
    }
): Promise<ToolResult> {
    const page = context.existingPage();
    const dismissFileChooser = !options.noClearFileChooser && context.hasFileChooser();

    try
    {
        if (options.waitForCompletion)
        {
            await waitForCompletion(page, () => options.callback(page));
        } else
        {
            await options.callback(page);
        }
    } finally
    {
        if (dismissFileChooser) context.clearFileChooser();
    }

    const result: ToolResult = options.captureSnapshot
        ? await captureAriaSnapshot(context, options.status)
        : {
            content: [{ type: 'text', text: options.status || '' }],
        };
    return result;
}

export async function runAndWait(
    context: Context,
    status: string,
    callback: (page: playwright.Page) => Promise<any>,
    snapshot: boolean = false,
): Promise<ToolResult> {
    return run(context, {
        callback,
        status,
        captureSnapshot: snapshot,
        waitForCompletion: true,
    });
}

export async function runAndWaitWithSnapshot(
    context: Context,
    options: {
        callback: (page: playwright.Page) => Promise<any>;
        status?: string;
        noClearFileChooser?: boolean;
    }
): Promise<ToolResult> {
    return run(context, {
        ...options,
        captureSnapshot: true,
        waitForCompletion: true,
    });
}

class PageSnapshot {
    private _frameLocators: PageOrFrameLocator[] = [];
    private _text!: string;

    constructor() {
    }

    static async create(page: playwright.Page): Promise<PageSnapshot> {
        const snapshot = new PageSnapshot();
        await snapshot._build(page);
        return snapshot;
    }

    text(options?: { status?: string, hasFileChooser?: boolean; }): string {
        const results: string[] = [];
        if (options?.status)
        {
            results.push(options.status);
            results.push('');
        }
        if (options?.hasFileChooser)
        {
            results.push('- There is a file chooser visible that requires browser_choose_file to be called');
            results.push('');
        }
        results.push(this._text);
        return results.join('\n');
    }

    private async _build(page: playwright.Page) {
        const yamlDocument = await this._snapshotFrame(page);
        const lines = [];
        lines.push(
            `- Page URL: ${page.url()}`,
            `- Page Title: ${await page.title()}`
        );
        lines.push(`- Page Snapshot`);
        yamlDocument.toString().trim().split('\n').forEach(line => {
            lines.push(`    ${line}`); // 4-space indentation
        });
        lines.push('');
        this._text = lines.join('\n');
    }

    private async _snapshotFrame(frame: playwright.Page | playwright.FrameLocator) {
        const frameIndex = this._frameLocators.push(frame) - 1;
        const snapshotString = await frame.locator('body').ariaSnapshot({ ref: true });
        const snapshot = yaml.parseDocument(snapshotString);

        const visit = async (node: any): Promise<unknown> => {
            if (yaml.isPair(node))
            {
                await Promise.all([
                    visit(node.key).then(k => node.key = k),
                    visit(node.value).then(v => node.value = v)
                ]);
            } else if (yaml.isSeq(node) || yaml.isMap(node))
            {
                node.items = await Promise.all(node.items.map(visit));
            } else if (yaml.isScalar(node))
            {
                if (typeof node.value === 'string')
                {
                    const value = node.value;
                    if (frameIndex > 0)
                        node.value = value.replace('[ref=', `[ref=f${frameIndex}`);
                    if (value.startsWith('iframe '))
                    {
                        const ref = value.match(/\[ref=(.*)\]/)?.[1];
                        if (ref)
                        {
                            try
                            {
                                const childSnapshot = await this._snapshotFrame(frame.frameLocator(`aria-ref=${ref}`));
                                return snapshot.createPair(node.value, childSnapshot);
                            } catch (error)
                            {
                                return snapshot.createPair(node.value, '<could not take iframe snapshot>');
                            }
                        }
                    }
                }
            }

            return node;
        };
        await visit(snapshot.contents);
        return snapshot;
    }

    refLocator(ref: string): playwright.Locator {
        let frame = this._frameLocators[0];
        const match = ref.match(/^f(\d+)(.*)/);
        if (match)
        {
            const frameIndex = parseInt(match[1], 10);
            frame = this._frameLocators[frameIndex];
            ref = match[2];
        }

        if (!frame)
            throw new Error(`Frame does not exist. Provide ref from the most current snapshot.`);

        return frame.locator(`aria-ref=${ref}`);
    }
}

export async function captureAriaSnapshot(
    context: Context,
    status: string = '',
): Promise<ToolResult> {
    const page = context.existingPage();
    const snapshot = await PageSnapshot.create(page);
    return {
        content: [{
            type: 'text',
            text: snapshot.text({
                status,
                hasFileChooser: context.hasFileChooser()
            })
        }],
    };
}
