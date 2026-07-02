import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import { ScrapeType } from '../utils/enum';

// return hash, stripped content, length
export class HashService {
  static compareHash(newContent: string, storedHash: string) {
    return this.hash(newContent) === storedHash;
  }

  static hash(content: string) {
    return createHash('md5').update(content).digest('hex');
  }

  static strip(htmlContent: string, type: ScrapeType) {
    const $ = cheerio.load(htmlContent);
    let companyMeta = '';

    if (type == ScrapeType.COMPANY) {
      // Extract company metadata before stripping
      const metaParts: string[] = [];

      // og tags
      $('meta[property^="og:"]').each((_, el) => {
        metaParts.push($.html(el));
      });

      // title
      const title = $('title').text().trim();
      if (title) metaParts.push(`<title>${title}</title>`);

      // canonical
      $('link[rel="canonical"]').each((_, el) => {
        metaParts.push($.html(el));
      });

      // favicon / logo
      $('link[rel="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
        metaParts.push($.html(el));
      });

      companyMeta = metaParts.join('\n');
    }

    // remove tags that are not needed for container selection
    $(
      'style, script, svg, img, noscript , iframe ,  link , head , footer, br , header , nav ,video , aside, form, input, select, textarea, label, picture, source, figure, figcaption, caption',
    ).remove();

    // remove comments
    $('*')
      .contents()
      .filter(function () {
        return this.type === 'comment';
      })
      .remove();

    if (type == ScrapeType.JOBS) {
      // remove all the attributes except href
      const keepAttrs = new Set(['href']);
      $('*').each((_, el) => {
        if (el.type === 'tag') {
          for (const name of Object.keys(el.attribs)) {
            if (!keepAttrs.has(name)) delete el.attribs[name];
          }
        }
      });
    } else {
      // remove all the attributes except class id href
      $('*').each((_, el) => {
        if (el.type === 'tag') {
          const keep = ['id', 'href', 'class'];
          el.attribs = Object.fromEntries(
            Object.entries(el.attribs).filter(([k]) => keep.includes(k)),
          );
        }
      });
    }

    // remove empty tags
    $('*').each((_, el) => {
      if ($(el).text().trim() === '') {
        $(el).remove();
      }
    });

    // unwrap tags
    $(
      'button , span , strong, b ,i , article, main, ul, ol, li, p, section ,table, thead, tbody, tfoot, tr, th, td',
    )
      .contents()
      .unwrap();

    // remove empty divs
    $('div').each((_, el) => {
      if (!el.attribs.id) {
        $(el).contents().unwrap();
      }
    });

    // remove empty tags
    $('*').each((_, el) => {
      if ($(el).text().trim() === '') {
        $(el).remove();
      }
    });

    const cleanedJobs = $.html().replace(/\s+/g, ' ').trim();

    return type == ScrapeType.COMPANY
      ? `COMPANY METADATA:\n${companyMeta}\n\nJOBS CONTENT:\n${cleanedJobs}`
      : cleanedJobs;
  }
}
