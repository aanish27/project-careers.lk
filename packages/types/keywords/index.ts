export * from './schemas';

export interface Keyword {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordWithJobCount extends Keyword {
  _count: { jobs: number };
}

export interface JobKeyword {
  jobId: number;
  keywordId: number;
  editedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}
