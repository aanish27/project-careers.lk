import { ALL_CATEGORIES, ALL_CITIES } from '@careerslk/types';

const ROLE_CATEGORY_PROPERTY = {
  anyOf: [{ type: 'string', enum: [...ALL_CATEGORIES] }, { type: 'null' }],
} as const;

const CITY_PROPERTY = {
  anyOf: [{ type: 'string', enum: [...ALL_CITIES] }, { type: 'null' }],
} as const;

export const CLAUDE_SCHEMA_COMPANY = {
  format: {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        company: {
          type: 'object',
          properties: {
            name: { type: ['string', 'null'] },
            website_url: { type: ['string', 'null'] },
            logo_url: { type: ['string', 'null'] },
            ats_platform: { type: ['string', 'null'] },
          },
          required: ['name', 'website_url', 'logo_url', 'ats_platform'],
          additionalProperties: false,
        },
        container: {
          type: 'object',
          properties: {
            selector: { type: ['string', 'null'] },
            type: {
              anyOf: [
                {
                  type: 'string',
                  enum: ['id', 'class', 'data-attribute', 'semantic'],
                },
                { type: 'null' },
              ],
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            reason: { type: 'string' },
            paginationButton: { type: ['string', 'null'] },
            paginationType: {
              anyOf: [
                {
                  type: 'string',
                  enum: [
                    'infinite_scrolling',
                    'load_more_button',
                    'next_button',
                    'pagination_numbers',
                  ],
                },
                { type: 'null' },
              ],
            },
            paginationReason: { type: 'string' },
          },
          required: ['selector', 'type', 'confidence', 'reason'],
          additionalProperties: false,
        },
      },
      required: ['company', 'container'],
      additionalProperties: false,
    },
  },
} as const;

export const CLAUDE_SCHEMA_COMPANY_JOBS = {
  format: {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        company: {
          type: 'object',
          properties: {
            name: { type: ['string', 'null'] },
            website_url: { type: ['string', 'null'] },
            logo_url: { type: ['string', 'null'] },
          },
          required: ['name', 'website_url', 'logo_url'],
          additionalProperties: false,
        },
        container: {
          type: 'object',
          properties: {
            selector: { type: ['string', 'null'] },
            type: {
              anyOf: [
                {
                  type: 'string',
                  enum: ['id', 'class', 'data-attribute', 'semantic'],
                },
                { type: 'null' },
              ],
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            reason: { type: 'string' },
            paginationButton: { type: ['string', 'null'] },
            paginationType: {
              anyOf: [
                {
                  type: 'string',
                  enum: [
                    'infinite_scrolling',
                    'load_more_button',
                    'next_button',
                    'pagination_numbers',
                  ],
                },
                { type: 'null' },
              ],
            },
            paginationReason: { type: 'string' },
          },
          required: ['selector', 'type', 'confidence', 'reason'],
          additionalProperties: false,
        },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              location: { type: ['string', 'null'] },
              city: CITY_PROPERTY,
              work_mode: {
                type: 'string',
                enum: ['hybrid', 'remote', 'onsite'],
              },
              employment_type: {
                anyOf: [
                  {
                    type: 'string',
                    enum: [
                      'full_time',
                      'part_time',
                      'contract',
                      'internship',
                      'freelance',
                    ],
                  },
                  { type: 'null' },
                ],
              },
              role_category: ROLE_CATEGORY_PROPERTY,
              description: { type: ['string', 'null'] },
              apply_url: { type: 'string' },
              keywords: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'title',
              'location',
              'city',
              'work_mode',
              'employment_type',
              'role_category',
              'description',
              'apply_url',
              'keywords',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['company', 'container', 'jobs'],
      additionalProperties: false,
    },
  },
} as const;

export const CLAUDE_SCHEMA_JOBS = {
  format: {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              location: { type: ['string', 'null'] },
              city: CITY_PROPERTY,
              work_mode: {
                type: 'string',
                enum: ['hybrid', 'remote', 'onsite'],
              },
              employment_type: {
                anyOf: [
                  {
                    type: 'string',
                    enum: [
                      'full-time',
                      'part-time',
                      'contract',
                      'internship',
                      'freelance',
                    ],
                  },
                  { type: 'null' },
                ],
              },
              role_category: ROLE_CATEGORY_PROPERTY,
              description: { type: ['string', 'null'] },
              apply_url: { type: 'string' },
              keywords: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'title',
              'location',
              'city',
              'work_mode',
              'employment_type',
              'role_category',
              'description',
              'apply_url',
              'keywords',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['jobs'],
      additionalProperties: false,
    },
  },
} as const;
