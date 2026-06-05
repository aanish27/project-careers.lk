import { PaginationType } from './enum';

export interface ClaudeJob {
  title: string;
  location: string | null;
  work_mode: 'hybrid' | 'remote' | 'onsite' | null;
  employment_type:
    | 'Full-time'
    | 'Part-time'
    | 'Contract'
    | 'Internship'
    | 'Freelance'
    | null;
  role_category: string | null;
  department: string | null;
  description: string | null;
  apply_url: string | null;
  keywords: string[];
}

export interface ClaudeParsedResult {
  company?: {
    name: string | null;
    website_url: string | null;
    logo_url: string | null;
  };
  container?: {
    selector: string | null;
    type: 'id' | 'class' | 'data-attribute' | 'semantic' | null;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    paginationButton: string | null;
    paginationType: PaginationType | null;
    paginationReason: string;
  };
  jobs: ClaudeJob[];
}
