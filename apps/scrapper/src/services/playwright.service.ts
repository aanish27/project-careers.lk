import { randomInt } from 'node:crypto';
import { Browser, devices } from 'playwright';

// https://scrape.do/blog/web-scraping-with-playwright/ check this out after complete implementation

export async function fetchPage(
  url: string,
  browser: Browser,
  selector?: string | null,
) {
  // implement ssrf check

  const timeOut = randomInt(30000, 80000);
  const context = await browser.newContext(devices['Desktop Chrome']);
  const page = await context.newPage();

  await page.goto(url, {
    timeout: timeOut,
  });

  await page.waitForLoadState('networkidle');

  const element = selector
    ? await page.locator(`${selector}`).innerHTML()
    : await page.content();

  // try {
  //   await fs.writeFile('./ifs.txt', element);
  // } catch (err) {
  //   console.log(err);
  // }

  await context.close();

  return element;
}

// async function fetchBySelector(url: string, browser: Browser, id: string) {
//   // implement ssrf check

//   const timeOut = randomInt(30000, 80000);
//   const context = await browser.newContext(devices['iPhone 11']);
//   const page = await context.newPage();

//   await page.goto(url, {
//     timeout: timeOut,
//   });

//   const element = await page.locator(`${id}`).innerHTML();
//   try {
//     await fs.writeFile('./codimiteContainerSelected.txt', element!);
//   } catch (err) {
//     console.log(err);
//   }
//   await context.close();

//   return element;
// }

// remove scripts
// frame tags
// head tags
// style tags

// body keep only -> from this what can i remove?

// span
// br
// nav , svg

// td? ul? li?
// 25000 char - set this as ideal limit

// remove unnecessary tags on the first run take full page content on the second on that selector
// ask the ai to return the jobs list container
// save it on the db...
// so next time use it to keep and strip everything else

// flow should be like this...first scrape send the whole body...ask for selector
//  second scrape selector only
