import { Frame, FrameLocator, Locator } from '@playwright/test';
import { sessionManager } from './session-manager';

export class Context {
  private static instance: Context;
  private _lastSnapshotFrames: FrameLocator[] = [];

  private constructor() { }

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
}

export const context = Context.getInstance();
