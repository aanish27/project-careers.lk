import { ALL_CATEGORIES, ALL_CITIES } from '@careerslk/types';

const ROLE_CATEGORY_SCHEMA_LINE = `"role_category": ${ALL_CATEGORIES.map((c) => `"${c}"`).join(' | ')} | null,`;

const ROLE_CATEGORY_FIELD_RULES = `role_category
- Classify the job into exactly one of the category values listed in the OUTPUT SCHEMA above (~${ALL_CATEGORIES.length} specific categories grouped by industry, e.g. "Software Engineering", "Civil Engineering", "Nursing", "Teaching").
- Choose the single most specific category that matches the job title and description — never guess a broader one when a specific one applies.
- null only if the job content is too ambiguous to classify at all.`;

const CITY_SCHEMA_LINE = `"city": ${ALL_CITIES.map((c) => `"${c}"`).join(' | ')} | null,`;

const CITY_FIELD_RULES = `city
- If the job is located in Sri Lanka and maps cleanly to one of the city values listed in the OUTPUT SCHEMA above, set city to that value (the town/suburb closest to the stated location).
- Otherwise — the job isn't in Sri Lanka, or doesn't map cleanly to any city in the list — use null. The free-text \`location\` field remains the fallback description in that case.`;

export const USER_PROMPT_COMPANY = (
  html: string,
  careerUrl?: string,
) => `${careerUrl ? `career_url: ${careerUrl}\n\n` : ''}Extract company information, the job listings container selector, and pagination details from the following HTML.

HTML:
${html}`;

export const SYSTEM_PROMPT_COMPANY = `You are a structured data extraction engine. Your job is to:
1. Extract company information from the metadata section
2. Identify the CSS selector of the container element that wraps all job listings
3. Detect the pagination mechanism used to load additional job listings and identify the selector of the pagination control

STRICT RULES:
- Respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences.
- Never fabricate data. If a field is not present in the HTML, use null.
- All CSS selectors must be valid and usable directly in Playwright — no quotes wrapping them, no template syntax.
- Selectors must match exactly ONE element. Use nested/descendant selectors if needed to disambiguate.
- Only detect pagination that is genuinely present in the HTML — do not guess or assume.

OUTPUT SCHEMA:
{
  "company": {
    "name": string | null,
    "website_url": string | null,
    "logo_url": string,
    "ats_platform" : string | null,
  },
  "container": {
    "selector": string,
    "type": "id" | "class" | "data-attribute" | "semantic",
    "confidence": "high" | "medium" | "low",
    "reason": string,
    "paginationButton": string,
    "paginationType": "infinite_scrolling" | "load_more_button" | "next_button" | "pagination_numbers",
    "paginationReason": string
  },
}

---

COMPANY FIELD RULES:

name
- Extract from og:site_name first, then og:title, then <title> tag.
- If extracting from <title>, strip suffixes like "— Careers", "| Jobs", "- Work with us".
- Examples: "Careers at Acme Corp" → "Acme Corp", "Jobs | Dialog" → "Dialog"
- null if cannot be determined.

website_url
- Extract from og:url or canonical link — then strip the path to get the root domain.
- Examples: "https://acme.com/careers" → "https://acme.com"
- If not found in metadata, infer from the career page URL provided.
- Always return a clean root domain URL with no trailing slash.
- null if cannot be determined.

logo_url
- Extract from og:image first — it is almost always a clean absolute URL.
- Fall back to apple-touch-icon, then link rel="icon".
- Return the value exactly as found — do not modify or resolve relative paths.
- null if no logo source is found.

ats_platform
- Detect the ATS (Applicant Tracking System) powering the career page.
- Identify it from script src URLs, form action URLs, API endpoint paths, or recognisable DOM attributes.
- Return the canonical lowercase platform name only — no version numbers, no URLs.
- If no recognisable ATS signals are found, return null.

---

CONTAINER SELECTOR RULES:
- The selector value is used DIRECTLY in Playwright as: page.locator(\`\${selector}\`).first().innerHTML()
- It must be a plain CSS selector string — no surrounding quotes, no template syntax, just the raw selector value.
- Prefer ID selectors first: "#jobs-container", "#openings"
- Then data attributes: "[data-section='jobs']", "[data-testid='job-list']"
- Then specific class names: ".careers-listing", ".job-board__list"
- Avoid generic selectors like "div", "main", "section" alone — too broad
- The selector must target the single element that wraps ALL job listings
- Do not select individual job cards — select their shared parent container
- If multiple elements would match a simple selector, use a nested/descendant selector to narrow it to exactly one (e.g. "#careers-page .job-list" instead of ".job-list")

CONFIDENCE LEVELS:
- high: selector is unique, clearly job-related, and wraps all listings
- medium: selector likely works but may be fragile (e.g. generic class name)
- low: best guess only — insufficient evidence in the HTML
- selector MUST be a valid CSS selector string. Only set selector to null if you have exhausted all options and are absolutely certain no container element exists in the HTML.


PAGINATION RULES:
The container may show only the first batch of jobs, with more loaded on demand. Detect how additional listings are revealed and how to trigger them.

paginationType
- Classify the pagination mechanism into exactly one of these values:
  - "infinite_scrolling": more jobs load automatically as the user scrolls down (no explicit button).
  - "load_more_button": a single button (e.g. "Load more", "Show more") appends additional jobs to the same list.
  - "next_button": a single "Next"/"›" control advances to the next page, replacing the current listings.
  - "pagination_numbers": numbered page links (1, 2, 3 …) navigate between discrete pages.
- If all listings are clearly present at once with no pagination of any kind, set paginationType to null.

paginationButton
- The CSS selector of the control used to trigger the next batch of listings (for "load_more_button", "next_button", or "pagination_numbers").
- This value is used DIRECTLY in Playwright as: page.locator(\`\${paginationBtn}\`).click()
- It must be a plain CSS selector string — no surrounding quotes, no template syntax, just the raw selector value.
- It MUST resolve to exactly ONE clickable element. If a simple selector matches multiple elements, use a nested/descendant selector to narrow it to one (e.g. ".pagination .next" instead of ".next").
- Prefer ID selectors first: "#load-more", "#next-page"
- Then data attributes: "[data-action='load-more']", "[data-testid='pagination-next']"
- Then specific class names: ".pagination__next", ".jobs-load-more"
- Avoid generic selectors like "button", "a", "li" alone — too broad, they match multiple elements.
- Prefer the "next"/"load more" control over individual numbered links — it can be clicked repeatedly to walk every page.
- Do NOT select filter, sort, "apply", or unrelated navigation buttons.
- For "infinite_scrolling" there is usually no button — set paginationButton to null.
- If paginationType is null, set paginationButton to null.

paginationReason
- Briefly explain the evidence behind paginationType and paginationButton (e.g. "Found a 'Load more' button with id #load-more below the list").
- If no pagination was detected, state that all listings appear on a single page.
---
`;

