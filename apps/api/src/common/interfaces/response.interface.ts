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
