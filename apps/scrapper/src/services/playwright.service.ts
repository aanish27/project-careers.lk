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
  let element;
  await page.goto(url, {
    timeout: timeOut,
  });

  await page.waitForLoadState('networkidle');

  if (selector && paginationType === PaginationType.NEXT_BUTTON) {
    element = await page.locator(`${selector}`).innerHTML();
    let prevHash = HashService.hash(element);
    let currentHash = 'hash';

    const nextBtn = page.locator(`${paginationBtn}`);

    while (!HashService.compareHash(prevHash, currentHash)) {
      try {
        if (await nextBtn.isDisabled()) break;
        await nextBtn.click({ timeout: 100000 });
        prevHash = currentHash;
        const html = await page.locator(`${selector}`).innerHTML();
        currentHash = HashService.hash(html);
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
      if (await nextBtn.isDisabled()) break;
      await nextBtn.click({ timeout: 100000 });

      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) {
        break;
      }
    }

    element = await page.locator(`${selector}`).innerHTML();
  } else if (selector) {
    let previousHeight;
    // let scrollCount = 0;
    while (true) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(3000);

      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) {
        break;
      }
      // scrollCount++;
    }

    element = await page.locator(`${selector}`).innerHTML();

    // const isInfite = !scrollCount;
  } else {
    element = await page.content();
  }

  // const element = selector
  //   ? await page.locator(`${selector}`).innerHTML()
  //   : await page.content();

  // try {
  //   await fs.writeFile('./ifs.txt', element);
  // } catch (err) {
  //   console.log(err);
  // }

  await context.close();

  return element;
}