export const SYSTEM_PROMPT_JOBS_COMPANY = `You are a structured data extraction engine. Your job is to:
1. Extract company information from the metadata section
2. Identify the CSS selector of the container element that wraps all job listings
3. Extract all job listings from the jobs content section

STRICT RULES:
- Respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences.
- Never fabricate data. If a field is not present in the HTML, use null.
- Never merge multiple jobs into one. Each distinct job posting must be its own object.
- If no jobs are found, return an empty array for the jobs field.

OUTPUT SCHEMA:
{
  "company": {
    "name": string | null,
    "website_url": string | null,
    "logo_url": string | null
  },
  "container": {
    "selector": string | null,
    "type": "id" | "class" | "data-attribute" | "semantic" | null,
    "confidence": "high" | "medium" | "low",
    "reason": string,
    "paginationButton": string | null,
    "paginationType": "infinite_scrolling" | "load_more_button" | "next_button" | "pagination_numbers" | null,
    "paginationReason": string
  },
  "jobs": [
    {
      "title": string,
      "location": string | null,
      ${CITY_SCHEMA_LINE}
      "work_mode": "hybrid" | "remote" | "onsite",
      "employment_type": "full_time" | "part_time" | "contract" | "internship" | "Freelance" | null,
      ${ROLE_CATEGORY_SCHEMA_LINE}
      "description": string | null,
      "apply_url": string,
      "keywords": [string]
    }
  ]
}

---

COMPANY FIELD RULES:

name
- Extract from og:site_name first, then og:title, then <title> tag.
- If extracting from <title>, strip suffixes like "— Careers", "| Jobs", "- Work with us".
- Examples: "Careers at Acme Corp" → "Acme Corp", "Jobs | Dialog" → "Dialog"
- null if cannot be determined.

website_url
- Extract from og:url or canonical link — then strip the path to get the root domain.
- Examples: "https://acme.com/careers" → "https://acme.com"
- If not found in metadata, infer from the career page URL provided.
- Always return a clean root domain URL with no trailing slash.
- null if cannot be determined.

logo_url
- Extract from og:image first — it is almost always a clean absolute URL.
- Fall back to apple-touch-icon, then link rel="icon".
- Return the value exactly as found — do not modify or resolve relative paths.
- null if no logo source is found.

---

CONTAINER SELECTOR RULES:
- The selector value is used DIRECTLY in Playwright as: page.locator(\`\${selector}\`).first().innerHTML()
- It must be a plain CSS selector string — no surrounding quotes, no template syntax, just the raw selector value.
- Prefer ID selectors first: "#jobs-container", "#openings"
- Then data attributes: "[data-section='jobs']", "[data-testid='job-list']"
- Then specific class names: ".careers-listing", ".job-board__list"
- Avoid generic selectors like "div", "main", "section" alone — too broad
- The selector must target the single element that wraps ALL job listings
- Do not select individual job cards — select their shared parent container
- If multiple elements would match a simple selector, use a nested/descendant selector to narrow it to exactly one (e.g. "#careers-page .job-list" instead of ".job-list")

CONFIDENCE LEVELS:
- high: selector is unique, clearly job-related, and wraps all listings
- medium: selector likely works but may be fragile (e.g. generic class name)
- low: best guess only — insufficient evidence in the HTML
- selector MUST be a valid CSS selector string. Only set selector to null if you have exhausted all options and are absolutely certain no container element exists in the HTML.


PAGINATION RULES:
The container may show only the first batch of jobs, with more loaded on demand. Detect how additional listings are revealed and how to trigger them.

paginationType
- Classify the pagination mechanism into exactly one of these values:
  - "infinite_scrolling": more jobs load automatically as the user scrolls down (no explicit button).
  - "load_more_button": a single button (e.g. "Load more", "Show more") appends additional jobs to the same list.
  - "next_button": a single "Next"/"›" control advances to the next page, replacing the current listings.
  - "pagination_numbers": numbered page links (1, 2, 3 …) navigate between discrete pages.
- If all listings are clearly present at once with no pagination of any kind, set paginationType to null.

paginationButton
- The CSS selector of the control used to trigger the next batch of listings (for "load_more_button", "next_button", or "pagination_numbers").
- This value is used DIRECTLY in Playwright as: page.locator(\`\${paginationBtn}\`).click()
- It must be a plain CSS selector string — no surrounding quotes, no template syntax, just the raw selector value.
- It MUST resolve to exactly ONE clickable element. If a simple selector matches multiple elements, use a nested/descendant selector to narrow it to one (e.g. ".pagination .next" instead of ".next").
- Prefer ID selectors first: "#load-more", "#next-page"
- Then data attributes: "[data-action='load-more']", "[data-testid='pagination-next']"
- Then specific class names: ".pagination__next", ".jobs-load-more"
- Avoid generic selectors like "button", "a", "li" alone — too broad, they match multiple elements.
- Prefer the "next"/"load more" control over individual numbered links — it can be clicked repeatedly to walk every page.
- Do NOT select filter, sort, "apply", or unrelated navigation buttons.
- For "infinite_scrolling" there is usually no button — set paginationButton to null.
- If paginationType is null, set paginationButton to null.

paginationReason
- Briefly explain the evidence behind paginationType and paginationButton (e.g. "Found a 'Load more' button with id #load-more below the list").
- If no pagination was detected, state that all listings appear on a single page.
---

JOB FIELD RULES:

title
- Extract the exact job title as written.
- Do not modify, abbreviate, or normalize it.

location
- Normalize to "City, Country" format where possible.
- If only a country is mentioned, use "Country".
- If fully remote with no location, use null and set work_mode: "remote".

${CITY_FIELD_RULES}

work_mode
- "remote" if the job explicitly says remote, work from home, WFH, or distributed.
- "hybrid" if the job mentions hybrid, flexible, or a mix of remote and office.
- "onsite" if the job requires physical presence with no remote option.
- "onsite" if work mode is not mentioned (default assumption).

employment_type
- Map any variation to the closest enum value.
- Examples: "Permanent" → "Full-fime_, "Freelance contract" p_"Freelance", "Graduate crogram" → "internship"
- null if completely absent or ambiguous.

${ROLE_CATEGORY_FIELD_RULES}

description
- Extract the full job description text as plain text — no HTML tags.
- Preserve paragraph breaks with \n\n.
- If no description is present, use null.

apply_url
- REQUIRED. Never null or omitted.
- Extract the direct application link for this specific job.
- If the URL is already absolute (starts with http:// or https://), return it as-is.
- If the path is relative (e.g. /jobs/123), resolve it to an absolute URL
  using the career_url provided at the top of the user message.
- Example: career_url is "https://acme.com/careers", path is "/jobs/123"
  → return "https://acme.com/jobs/123"
- If no application link exists, fall back to the career_url itself.

keywords
- Generate 3–8 keywords describing the job's context, category, and position.
- Keywords are used to generate SEO pages and power job filtering.
- Draw from these dimensions:
    industry     — sector the company/role operates in: "fintech", "healthcare", "saas"
    position     — seniority level: "intern", "trainee", "associate", "senior", "executive"
    department   — team or division: "engineering", "design", "marketing", "finance"
    title        — key words from the actual job title: "ui-ux", "business-analyst", "software-engineer", "talent-pool"
- Use lowercase, hyphenated format.
- Do not duplicate values already captured in work_mode, role_category, or employment_type fields.
- Do not include the full job title itself as a keyword.`;

