import { randomInt } from 'node:crypto';
import { Browser, devices } from 'playwright';
import { PaginationType } from '../utils/enum';
import { HashService } from './hash.service';

// https://scrape.do/blog/web-scraping-with-playwright/ check this out after complete implementation

export async function fetchPage(
  url: string,
  browser: Browser,
  paginationType: PaginationType | null,
  paginationBtn: string | null,
  selector?: string | null,
) {
  // implement ssrf check

  const timeOut = randomInt(100000, 150000);
  const context = await browser.newContext(devices['Desktop Chrome']);
  const page = await context.newPage();
  let element = '';

  try {
    await page.goto(url, {
      timeout: timeOut,
      waitUntil: 'domcontentloaded',
    });

    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      // networkidle may never fire on SPAs; continue with whatever loaded
    });

    if (selector && paginationType === PaginationType.NEXT_BUTTON) {
      element = await page.locator(`${selector}`).first().innerHTML();
      let prevHash = HashService.hash(element);

      const nextBtn = page.locator(`${paginationBtn}`);

      while (true) {
        try {
          if ((await nextBtn.isDisabled()) || (await nextBtn.isHidden())) break;
          await nextBtn.click({ timeout: 100000 });

          const html = await page.locator(`${selector}`).first().innerHTML();
          const currentHash = HashService.hash(html);

          // Stop once a click no longer changes the listing content.
          if (currentHash === prevHash) break;

          prevHash = currentHash;
          element += ` ${html}`;
        } catch (e) {
          console.log('An error occurred:', e);
          break;
        }
      }
    } else if (selector && paginationType === PaginationType.LOAD_MORE_BUTTON) {
      let previousHeight;
      const nextBtn = page.locator(`${paginationBtn}`);

      while (true) {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        if ((await nextBtn.isDisabled()) || (await nextBtn.isHidden())) break;
        await nextBtn.click({ timeout: 100000 });
        await page.waitForTimeout(3000);

        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
          break;
        }
      }

      element = await page.locator(`${selector}`).first().innerHTML();
    } else if (selector) {
      let previousHeight;
      while (true) {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitForTimeout(3000);

        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
          break;
        }
      }

      element = await page.locator(`${selector}`).first().innerHTML();
    } else {
      element = await page.content();
    }

    return element;
  } finally {
    await context.close();
  }
}
