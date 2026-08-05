import { PaginationType } from '@careerslk/types';
export interface AiJob {
  title: string;
  location: string | null;
  city: string | null;
  work_mode: 'hybrid' | 'remote' | 'onsite' | null;
  employment_type:
    | 'Full-time'
    | 'Part-time'
    | 'Contract'
    | 'Internship'
    | 'Freelance'
    | null;
  role_category: string | null;
  description: string | null;
  apply_url: string | null;
  keywords: string[];
}

export interface AiCompanyInfo {
  name: string | null;
  website_url: string | null;
  logo_url: string | null;
  ats_platform: string | null;
}

export interface AiHtmlContainer {
  selector: string | null;
  type: 'id' | 'class' | 'data-attribute' | 'semantic' | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  paginationButton: string | null;
  paginationType: PaginationType | null;
  paginationReason: string;
}

export interface AiCompanyParsed {
  company: AiCompanyInfo;
  container: AiHtmlContainer;
}

export interface AiParsedResult {
  company?: AiCompanyInfo;
  container?: AiHtmlContainer;
  jobs: AiJob[];
}
