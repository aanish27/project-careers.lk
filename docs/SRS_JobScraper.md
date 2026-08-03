# Software Requirements Specification (SRS)

## Job Board Web Scraper System

**Version:** 3.0  
**Date:** March 2026  
**Status:** Draft

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Stakeholders & Users](#3-stakeholders--users)
4. [System Architecture](#4-system-architecture)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 [Admin Panel](#51-admin-panel)
   - 5.2 [Scraper Engine](#52-scraper-engine)
   - 5.3 [LLM Extraction](#53-llm-extraction)
   - 5.4 [Normalization & Deduplication](#54-normalization--deduplication)
   - 5.5 [Public Job Board Website](#55-public-job-board-website)
   - 5.6 [Email Alert System](#56-email-alert-system)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Models](#7-data-models)
8. [Scraper Status & Error Handling](#8-scraper-status--error-handling)
9. [Cost Estimation](#9-cost-estimation)
10. [Tech Stack Summary](#10-tech-stack-summary)
11. [Revenue & Advertising](#11-revenue--advertising)
12. [SEO Architecture & Programmatic SEO](#12-seo-architecture--programmatic-seo)
    - 12.1 [SEO Strategy Overview](#121-seo-strategy-overview)
    - 12.2 [Information Architecture](#122-information-architecture)
    - 12.3 [Page-Level SEO Design](#123-page-level-seo-design)
    - 12.4 [Metadata Architecture](#124-metadata-architecture)
    - 12.5 [Internal Linking Architecture](#125-internal-linking-architecture)
    - 12.6 [Structured Data](#126-structured-data)
    - 12.7 [Sitemap & Crawl Management](#127-sitemap--crawl-management)
    - 12.8 [Canonicalization & Duplicate Prevention](#128-canonicalization--duplicate-prevention)
    - 12.9 [Individual Job Page SEO](#129-individual-job-page-seo)
    - 12.10 [Performance & Technical SEO](#1210-performance--technical-seo)
    - 12.11 [Programmatic SEO System](#1211-programmatic-seo-system)
    - 12.12 [Google Search Console Integration](#1212-google-search-console-integration)
    - 12.13 [Page Deactivation Strategy](#1213-page-deactivation-strategy)
    - 12.14 [SEO Quality Control](#1214-seo-quality-control)
    - 12.15 [AI Usage Policy](#1215-ai-usage-policy)
    - 12.16 [SEO Data Models](#1216-seo-data-models)
    - 12.17 [SEO Functional Requirements](#1217-seo-functional-requirements)
    - 12.18 [MVP SEO Scope](#1218-mvp-seo-scope)
13. [Deployment Architecture](#13-deployment-architecture)
    - 13.1 [Overview](#131-overview)
    - 13.2 [Frontend — Cloudflare Workers](#132-frontend--cloudflare-workers)
    - 13.3 [Backend & Scraper — AWS Lightsail](#133-backend--scraper--aws-lightsail)
    - 13.4 [Database — PostgreSQL on Lightsail](#134-database--postgresql-on-lightsail)
    - 13.5 [Email — AWS SES](#135-email--aws-ses)
    - 13.6 [Scraper Concurrency Limit](#136-scraper-concurrency-limit)
    - 13.7 [Migration Path](#137-migration-path)
14. [Cost Analysis](#14-cost-analysis)
    - 14.1 [MVP Monthly Infrastructure Cost](#141-mvp-monthly-infrastructure-cost)
    - 14.2 [LLM Cost Breakdown](#142-llm-cost-breakdown)
    - 14.3 [Total Monthly Cost Summary](#143-total-monthly-cost-summary)
    - 14.4 [Cost Scaling Projections](#144-cost-scaling-projections)
15. [Out of Scope](#15-out-of-scope)

---

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for a web scraper system that collects job listings from company career pages and displays them on a public-facing job board website. It serves as the reference for design, development, and testing.

### 1.2 Project Goals

- Automatically scrape job listings from up to 1,000 company career pages on a weekly schedule
- Allow manual scrape triggers via an admin panel
- Extract structured job data using ATS platform adapters and LLM-assisted fallback extraction
- Display clean, searchable, filterable job listings on a public Next.js website
- Notify subscribed users of new job listings via email alerts

### 1.3 Scope

The system covers three primary surfaces:

- **Scraper Engine** — the automated/manual data collection layer
- **Admin Panel** — the internal management interface
- **Public Job Board** — the user-facing website

### 1.4 Definitions

| Term            | Definition                                                                  |
| --------------- | --------------------------------------------------------------------------- |
| ATS             | Applicant Tracking System (e.g. Greenhouse, Lever, Workday)                 |
| LLM             | Large Language Model — used for extracting structured data from custom HTML |
| Page Hash       | SHA256 hash of scraped page content used to detect changes                  |
| Job Fingerprint | SHA256 hash of job-identifying fields used for deduplication                |
| Explicit Skill  | A skill directly mentioned in the job description                           |
| Inferred Skill  | A skill the LLM deduces from the job context                                |
| Expired Job     | A job not seen in 2 or more consecutive scrape runs                         |

---

## 2. System Overview

The system scrapes company career pages (e.g. `company.com/careers`, `company.com/jobs`) that are manually added by an admin. For each source, the scraper detects which ATS platform powers the page and applies a dedicated adapter. For fully custom career pages with no detectable ATS, the system falls back to LLM-assisted extraction using the Claude API (Haiku 4.5).

Scraped data is normalized, deduplicated, and stored in a PostgreSQL database. A Next.js public website exposes the job listings to general job seekers with search, filtering, and email alert capabilities.

---

## 3. Stakeholders & Users

### 3.1 Admin (Internal)

- Manages the list of company career page URLs
- Configures and monitors scraping schedules
- Triggers manual scrapes
- Reviews and edits LLM-generated keywords
- Monitors scraper health, logs, and error flags

### 3.2 Job Seekers (Public)

- Browse, search, and filter job listings
- Click a job to be redirected to the original source for application
- Subscribe to email alerts for new jobs matching their criteria

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                       │
│         (Manage URLs, Schedules, Trigger Scrapes)        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                     BACKEND API (NestJS)                  │
│        REST API · Job Queue Manager · Auth               │
└──────┬──────────────────────────────────────┬───────────┘
       │                                      │
       ▼                                      ▼
┌─────────────────┐                 ┌──────────────────────┐
│  SCRAPER ENGINE │                 │    PUBLIC API        │
│  Node.js +      │                 │    (Job listings,    │
│  Playwright     │                 │    Search, Alerts)   │
└──────┬──────────┘                 └──────────┬───────────┘
       │                                       │
       ▼                                       ▼
┌─────────────────┐                 ┌──────────────────────┐
│  JOB QUEUE      │                 │   NEXT.JS FRONTEND   │
│  Bull + Redis   │                 │   Public Job Board   │
└──────┬──────────┘                 └──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   EXTRACTION LAYER                       │
│                                                          │
│   ┌──────────────────┐      ┌────────────────────────┐  │
│   │  ATS ADAPTERS    │      │   LLM FALLBACK         │  │
│   │  Greenhouse      │      │   Claude API           │  │
│   │  Lever           │      │   Haiku 4.5            │  │
│   │  Workday         │      │   (custom pages only)  │  │
│   │  Ashby           │      └────────────────────────┘  │
│   │  SmartRecruiters │                                   │
│   │  Recruitee       │                                   │
│   └──────────────────┘                                   │
└──────────────────────────────┬──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│              NORMALIZATION & DEDUP LAYER                 │
│     Hash Comparison · Job Fingerprinting · Expiry        │
└──────────────────────────────┬──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                   │
│         Companies · Jobs · Skills · Alerts · Logs        │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Scraper Engine | Node.js + Playwright + playwright-extra (stealth) |
| Job Queue      | Bull + Redis                                      |
| Backend API    | NestJS (TypeScript)                               |
| LLM Extraction | Claude API — Haiku 4.5 (fallback: Sonnet 4.6)     |
| Database       | PostgreSQL                                        |
| Frontend       | Next.js (React) + Tailwind CSS                    |
| Email          | AWS SES                                           |
| Deployment     | AWS                                               |

---

## 5. Functional Requirements

---

### 5.1 Admin Panel

#### 5.1.1 Company Source Management

- Admin can add a company career page URL (e.g. `https://company.com/careers`)
- Admin can edit or remove existing URLs
- System automatically detects the ATS platform upon URL entry (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, Recruitee)
- If no ATS is detected, source is flagged as "Custom" and routed to LLM extraction
- Admin can view all sources in a table with columns: Company Name, URL, ATS Platform, Last Scraped, Jobs Found, Status

#### 5.1.2 Scrape Triggering

- **Scheduled scrape:** Runs automatically once per week via cron job
- **Bulk manual trigger:** A single "Scrape All" button triggers all sources immediately
- **Per-source manual trigger:** Each company row has an individual "Scrape Now" button
- Manual triggers are added to the job queue and processed in order

#### 5.1.3 Scraper Monitoring

- Admin can view a scrape log for each company showing: timestamp, jobs found, status, duration
- Admin can view real-time scraper queue status (pending, running, completed, failed jobs)
- Admin receives visual alerts for sources flagged as suspected extraction failures or errors

#### 5.1.4 Keyword Management

- Admin can view LLM-generated keywords per job listing
- Admin can add, edit, or remove keywords on any job
- Admin can bulk-edit keywords across jobs of the same company

---

### 5.2 Scraper Engine

#### 5.2.1 Page Loading

- Uses Playwright with playwright-extra stealth plugin to load each career page
- Waits for page content using smart strategies: `waitForSelector`, `waitForNetworkIdle`, or `waitForLoadState` depending on the source
- Configurable per-source timeout (default: 30 seconds)
- Randomized delays between requests (1.5–4.5 seconds) to mimic human browsing

#### 5.2.2 ATS Detection

Upon fetching a page, the scraper inspects the HTML and network requests to identify known ATS platforms:

| ATS Platform    | Detection Signal                               |
| --------------- | ---------------------------------------------- |
| Greenhouse      | `boards.greenhouse.io` in iframe src or script |
| Lever           | `jobs.lever.co` in links or iframe             |
| Workday         | `myworkdayjobs.com` in URL or embedded scripts |
| Ashby           | `jobs.ashbyhq.com` in links or embed           |
| SmartRecruiters | `careers.smartrecruiters.com` references       |
| Recruitee       | `recruitee.com` references                     |

If a known ATS is detected, the corresponding adapter handles extraction. Otherwise, the page is routed to LLM extraction.

#### 5.2.3 ATS Adapters

Each ATS adapter:

- Knows the specific DOM structure of that platform
- Handles pagination automatically
- Extracts all required job fields directly without LLM cost
- Is independently maintainable and testable

#### 5.2.4 Scrape Run Flow

```
For each company source:
  1. Fetch page with Playwright
  2. Generate SHA256 hash of page content
  3. Compare hash with stored hash in DB
     → Same: skip, log "no change", update last_scraped_at
     → Different or first run: continue
  4. Detect ATS platform
     → Known ATS: use adapter
     → Unknown: strip HTML noise, send to LLM
  5. Receive structured job array
  6. Run normalization and deduplication
  7. Update page hash in DB
  8. Update last_seen_at for confirmed jobs
  9. Mark jobs absent for 2+ runs as expired
  10. Log result: jobs found, duration, status
```

---

### 5.3 LLM Extraction

#### 5.3.1 HTML Pre-processing

Before sending to the LLM:

- Strip navigation, footer, scripts, styles, ads, and irrelevant boilerplate
- Keep only the main content area of the page
- Target token count: under 5,000 tokens per page

#### 5.3.2 LLM Prompt

The system sends a strict structured prompt instructing the model to return only a JSON array. The prompt specifies the exact output schema and instructs the model to distinguish explicit vs inferred skills.

#### 5.3.3 Model Strategy (Tiered)

| Tier     | Model             | Trigger                                   |
| -------- | ----------------- | ----------------------------------------- |
| Primary  | Claude Haiku 4.5  | All custom pages                          |
| Fallback | Claude Sonnet 4.6 | Haiku output fails JSON schema validation |

#### 5.3.4 Output Schema per Job

```json
{
  "title": "string",
  "location": "string",
  "remote": "boolean",
  "employment_type": "Full-time | Part-time | Contract | Internship | Freelance",
  "salary": {
    "min": "number | null",
    "max": "number | null",
    "currency": "string | null",
    "raw": "string | null"
  },
  "description": "string",
  "deadline": "ISO date string | null",
  "apply_url": "string",
  "skills": [{ "name": "string", "type": "explicit | inferred" }],
  "keywords": ["string"]
}
```

#### 5.3.5 Zero Jobs Handling

When LLM returns an empty array:

- Scan raw HTML for job-signal keywords: "apply", "open positions", "responsibilities", "requirements", "full-time", "remote", "job title"
- If signals found → flag source as **"Suspected Extraction Failure"** in admin panel
- If no signals found → mark source as **"Empty — No Current Openings"**

#### 5.3.6 Prompt Caching

- System prompts and schema instructions are cached via Anthropic's prompt caching API
- Cache hits cost 10% of standard input price
- Reduces LLM costs significantly on repeated weekly runs

---

### 5.4 Normalization & Deduplication

#### 5.4.1 Page-Level Change Detection

- Each source stores a `page_hash` (SHA256 of raw page HTML)
- On each scrape run, new hash is compared before any processing
- If identical → skip extraction entirely (zero LLM cost)
- If different → proceed with extraction and update stored hash

#### 5.4.2 Job-Level Deduplication

Each job receives a fingerprint:

```
job_fingerprint = SHA256(company_id + job_title + location + employment_type)
```

| Scenario                              | Action                 |
| ------------------------------------- | ---------------------- |
| New fingerprint                       | Insert as new job      |
| Existing fingerprint, same content    | Skip — no update       |
| Existing fingerprint, content changed | Update existing record |

#### 5.4.3 Data Normalization

| Field           | Normalization Rule                                                                    |
| --------------- | ------------------------------------------------------------------------------------- |
| Salary          | Parse all formats into `{ min, max, currency }` numeric fields. Store raw string too. |
| Location        | Standardize to "City, Country" or "Remote"                                            |
| Employment type | Map all variations to enum: Full-time, Part-time, Contract, Internship, Freelance     |
| Skills          | Deduplicate, trim whitespace, normalize casing                                        |
| Keywords        | Deduplicate, lowercase, trim whitespace                                               |
| Deadline        | Parse to ISO 8601 date format. Null if not found.                                     |

#### 5.4.4 Job Expiry

- Every confirmed job gets `last_seen_at` updated on each scrape run
- If a job is absent from 2 consecutive scrape runs (2 weeks), its `status` is set to `expired`
- Expired jobs are hidden from the public job board but retained in the database
- Admin can view expired jobs per company

---

### 5.5 Public Job Board Website

#### 5.5.1 Job Listings Page

- Displays all active job listings as cards
- Each card shows: Job Title, Company Name, Location, Employment Type, Salary (if available), Skills (top 3–5), Keywords/Tags, Date Posted
- Clicking a job card opens a detail view and includes a prominent "Apply" button that redirects to the original job URL on the company's website (opens in new tab)
- Listings are sorted by most recently scraped by default

#### 5.5.2 Search

- Full-text search across: job title, company name, description, skills, keywords
- Search results update in real time (debounced)

#### 5.5.3 Filters

Users can filter by:

| Filter          | Type                                                    |
| --------------- | ------------------------------------------------------- |
| Location        | Multi-select or text input                              |
| Remote          | Toggle (Remote / On-site / Hybrid)                      |
| Employment Type | Multi-select (Full-time, Part-time, Contract, etc.)     |
| Skills          | Multi-select tag picker                                 |
| Keywords        | Multi-select tag picker                                 |
| Salary Range    | Min/max range slider (only shows jobs with salary data) |
| Company         | Search/select                                           |

#### 5.5.4 Job Detail Page

Each job has a dedicated page (SEO-friendly URL) showing:

- Full job description
- All skills (with explicit/inferred label)
- All keywords as clickable tags
- Salary, location, employment type, deadline
- "Apply on [Company Name]" CTA button → redirects to original apply URL

#### 5.5.5 No Login Required

The public job board requires no user account. Email alert subscription only requires an email address.

---

### 5.6 Email Alert System

#### 5.6.1 Subscription

- Users can subscribe to job alerts by entering their email address
- Users define alert criteria: keywords, skills, location, employment type, remote preference
- Subscription is confirmed via a confirmation email (double opt-in)

#### 5.6.2 Alert Triggers

- After each scrape run, the system checks newly inserted jobs against all active subscriptions
- If a new job matches a subscription's criteria, it is queued for that subscriber's alert email
- Alerts are batched and sent once per day (not per scrape run) to avoid inbox flooding

#### 5.6.3 Email Content

Each alert email contains:

- List of new matching jobs (title, company, location, skills)
- Direct link to each job's detail page on the job board
- One-click unsubscribe link

#### 5.6.4 Unsubscribe

- Every email includes a one-click unsubscribe link
- Unsubscribed users are removed from the alerts system immediately

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Public job board pages must load in under 2 seconds (with static generation / ISR via Next.js)
- Scraper must handle 1,000 companies per weekly run within a reasonable time window (parallelized with configurable concurrency limit)
- Job queue processes scrapes with configurable concurrency (default: 5 simultaneous scrapes) to avoid overwhelming any single target domain

### 6.2 Reliability

- Failed scrape jobs are automatically retried up to 3 times with exponential backoff
- All scrape errors are logged with full stack trace and surfaced in the admin panel
- System continues processing remaining sources if one source fails

### 6.3 Scalability

- Architecture supports scaling beyond 1,000 companies by increasing job queue workers
- PostgreSQL schema is indexed for efficient filtering and search at scale

### 6.4 Data Accuracy

- Stale jobs (absent 2+ scrape runs) are automatically expired and hidden from public
- Suspected extraction failures are flagged rather than silently ignored
- All LLM output is validated against a strict JSON schema before storage

### 6.5 Security

- Admin panel is protected by authentication (username/password minimum, JWT tokens)
- All API endpoints are rate limited
- Company URLs are validated before being added to prevent SSRF attacks
- Environment variables used for all API keys (Claude API, AWS SES)

---

## 7. Data Models

### 7.1 companies

| Column          | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| id              | UUID      | Primary key                             |
| name            | VARCHAR   | Company name                            |
| career_url      | VARCHAR   | Career page URL                         |
| ats_platform    | VARCHAR   | Detected ATS or "custom"                |
| page_hash       | VARCHAR   | SHA256 of last scraped HTML             |
| last_scraped_at | TIMESTAMP | Last successful scrape time             |
| scrape_status   | ENUM      | active, empty, suspected_failure, error |
| created_at      | TIMESTAMP |                                         |

### 7.2 jobs

| Column          | Type      | Description                  |
| --------------- | --------- | ---------------------------- |
| id              | UUID      | Primary key                  |
| company_id      | UUID      | Foreign key → companies      |
| fingerprint     | VARCHAR   | SHA256 dedup hash            |
| title           | VARCHAR   | Job title                    |
| location        | VARCHAR   | Normalized location          |
| remote          | BOOLEAN   | Is remote                    |
| employment_type | ENUM      | Full-time, Part-time, etc.   |
| salary_min      | INTEGER   | Parsed min salary            |
| salary_max      | INTEGER   | Parsed max salary            |
| salary_currency | VARCHAR   |                              |
| salary_raw      | VARCHAR   | Original salary string       |
| description     | TEXT      | Full job description         |
| deadline        | DATE      | Application deadline         |
| apply_url       | VARCHAR   | Link to original job posting |
| status          | ENUM      | active, expired              |
| last_seen_at    | TIMESTAMP | Last confirmed in scrape     |
| created_at      | TIMESTAMP |                              |
| updated_at      | TIMESTAMP |                              |

### 7.3 job_skills

| Column | Type    | Description        |
| ------ | ------- | ------------------ |
| id     | UUID    | Primary key        |
| job_id | UUID    | Foreign key → jobs |
| name   | VARCHAR | Skill name         |
| type   | ENUM    | explicit, inferred |

### 7.4 job_keywords

| Column          | Type    | Description               |
| --------------- | ------- | ------------------------- |
| id              | UUID    | Primary key               |
| job_id          | UUID    | Foreign key → jobs        |
| keyword         | VARCHAR | Keyword/tag               |
| edited_by_admin | BOOLEAN | Whether admin modified it |

### 7.5 scrape_logs

| Column        | Type      | Description                              |
| ------------- | --------- | ---------------------------------------- |
| id            | UUID      | Primary key                              |
| company_id    | UUID      | Foreign key → companies                  |
| triggered_by  | ENUM      | scheduled, manual                        |
| jobs_found    | INTEGER   | Number of jobs extracted                 |
| status        | ENUM      | success, empty, suspected_failure, error |
| error_message | TEXT      | Error detail if failed                   |
| duration_ms   | INTEGER   | Scrape duration                          |
| created_at    | TIMESTAMP |                                          |

### 7.6 alert_subscriptions

| Column     | Type      | Description                                       |
| ---------- | --------- | ------------------------------------------------- |
| id         | UUID      | Primary key                                       |
| email      | VARCHAR   | Subscriber email                                  |
| criteria   | JSONB     | Filter criteria (skills, keywords, location etc.) |
| confirmed  | BOOLEAN   | Email confirmed via opt-in                        |
| created_at | TIMESTAMP |                                                   |

---

## 8. Scraper Status & Error Handling

### 8.1 Source Status Types

| Status               | Meaning                                          | Admin Action     |
| -------------------- | ------------------------------------------------ | ---------------- |
| ✅ Active            | Jobs found and scraped successfully              | None needed      |
| 🕐 Empty             | Scraped successfully, no current openings        | Monitor          |
| ⚠️ Suspected Failure | 0 jobs returned but job-signal keywords detected | Manual review    |
| ❌ Error             | Page unreachable, timeout, or crash              | Investigate logs |
| 🔄 No Change         | Hash matched, scrape skipped                     | None needed      |

### 8.2 Retry Policy

- On scrape error: retry up to 3 times with exponential backoff (30s, 2min, 10min)
- After 3 failures: mark source as Error, notify admin in panel
- LLM validation failure: retry once with Sonnet 4.6 before flagging

---

## 9. Cost Estimation

### 9.1 Assumptions

- 1,000 companies total
- ~60–70% use known ATS platforms → handled by adapters (zero LLM cost)
- ~30–40% have custom pages → require LLM extraction (~300–400 companies)
- Average cleaned HTML input: ~3,000 tokens per page
- Average JSON output: ~800 tokens per page
- Scraping frequency: once per week
- Many pages won't change week to week (page hash match) → reduces LLM calls further

### 9.2 Weekly LLM Cost (Haiku 4.5)

|                                | Value      |
| ------------------------------ | ---------- |
| Custom pages per run           | ~300–400   |
| Input tokens (3,000 × 350 avg) | ~1,050,000 |
| Output tokens (800 × 350 avg)  | ~280,000   |
| Input cost ($1.00/MTok)        | ~$1.05     |
| Output cost ($5.00/MTok)       | ~$1.40     |
| **Total per week**             | **~$2.45** |

### 9.3 Monthly Cost

| Scenario                              | Monthly Cost |
| ------------------------------------- | ------------ |
| Standard (weekly scrape)              | ~$4–$6       |
| With Batch API (50% off)              | ~$2–$3       |
| With prompt caching on repeated pages | ~$1–$2       |

---

## 10. Tech Stack Summary

| Component       | Technology                                          |
| --------------- | --------------------------------------------------- |
| Scraper         | Node.js, Playwright, playwright-extra stealth       |
| Job Queue       | Bull, Redis                                         |
| Backend API     | NestJS (TypeScript)                                 |
| LLM Extraction  | Claude API (Haiku 4.5 primary, Sonnet 4.6 fallback) |
| Database        | PostgreSQL                                          |
| Public Frontend | Next.js, Tailwind CSS                               |
| Admin Panel     | Next.js (separate route/app)                        |
| Email           | AWS SES                                             |
| Deployment      | AWS                                                 |

---

## 11. Revenue & Advertising

### 11.1 Overview

The platform supports three revenue streams. All advertiser relationships are managed manually — no self-serve payment gateway is required for v1. The admin panel includes an Advertisers section to manage all ad inventory.

---

### 11.2 Google AdSense

#### Implementation

- Google AdSense script loaded client-side via Next.js `Script` component with `strategy="lazyOnload"`
- Ad units are React components that render only on the client to comply with Next.js SSR

#### Placements

| Placement       | Location                                          |
| --------------- | ------------------------------------------------- |
| In-feed         | Between every 8–10 job cards in the listings feed |
| Job detail      | Below the full job description                    |
| Desktop sidebar | Sidebar column on desktop layout (if applicable)  |

#### Notes

- When AdSense has no ad to serve, the unit collapses to zero height — no empty space
- AdSense units must not be obscured by or conflict with the full page modal

---

### 11.3 Full Page Modal Ad (Takeover)

One advertiser purchases the modal slot for a calendar month. Any business category is eligible. Only one advertiser can own the slot at a time.

#### Trigger Logic

The modal does **not** show on initial page load. It triggers after either:

- The user has viewed 2 or more job detail pages, **or**
- The user has spent 45+ seconds on the site

This ensures the user has received value before seeing the ad.

#### Frequency Capping

- A cookie `modal_seen=true` is set with a **1-day expiry** upon modal dismissal
- If the cookie exists, the modal is skipped entirely for that day
- After 1 day the cookie expires and the modal is eligible to show again on next visit
- No backend tracking required — fully cookie-based

#### Admin Management

Admin panel includes a "Modal Ad" section with:

- Upload advertiser creative (image or HTML)
- Set active date range (start date / end date)
- Toggle on/off manually
- When no active advertiser exists, modal does not render for any user

#### Suggested Pricing

| Package          | Description                              | Suggested Price |
| ---------------- | ---------------------------------------- | --------------- |
| Monthly Takeover | Full page modal, all users, entire month | $300–$800/month |

---

### 11.4 In-Feed Sponsored Cards (Native Ads)

Sponsored cards appear inline within the job listings feed at regular intervals. They are **visually distinct** from job listing cards — clearly styled as advertisements with a "Sponsored" label. Multiple advertisers can purchase different feed slots simultaneously.

#### Placement Logic

- A sponsored card slot appears at every 5th position in the listings feed (position 5, 10, 15, 20...)
- If no advertiser has purchased a slot, that position is skipped — no empty space rendered
- Multiple advertisers can each own a different slot position for the same month

#### Sponsored Card Content

Each card contains:

- Advertiser logo
- Headline (short, attention-grabbing)
- Brief description (2–3 lines)
- CTA button (e.g. "Visit Website", "Learn More") linking to advertiser's destination URL
- "Sponsored" label clearly visible

#### Admin Management

Admin creates a sponsored card entry with:

- Advertiser name and logo
- Headline, description, CTA text, destination URL
- Feed slot position preference (e.g. position 5, 10, 15)
- Active date range (start date / end date)

Cards automatically deactivate when the end date passes.

#### Suggested Pricing

| Package             | Description                                        | Suggested Price |
| ------------------- | -------------------------------------------------- | --------------- |
| Feed Slot — Monthly | One inline card slot, all feed pages, entire month | $150–$400/month |

---

### 11.5 Advertiser Management (Admin Panel)

A dedicated **Advertisers** section in the admin panel handles all ad inventory manually:

| Feature             | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| Create advertiser   | Name, contact info, package type, start/end date                            |
| Invoice tracking    | Mark invoice as: Sent / Paid / Overdue                                      |
| Auto-deactivation   | Ad automatically deactivates when end date passes or invoice marked Overdue |
| Creative management | Upload/replace modal creative or sponsored card assets                      |
| Active ad overview  | Dashboard showing all currently running ads and their expiry dates          |

No payment gateway is integrated in v1 — all billing is handled offline via invoice.

---

### 11.6 Advertiser Data Model

**advertisers**

| Column          | Type      | Description                            |
| --------------- | --------- | -------------------------------------- |
| id              | UUID      | Primary key                            |
| name            | VARCHAR   | Advertiser/company name                |
| contact_email   | VARCHAR   | Billing contact                        |
| package_type    | ENUM      | adsense, modal, sponsored_card         |
| slot_position   | INTEGER   | Feed position (sponsored_card only)    |
| creative_url    | VARCHAR   | Uploaded creative asset URL            |
| headline        | VARCHAR   | Card headline (sponsored_card only)    |
| description     | TEXT      | Card description (sponsored_card only) |
| cta_text        | VARCHAR   | Button label                           |
| destination_url | VARCHAR   | Click destination                      |
| start_date      | DATE      | Campaign start                         |
| end_date        | DATE      | Campaign end                           |
| invoice_status  | ENUM      | pending, sent, paid, overdue           |
| is_active       | BOOLEAN   | Manual override toggle                 |
| created_at      | TIMESTAMP |                                        |

---

## 12. SEO Architecture & Programmatic SEO

### 12.1 SEO Strategy Overview

The platform's primary user acquisition channel is organic search. The site must be designed not only as a job board but as an SEO-driven content platform that ranks for high-intent job-related queries.

**Target search queries include:**

- software engineer jobs in Colombo
- remote developer jobs Sri Lanka
- internships in Kandy
- marketing jobs in Sri Lanka
- jobs at Dialog
- finance executive jobs Sri Lanka

**Core SEO approach:**

- Server-rendered or statically generated landing pages via Next.js
- Descriptive SEO text on all category and landing pages
- Dynamic metadata generation per page
- Structured internal linking across all page types
- Programmatic page generation from database content
- Schema markup for jobs and related entities
- XML sitemaps with `lastmod` freshness signals
- Strict indexability control to prevent thin page accumulation

---

### 12.2 Information Architecture

#### 12.2.1 URL Structure

| URL Pattern                            | Page Type                |
| -------------------------------------- | ------------------------ |
| `/jobs`                                | All jobs listing         |
| `/jobs/[role-slug]`                    | Role listing page        |
| `/jobs/in/[location-slug]`             | Location listing page    |
| `/jobs/[role-slug]/in/[location-slug]` | Role + location page     |
| `/jobs/remote/[role-slug]`             | Remote role page         |
| `/jobs/skills/[skill-slug]`            | Skill-based listing page |
| `/companies/[company-slug]`            | Company overview page    |
| `/companies/[company-slug]/jobs`       | Company jobs listing     |
| `/internships`                         | Internships page         |
| `/remote-jobs`                         | Remote jobs page         |

#### 12.2.2 URL Principles

- Lowercase, hyphenated, human-readable slugs
- Keyword-rich but natural
- Canonicalized to one preferred form
- No indexing of parameterized or noisy filter URLs

#### 12.2.3 Non-Indexable URLs

The following must never be indexed:

- `/jobs?page=12` — deep pagination
- `/jobs?sort=latest` — sort parameters
- `/jobs?salary=100000` — salary filter URLs
- `/jobs?experience=2&posted=24h` — combined filter parameters

These must carry canonical tags pointing to the base page and/or `noindex` directives where appropriate.

---

### 12.3 Page-Level SEO Design

#### 12.3.1 Required Elements Per Page

Every indexable landing page must contain:

- Unique title tag
- Unique meta description
- Unique H1
- Short intro paragraph (40–80 words)
- Visible job listings
- Bottom SEO content block (150–300 words)
- Internal links to related pages
- Self-referencing canonical URL
- Structured data where relevant

#### 12.3.2 Recommended Page Layout

```
1. H1
2. Short intro text (above the fold)
3. Filter / navigation area
4. Job listings
5. Related internal links
6. Bottom SEO text block
```

SEO text is placed at the bottom to preserve user experience — jobs appear first, descriptive content follows for crawlers.

---

### 12.4 Metadata Architecture

#### 12.4.1 Metadata Fields Per Page

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- Open Graph: `og:title`, `og:description`, `og:url`
- Twitter: `twitter:title`, `twitter:description`

#### 12.4.2 Metadata Formula Examples

| Page Type       | Title Formula                       | Meta Description Formula                                                                                              |
| --------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Role + Location | `{Role} Jobs in {Location}`         | `Browse {Role} jobs in {Location} from top employers. Explore full-time, internship, and remote opportunities.`       |
| Company         | `Jobs at {Company}`                 | `Explore the latest jobs at {Company}, including current openings, locations, and role categories.`                   |
| Skill           | `{Skill} Jobs — Find {Skill} Roles` | `Browse jobs requiring {Skill} across companies and locations. Find full-time, remote, and internship opportunities.` |
| Remote          | `Remote {Role} Jobs`                | `Find remote {Role} opportunities across top companies. Work from anywhere.`                                          |

#### 12.4.3 Next.js Implementation

All metadata is generated server-side using Next.js `generateMetadata()` so every page returns fully crawlable metadata without client-side rendering.

---

### 12.5 Internal Linking Architecture

#### 12.5.1 Link Types Per Page

Each landing page automatically links to:

- Related roles (same location)
- Nearby or popular locations (same role)
- Remote variant of the same role
- Internship variant
- Skill pages relevant to the role
- Company pages hiring for this role

#### 12.5.2 Example: `/jobs/software-engineer/in/colombo`

Related links generated:

- Frontend Developer jobs in Colombo
- Backend Developer jobs in Colombo
- Remote Software Engineer jobs
- Software Engineer jobs in Kandy
- Internship Software Engineer jobs
- React jobs, Node.js jobs (top skills)

#### 12.5.3 Benefits

- Distributes page authority across the site
- Improves crawl depth and discovery of deeper pages
- Increases topical relevance signals to Google
- Reduces orphaned pages

---

### 12.6 Structured Data

#### 12.6.1 Schema Types

| Page              | Schema Type      |
| ----------------- | ---------------- |
| Job detail page   | `JobPosting`     |
| All listing pages | `BreadcrumbList` |
| Company page      | `Organization`   |
| Listing pages     | `CollectionPage` |

#### 12.6.2 JobPosting Fields

Each job detail page must include:

- `title`
- `description`
- `datePosted`
- `validThrough` (if deadline available)
- `employmentType`
- `hiringOrganization`
- `jobLocation`
- `directApply` (when applicable)
- `applicantLocationRequirements` (for remote jobs)

#### 12.6.3 BreadcrumbList

Applied to all listing pages to improve search result appearance and click-through rate. Example for `/jobs/software-engineer/in/colombo`:

```
Home > Jobs > Software Engineer > Colombo
```

#### 12.6.4 Rule

Only populate schema fields supported by actual data. Never fabricate values.

---

### 12.7 Sitemap & Crawl Management

#### 12.7.1 Sitemap Coverage

Generate separate XML sitemaps for:

- Job detail pages
- Role pages
- Location pages
- Role + location pages
- Skill pages
- Company pages

#### 12.7.2 Sitemap Rules

- Include only canonical, indexable pages
- Include only pages meeting minimum job thresholds
- Every entry must include a `lastmod` date
- `lastmod` is updated whenever jobs on that page are added, updated, or expired
- Submit sitemap index to Google Search Console

#### 12.7.3 Page Freshness via `lastmod`

Job board pages have a natural freshness advantage — new jobs are constantly added. The `lastmod` field on sitemap entries signals Google to recrawl pages when their content changes. This is critical for ranking in "fresh" query results like "software engineer jobs this week."

**Rule:** Whenever a scrape run adds, updates, or expires jobs associated with an SEO page, that page's `lastmod` in the sitemap is updated to the current date.

#### 12.7.4 Robots Strategy

Use `robots.txt` to:

- Allow all important SEO page paths
- Block admin panel routes
- Block parameterized filter URLs
- Reduce crawl waste on pagination and sort parameters

---

### 12.8 Canonicalization & Duplicate Prevention

#### 12.8.1 Canonical Rules

- Every indexable page carries a self-referencing `<link rel="canonical">`
- All parameterized/filtered URLs point canonical to the base clean URL
- Role and location slugs are normalized to one consistent format before page generation

#### 12.8.2 Duplicate Sources to Manage

| Risk                                         | Prevention                                                  |
| -------------------------------------------- | ----------------------------------------------------------- |
| Multiple URLs for same role/location         | Slug normalization before page generation                   |
| Jobs re-scraped from multiple sources        | Job fingerprint deduplication (see Section 5.4)             |
| Near-identical listing pages                 | Minimum threshold gating + unique template variants         |
| Scraped job descriptions identical to source | Unique structured content added to each job page (see 12.9) |

---

### 12.9 Individual Job Page SEO

Job detail pages carry duplicate content risk because the job description also exists on the company's own career page. Google will typically rank the original source above a scraper for identical content. Each job detail page must therefore add enough unique structured value to justify indexation.

#### 12.9.1 Required Elements

- Unique title tag and H1
- Normalized structured fields (salary, location, employment type)
- Company name and logo
- Posted date and deadline
- Apply link (redirects to source)
- `JobPosting` schema markup
- Related jobs from same company
- Related jobs with same role title

#### 12.9.2 Unique Value Additions

To reduce duplicate content risk and add genuine value beyond the source page:

| Addition                          | Value                                             |
| --------------------------------- | ------------------------------------------------- |
| Skill tags (explicit + inferred)  | Enriches page beyond raw description              |
| Keyword tags                      | Adds topical context not on source page           |
| Normalized salary display         | Source often buries or omits salary               |
| "About [Company]" snippet         | Aggregated from company data, not on job page     |
| "Similar roles at [Company]"      | Cross-links to other jobs, unique to aggregator   |
| "Other [Role] jobs in [Location]" | Internal link cluster, unique to aggregator       |
| Structured summary section        | Clean structured breakdown above full description |

#### 12.9.3 Indexation Decision

Individual job pages should be indexed. However, expired jobs (status = expired) must be handled carefully:

- Do not return 404 immediately — this wastes any link equity the page accumulated
- Set expired job pages to `noindex` and show a "This job is no longer active" message with related active jobs
- After 90 days of expiry, the page can be removed and a 410 Gone response returned

---

### 12.10 Performance & Technical SEO

#### 12.10.1 Technical Requirements

| Requirement             | Implementation                          |
| ----------------------- | --------------------------------------- |
| Fast page loads         | Target < 2s LCP on all SEO pages        |
| Mobile-first responsive | Tailwind CSS responsive layout          |
| Server-side rendering   | Next.js SSR / SSG / ISR                 |
| Core Web Vitals         | Monitor CLS, LCP, FID via GSC           |
| Accessible HTML         | Proper heading hierarchy (H1 → H2 → H3) |
| Image optimization      | Next.js `<Image>` component             |
| Stable internal links   | No broken internal links at any time    |

#### 12.10.2 Next.js Rendering Strategy Per Page Type

| Page Type             | Rendering Strategy    | Rationale                    |
| --------------------- | --------------------- | ---------------------------- |
| Role + location pages | ISR (revalidate: 24h) | Changes daily as jobs update |
| Company pages         | ISR (revalidate: 24h) | Job count changes frequently |
| Job detail pages      | ISR (revalidate: 6h)  | May expire or update         |
| `/jobs` homepage      | SSR                   | Always shows freshest data   |
| Skill pages           | ISR (revalidate: 24h) | Changes with scrape runs     |

---

### 12.11 Programmatic SEO System

#### 12.11.1 Overview

The platform must not rely on manual writing for landing pages. A Programmatic SEO (pSEO) pipeline automatically generates all landing page content from structured job data at scale.

#### 12.11.2 Generation Flow

```
1. Scrape jobs → normalize data
2. Extract entities: role, location, company, skills, work type
3. Aggregate job statistics per entity combination
4. Evaluate each combination against minimum thresholds
5. Generate SEO content from template variants
6. Store output in seo_pages table
7. Next.js reads seo_pages to render landing pages
8. Update sitemap lastmod on content change
```

#### 12.11.3 Page Generation Thresholds

| Page Type            | Minimum Active Jobs              |
| -------------------- | -------------------------------- |
| Role page            | 10                               |
| Location page        | 15                               |
| Role + location page | 5                                |
| Skill page           | 8                                |
| Company page         | 3 (or sufficient company detail) |

Pages below threshold are generated but marked `is_indexable = false` and carry `noindex`.

#### 12.11.4 SEO Input Object Per Page

```json
{
  "pageType": "role_location",
  "role": "Software Engineer",
  "location": "Colombo",
  "jobCount": 124,
  "companyCount": 38,
  "topSkills": ["JavaScript", "React", "Node.js"],
  "jobTypes": ["Full-time", "Internship"],
  "workModes": ["On-site", "Remote"]
}
```

#### 12.11.5 Template-Driven Content Generation

Content is generated using structured templates populated with real data. This is safer and more predictable than uncontrolled AI generation.

**Intro template example:**

> Browse {jobCount} {role} jobs in {location} across {companyCount} companies. Explore {jobTypes} opportunities and discover openings that match skills such as {topSkills}.

**Bottom block template example:**

> {role} jobs in {location} are available across startups and established employers. Opportunities may include {jobTypes} and different work modes such as {workModes}. Candidates with experience in {topSkills} may find relevant openings depending on employer requirements.

#### 12.11.6 Template Variation Strategy

Each page type has 5–10 template variants for intro text, bottom text, and meta description. This reduces cross-page repetition and duplicate content signals.

| Variant | Intro Example                                                                         |
| ------- | ------------------------------------------------------------------------------------- |
| A       | `Explore the latest {role} jobs in {location} from leading employers.`                |
| B       | `Find new {role} openings in {location}, including {jobTypes} opportunities.`         |
| C       | `Discover {role} careers in {location} across multiple industries and company types.` |

#### 12.11.7 Manual Override for High-Value Pages

High-traffic pages like "Software Engineer jobs", "Colombo jobs", "Remote jobs" allow admin manual editing:

- Title, meta description, H1
- Intro text and bottom block
- Related links
- Indexability flag

Manual override is preserved through regeneration cycles (`manual_override = true` prevents auto-overwrite).

#### 12.11.8 Regeneration Triggers

SEO pages are regenerated when:

- Job count on the page changes (new jobs added or expired)
- Company page data is updated
- Scheduled daily refresh (high-traffic pages)
- Scheduled weekly refresh (low-traffic pages)

| Page Traffic   | Refresh Frequency |
| -------------- | ----------------- |
| High-traffic   | Daily             |
| Medium-traffic | Every 3 days      |
| Low-traffic    | Weekly            |

#### 12.11.9 Internal Link Automation

The pSEO system automatically generates related links for each page based on:

- Same role, different location
- Same location, related roles
- Company + role relationships
- Skill-based relations
- Remote and internship variants of the same role

---

### 12.12 Google Search Console Integration

Since the platform is SEO-first, Google Search Console (GSC) data must be accessible directly from the admin panel.

#### 12.12.1 Requirements

| Feature                   | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| Sitemap submission        | Admin can submit/resubmit sitemap index to GSC directly from admin panel |
| Index coverage monitoring | Admin can view which pages are indexed, excluded, or erroring in GSC     |
| Core Web Vitals tracking  | CWV report accessible from admin panel via GSC API                       |
| Search performance        | Impressions, clicks, CTR, average position per page                      |
| Manual URL inspection     | Admin can trigger URL inspection for specific pages                      |

#### 12.12.2 Implementation

GSC data is accessed via the Google Search Console API. Admin panel embeds key GSC metrics alongside each `seo_pages` record so admins can correlate scraper performance with search performance without leaving the admin panel.

#### 12.12.3 Alerts

Admin receives alerts when:

- A high-value page drops out of Google's index
- A significant drop in impressions is detected (>30% week-on-week)
- Sitemap errors are reported by GSC

---

### 12.13 Page Deactivation Strategy

The system must manage the full lifecycle of SEO pages — not just creation. Without a deactivation strategy, the site will accumulate hundreds of thin, empty pages over time which Google penalises.

#### 12.13.1 Deactivation Triggers

A page is deactivated (set to `is_indexable = false`, `noindex` added) when:

- Active job count drops below the minimum threshold for 2 consecutive weeks
- The page has had zero impressions in GSC for 60+ days and fewer than 3 active jobs
- Admin manually deactivates it

#### 12.13.2 Deactivation Behaviour

| Stage                                          | Action                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| Job count drops below threshold                | Page marked `is_indexable = false`, noindex tag added, removed from sitemap |
| Page reactivates (jobs return above threshold) | `is_indexable` restored, re-added to sitemap, `lastmod` updated             |
| Page permanently empty (90+ days)              | Page returns 410 Gone, URL retired                                          |

#### 12.13.3 Grace Period

Pages are not immediately deactivated on the first week below threshold. A 2-week grace period prevents pages from flickering in and out of the index due to temporary job count drops between scrape runs.

---

### 12.14 SEO Quality Control

Before any page is marked indexable, the system validates:

- Minimum active job count met
- Title and meta description are unique (no duplicates in `seo_pages`)
- Intro and bottom text generated without missing variable substitutions
- Canonical URL exists and is correct
- No keyword stuffing detected (word density check on generated content)
- Template output does not contain unfilled placeholders (e.g. `{role}` left unresolved)

Pages failing validation are flagged in the admin panel for review rather than silently published.

---

### 12.15 AI Usage Policy

AI may be used as a controlled enhancement layer for SEO content — not as the uncontrolled source of truth.

| Permitted AI Usage                        | Prohibited AI Usage                       |
| ----------------------------------------- | ----------------------------------------- |
| Refining template wording for readability | Inventing market facts or salary data     |
| Generating additional template variants   | Producing unreviewed paragraphs at scale  |
| Rewriting awkward template outputs        | Publishing content without data grounding |

**For MVP:** Use structured templates exclusively. AI-assisted refinement is an optional later enhancement.

---

### 12.16 SEO Data Models

#### seo_pages

| Column             | Type                 | Description                                                       |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| id                 | UUID                 | Primary key                                                       |
| page_type          | ENUM                 | role, location, role_location, company, skill, remote, internship |
| slug               | VARCHAR              | Full URL path e.g. `/jobs/software-engineer/in/colombo`           |
| role_id            | UUID (nullable)      | FK → roles                                                        |
| location_id        | UUID (nullable)      | FK → locations                                                    |
| company_id         | UUID (nullable)      | FK → companies                                                    |
| skill_id           | UUID (nullable)      | FK → skills                                                       |
| title              | VARCHAR              | Generated SEO title                                               |
| meta_description   | VARCHAR              | Generated meta description                                        |
| h1                 | VARCHAR              | Page H1                                                           |
| intro_text         | TEXT                 | Short intro paragraph                                             |
| bottom_text        | TEXT                 | Bottom SEO content block                                          |
| canonical_url      | VARCHAR              | Full canonical URL                                                |
| related_links_json | JSONB                | Auto-generated internal links                                     |
| is_indexable       | BOOLEAN              | Whether page should be indexed                                    |
| content_version    | INTEGER              | Increments on each regeneration                                   |
| last_generated_at  | TIMESTAMP            | Last content generation time                                      |
| last_reviewed_at   | TIMESTAMP (nullable) | Last admin review time                                            |
| manual_override    | BOOLEAN              | Prevents auto-overwrite if true                                   |
| lastmod            | DATE                 | Updated when jobs on this page change (used in sitemap)           |
| created_at         | TIMESTAMP            |                                                                   |

#### roles

| Column | Type    | Description          |
| ------ | ------- | -------------------- |
| id     | UUID    | Primary key          |
| name   | VARCHAR | Normalized role name |
| slug   | VARCHAR | URL-safe slug        |

#### locations

| Column  | Type    | Description              |
| ------- | ------- | ------------------------ |
| id      | UUID    | Primary key              |
| name    | VARCHAR | Normalized location name |
| slug    | VARCHAR | URL-safe slug            |
| country | VARCHAR | Country                  |

#### skills (extended from job_skills)

| Column | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| id     | UUID    | Primary key                             |
| name   | VARCHAR | Skill name                              |
| slug   | VARCHAR | URL-safe slug for `/jobs/skills/[slug]` |

---

### 12.17 SEO Functional Requirements

| ID        | Requirement                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FR-SEO-1  | System shall generate SEO landing pages for all role, location, role+location, skill, and company combinations meeting threshold rules |
| FR-SEO-2  | System shall generate unique metadata (title, description, canonical) for every indexable page                                         |
| FR-SEO-3  | System shall generate intro and bottom SEO content from structured template variants                                                   |
| FR-SEO-4  | System shall store all generated SEO content in the `seo_pages` table                                                                  |
| FR-SEO-5  | System shall allow admin manual override of any SEO page fields                                                                        |
| FR-SEO-6  | System shall generate internal related links automatically for each page                                                               |
| FR-SEO-7  | System shall generate XML sitemaps with `lastmod` dates for all indexable pages                                                        |
| FR-SEO-8  | System shall update `lastmod` whenever jobs associated with an SEO page change                                                         |
| FR-SEO-9  | System shall mark pages as `noindex` when job count drops below threshold for 2 consecutive weeks                                      |
| FR-SEO-10 | System shall return 410 Gone for permanently retired pages after 90 days of deactivation                                               |
| FR-SEO-11 | System shall implement `JobPosting` and `BreadcrumbList` schema on all relevant pages                                                  |
| FR-SEO-12 | System shall integrate with Google Search Console API for indexation monitoring from admin panel                                       |
| FR-SEO-13 | System shall alert admin when high-value pages drop from Google index or lose significant impressions                                  |
| FR-SEO-14 | System shall validate all generated pages against quality rules before marking indexable                                               |
| FR-SEO-15 | System shall generate `/jobs/skills/[skill-slug]` pages for all skills meeting minimum job threshold                                   |

---

### 12.18 MVP SEO Scope

**Include in v1.0:**

- Role pages (`/jobs/[role]`)
- Location pages (`/jobs/in/[location]`)
- Role + location pages (`/jobs/[role]/in/[location]`)
- Skill pages (`/jobs/skills/[skill]`)
- Company pages (`/companies/[company]`)
- Remote jobs page (`/remote-jobs`)
- Internships page (`/internships`)
- Dynamic metadata generation
- Template-based intro and bottom SEO text
- Sitemap generation with `lastmod`
- Canonical handling
- Internal related links
- `JobPosting` and `BreadcrumbList` schema
- Manual override for high-value pages
- Page deactivation logic
- Google Search Console API integration in admin panel

**Defer to v2.0:**

- Industry/category pages (`/industry/[slug]`)
- AI-assisted content refinement
- Automated GSC impression drop alerts
- Advanced topical clustering

---

## 13. Deployment Architecture

### 13.1 Overview

The MVP deployment uses two services — Cloudflare Workers for the frontend and AWS Lightsail for the backend and scraper. This combination prioritises low cost, simplicity, and predictable billing while staying within the AWS ecosystem for future scaling.

```
┌─────────────────────────────────┐       ┌──────────────────────────────────────┐
│     CLOUDFLARE WORKERS ($5/mo)  │       │     AWS LIGHTSAIL MEDIUM ($20/mo)    │
│                                 │       │                                      │
│   Next.js Frontend              │──────▶│   NestJS Backend API                 │
│   Edge-rendered pages           │       │   Scraper Service (Playwright)       │
│   ISR cached at edge globally   │       │   Bull Job Queue                     │
│   Zero egress fees              │       │   Redis                              │
│                                 │       │   PostgreSQL                         │
└─────────────────────────────────┘       │   (4GB RAM / 2vCPU / 80GB SSD)      │
                                          └──────────────────────────────────────┘
                                                          │
                                                          ▼
                                          ┌──────────────────────────────────────┐
                                          │     AWS SES (~$1/mo)                 │
                                          │   Transactional email alerts         │
                                          └──────────────────────────────────────┘
```

---

### 13.2 Frontend — Cloudflare Workers

| Property    | Detail                                          |
| ----------- | ----------------------------------------------- |
| Service     | Cloudflare Workers Paid Plan                    |
| Framework   | Next.js via `@cloudflare/next-on-pages`         |
| Runtime     | Edge Runtime (Cloudflare V8 isolates)           |
| Rendering   | ISR for SEO pages, SSR for live listing feeds   |
| CDN         | Global edge — 300+ locations worldwide          |
| Egress fees | None — Cloudflare does not charge for bandwidth |
| Cost        | $5/month flat                                   |

**Why Cloudflare Workers over alternatives:**

- Pages are served from the nearest edge location to the user — critical for Core Web Vitals and SEO rankings
- No bandwidth charges regardless of traffic volume — scales freely
- ISR-cached SEO pages serve near-instantly from edge cache
- $5/month covers unlimited requests within fair use

**Edge Runtime constraint:** Next.js on Cloudflare Workers must use the Edge Runtime. Standard Node.js-specific APIs are not available in edge functions. All data fetching calls the Lightsail backend API — no direct database access from the frontend.

---

### 13.3 Backend & Scraper — AWS Lightsail

| Property  | Detail                                                |
| --------- | ----------------------------------------------------- |
| Service   | AWS Lightsail                                         |
| Plan      | Medium — 4GB RAM / 2 vCPU / 80GB SSD / 4TB transfer   |
| OS        | Ubuntu 24.04 LTS                                      |
| Cost      | $20/month flat (compute + storage + transfer bundled) |
| Processes | NestJS API, Scraper Worker, Redis, PostgreSQL         |

**Why Lightsail over EC2 t3.medium:**

|               | Lightsail Medium | EC2 t3.medium + EBS     |
| ------------- | ---------------- | ----------------------- |
| RAM           | 4GB              | 4GB                     |
| vCPU          | 2                | 2                       |
| Storage       | 80GB included    | ~$3.20/month extra      |
| Data transfer | 4TB included     | $0.09/GB after 1GB free |
| Monthly cost  | **$20.00**       | **~$34.00**             |

Lightsail delivers identical specs for $14/month less with no surprise egress charges.

**Process isolation on the instance:**
The NestJS backend API and the Playwright scraper run as separate Node.js processes managed by PM2. This ensures a scraper crash does not take down the API, and each process can be restarted independently.

```
PM2 Process List:
├── nestjs-api        (NestJS backend — always running)
├── scraper-worker    (Bull worker — always running, idle between scrapes)
└── redis-server      (job queue — always running)
```

---

### 13.4 Database — PostgreSQL on Lightsail

PostgreSQL runs directly on the Lightsail instance rather than a separate managed RDS database. This eliminates the ~$22/month RDS cost for MVP.

| Property          | Detail                                                       |
| ----------------- | ------------------------------------------------------------ |
| Engine            | PostgreSQL 16                                                |
| Location          | On Lightsail instance (localhost)                            |
| Storage           | Within the 80GB SSD included in Lightsail plan               |
| Backups           | Manual daily pg_dump to Lightsail Snapshots ($0.03/GB/month) |
| Estimated DB size | 5–15GB growing over time                                     |

**Backup strategy:**
A daily cron job runs `pg_dump` and stores the compressed backup file locally. Lightsail instance snapshots (full disk backup) are taken weekly at ~$0.03/GB — for a 40GB used disk that's approximately $1.20/month.

**Migration path to RDS:**
When traffic grows and database reliability becomes critical, migrating from on-instance PostgreSQL to AWS RDS is straightforward using pg_dump/pg_restore. No application code changes needed — only the connection string changes.

---

### 13.5 Email — AWS SES

| Property         | Detail                                    |
| ---------------- | ----------------------------------------- |
| Service          | AWS Simple Email Service (SES)            |
| Usage            | Transactional email alerts to job seekers |
| Cost             | $0.10 per 1,000 emails sent               |
| Estimated volume | ~5,000–10,000 emails/month at scale       |
| Estimated cost   | ~$0.50–$1.00/month                        |

SES is already within the AWS ecosystem and integrates directly with the Lightsail instance via the SES API or SMTP interface.

---

### 13.6 Scraper Concurrency Limit

To prevent Playwright from consuming all available RAM on the 4GB Lightsail instance and starving the backend API, the Bull job queue worker is configured with a hard concurrency cap:

```javascript
const scraperWorker = new Worker('scraper', processJob, {
  concurrency: 3, // Maximum 3 simultaneous Playwright browser instances
});
```

**Memory budget at max concurrency:**

| Process                  | Memory       |
| ------------------------ | ------------ |
| Ubuntu OS                | ~400MB       |
| NestJS API               | ~200MB       |
| Redis                    | ~50MB        |
| PostgreSQL               | ~150MB       |
| 3× Playwright (Chromium) | ~1,200MB     |
| Node.js scraper process  | ~150MB       |
| **Total**                | **~2,150MB** |

This leaves ~1,850MB of headroom on the 4GB instance — sufficient buffer to prevent OOM (out of memory) crashes.

**Scrape run duration estimate:**
1,000 companies at concurrency 3, ~5 seconds average per site = approximately 90 minutes per full weekly run. Acceptable for a once-per-week scheduled job.

---

### 13.7 Migration Path

Lightsail is intentionally chosen as a starting point — not a permanent home. As the platform grows, the migration path is clear and non-disruptive:

| Trigger                                       | Migration                                            |
| --------------------------------------------- | ---------------------------------------------------- |
| API response times degrade under traffic      | Move backend to EC2 t3.medium + auto-scaling         |
| Scraper needs more RAM for higher concurrency | Move scraper to dedicated EC2 t3.large               |
| Database reliability becomes critical         | Migrate PostgreSQL to AWS RDS with automated backups |
| Traffic exceeds 4TB/month data transfer       | Move to EC2 with CloudFront CDN                      |

All migrations are incremental — each component can move independently without rebuilding the entire system.

---

## 14. Cost Analysis

### 14.1 MVP Monthly Infrastructure Cost

| Component                           | Service                 | Cost       |
| ----------------------------------- | ----------------------- | ---------- |
| Next.js Frontend                    | Cloudflare Workers Paid | $5.00      |
| Backend + Scraper + DB              | AWS Lightsail Medium    | $20.00     |
| Lightsail Snapshots (weekly backup) | ~40GB × $0.03           | $1.20      |
| Email Alerts                        | AWS SES (~10k emails)   | $1.00      |
| **Infrastructure Subtotal**         |                         | **$27.20** |

---

### 14.2 LLM Cost Breakdown

Scraping frequency: once per week (4 runs/month)

| Metric                                  | Value                          |
| --------------------------------------- | ------------------------------ |
| Total companies                         | 1,000                          |
| ATS adapter coverage (~65%)             | ~650 companies — zero LLM cost |
| Custom pages requiring LLM (~35%)       | ~350 companies                 |
| Pages with unchanged hash (skipped)     | ~70% of custom pages per run   |
| Effective LLM calls per run             | ~105 pages                     |
| Avg input tokens per page               | ~3,000                         |
| Avg output tokens per page              | ~800                           |
| Model                                   | Claude Haiku 4.5               |
| Input cost ($1.00/MTok)                 | ~$0.32/run                     |
| Output cost ($5.00/MTok)                | ~$0.42/run                     |
| **Cost per run**                        | **~$0.74**                     |
| **Monthly (4 runs, Batch API 50% off)** | **~$1.48**                     |

---

### 14.3 Total Monthly Cost Summary

| Category                                                  | Monthly Cost      |
| --------------------------------------------------------- | ----------------- |
| Infrastructure (Lightsail + Cloudflare + SES + Snapshots) | $27.20            |
| LLM Extraction (Claude Haiku 4.5, Batch API)              | ~$1.48            |
| **Grand Total**                                           | **~$28.68/month** |

---

### 14.4 Cost Scaling Projections

| Stage                     | Description                                         | Est. Monthly Cost |
| ------------------------- | --------------------------------------------------- | ----------------- |
| **MVP**                   | Lightsail Medium + Cloudflare Workers               | ~$29              |
| **Growth**                | EC2 t3.medium (API) + EC2 t3.large (Scraper) + RDS  | ~$127             |
| **Growth (Reserved 1yr)** | Same as above with 1-year reserved instances        | ~$85              |
| **Scale**                 | EC2 + RDS Multi-AZ + CloudFront + Redis ElastiCache | ~$250+            |

**Key insight:** The platform can run at full MVP capacity — 1,000 companies, weekly scraping, public job board, email alerts, admin panel — for under **$30/month**. Revenue from even a single sponsored card advertiser ($150–400/month) covers infrastructure costs entirely.

---

## 15. Out of Scope

The following items are explicitly out of scope for version 1.0:

- User accounts / login for job seekers
- Job bookmarking / saved jobs
- Direct job application via the platform
- Mobile native app
- CAPTCHA solving
- Social media integration
- Job recommendation engine / ML-based matching
- Multi-language support

---

_End of SRS v3.0_
