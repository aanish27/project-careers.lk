export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ResponseMeta;
}

export interface ResponseMeta {
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
  pagination?: PaginationMeta;
  cursorPagination?: CursorPaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface CursorPaginationResult<T> {
  items: T[];
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string[];
  };
  meta: {
    statusCode: number;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