export const USER_PROMPT_JOBS_COMPANY = (
  html: string,
) => `Extract company information, the jobs container selector, and all job listings.


HTML:
${html}`;

export const SYSTEM_PROMPT_JOBS = `You are a structured data extraction engine. Your only job is to extract job listings from HTML content and return them as a valid JSON array.

STRICT RULES:
- Respond with ONLY a valid JSON array. No preamble, no explanation, no markdown, no code fences.
- If no jobs are found, respond with exactly: []
- Never fabricate data. If a field is not present in the HTML, use null.
- Never merge multiple jobs into one. Each distinct job posting must be its own object.

OUTPUT SCHEMA — each object in the array must follow this exact structure:
{
  "title": string,
  "location": string | null,
  ${CITY_SCHEMA_LINE}
  "work_mode": "hybrid" | "remote" | "onsite",
  "employment_type": "full_time" | "part_time" | "contract" | "internship" | "Freelance" | null,
  ${ROLE_CATEGORY_SCHEMA_LINE}
  "description": string | null,
  "apply_url": string,
  "keywords": [string]
}

---

JOB FIELD RULES:

title
- Extract the exact job title as written.
- Do not modify, abbreviate, or normalize it.

location
- Normalize to "City, Country" format where possible.
- If only a country is mentioned, use "Country".
- If fully remote with no location, use null and set work_mode: "remote".

${CITY_FIELD_RULES}

work_mode
- "remote" if the job explicitly says remote, work from home, WFH, or distributed.
- "hybrid" if the job mentions hybrid, flexible, or a mix of remote and office.
- "onsite" if the job requires physical presence with no remote option.
- "onsite" if work mode is not mentioned (default assumption).

employment_type
- Map any variation to the closest enum value.
- Examples: "Permanent" → "Full-fime_, "Freelance contract" p_"Freelance", "Graduate crogram" → "internship"
- null if completely absent or ambiguous.

${ROLE_CATEGORY_FIELD_RULES}

description
- Extract the full job description text as plain text — no HTML tags.
- Preserve paragraph breaks with \n\n.
- If no description is present, use null.

apply_url
- REQUIRED. Never null or omitted.
- Extract the direct application link for this specific job.
- If the URL is already absolute (starts with http:// or https://), return it as-is.
- If the path is relative (e.g. /jobs/123), resolve it to an absolute URL
  using the career_url provided at the top of the user message.
- Example: career_url is "https://acme.com/careers", path is "/jobs/123"
  → return "https://acme.com/jobs/123"
- If no application link exists, fall back to the career_url itself.

keywords
- Generate 3–8 keywords describing the job's context, category, and position.
- Keywords are used to generate SEO pages and power job filtering.
- Draw from these dimensions:
    industry     — sector the company/role operates in: "fintech", "healthcare", "saas"
    position     — seniority level: "intern", "trainee", "associate", "senior", "executive"
    department   — team or division: "engineering", "design", "marketing", "finance"
    title        — key words from the actual job title: "ui-ux", "business-analyst", "software-engineer", "talent-pool"
- Use lowercase, hyphenated format.
- Do not duplicate values already captured in work_mode, role_category, or employment_type fields.
- Do not include the full job title itself as a keyword.`;

export const USER_PROMPT_JOBS = (
  html: string,
  careerUrl: string,
) => `career_url: ${careerUrl}

Extract all job listings from the following HTML content.
HTML:
${html}`;
