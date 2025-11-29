// Generic Result pattern for service layer responses

import type { ApiError } from './error.types';

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

