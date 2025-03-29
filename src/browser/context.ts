import { FileChooser, Frame, FrameLocator, Locator, Page, Browser, chromium } from '@playwright/test';
import { sessionManager } from './session-manager';

export class Context {
  private static instance: Context;
  private _lastSnapshotFrames: FrameLocator[] = [];
  private _fileChooser: FileChooser | undefined;
  private _browser: Browser | undefined;
  private _page: Page | undefined;
  private _listenerInitialized: boolean = false;

  private constructor() { }

  private initializeListener() {
    if (!this._listenerInitialized)
    {
      const page = sessionManager.getPage();
      page.on('filechooser', chooser => this._fileChooser = chooser);
      this._listenerInitialized = true;
    }
  }

  static getInstance(): Context {
    if (!Context.instance)
    {
      Context.instance = new Context();
    }
    return Context.instance;
  }

  async allFramesSnapshot() {
    const page = sessionManager.getPage();
    const visibleFrames = await page.locator('iframe').filter({ visible: true }).all();
    this._lastSnapshotFrames = visibleFrames.map(frame => frame.contentFrame());

    const snapshots = await Promise.all([
      (page.locator('html') as any).ariaSnapshot({ ref: true }),
      ...this._lastSnapshotFrames.map(async (frame, index) => {
        const snapshot = await (frame.locator('html') as any).ariaSnapshot({ ref: true });
        const args = [];
        const src = await frame.owner().getAttribute('src');
        if (src)
          args.push(`src=${src}`);
        const name = await frame.owner().getAttribute('name');
        if (name)
          args.push(`name=${name}`);
        return `\n# iframe ${args.join(' ')}\n` + snapshot.replaceAll('[ref=', `[ref=f${index}`);
      })
    ]);

    return snapshots.join('\n');
  }

  refLocator(ref: string): Locator {
    const page = sessionManager.getPage();
    let frame: Frame | FrameLocator = page.mainFrame();
    const match = ref.match(/^f(\d+)(.*)/);
    if (match)
    {
      const frameIndex = parseInt(match[1], 10);
      if (!this._lastSnapshotFrames[frameIndex])
        throw new Error(`Frame does not exist. Provide ref from the most current snapshot.`);
      frame = this._lastSnapshotFrames[frameIndex];
      ref = match[2];
    }

    return frame.locator(`aria-ref=${ref}`);
  }

  async createPage(): Promise<Page> {
    if (this._page)
    {
      return this._page;
    }

    const { browser, page } = await this._createPage();
    this._browser = browser;
    this._page = page;
    sessionManager.setPage(page);

    // Initialize listeners
    page.on('filechooser', chooser => this._fileChooser = chooser);
    page.on('close', () => this._onPageClose());
    this._listenerInitialized = true;

    return page;
  }

  private async _createPage(): Promise<{ browser?: Browser, page: Page; }> {
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: false
    });
    const context = await browser.newContext({
    });
    const page = await context.newPage();
    return { browser, page };
  }

  private _onPageClose() {
    const browser = this._browser;
    const page = this._page;
    void page?.context()?.close().then(() => browser?.close()).catch(() => { });

    this._browser = undefined;
    this._page = undefined;
    this._fileChooser = undefined;
    this._lastSnapshotFrames = [];
    this._listenerInitialized = false;
  }

  existingPage(): Page {
    // Try standalone page first, fall back to session manager
    return this._page || sessionManager.getPage();
  }

  async close() {
    if (this._page)
    {
      await this._page.close();
      return;
    }
    const page = sessionManager.getPage();
    await page.close();
  }

  async submitFileChooser(paths: string[]) {
    this.initializeListener();
    if (!this._fileChooser)
    {
      throw new Error('No file chooser visible');
    }
    await this._fileChooser.setFiles(paths);
    this._fileChooser = undefined;
  }

  hasFileChooser(): boolean {
    this.initializeListener();
    return !!this._fileChooser;
  }

  clearFileChooser(): void {
    this._fileChooser = undefined;
  }
}

export const context = Context.getInstance();
