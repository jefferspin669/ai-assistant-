export type ApiResponse<T> =
  | { success: true; ok: true; data: T }
  | { success: false; ok: false; error: string; status: number };

export type ApiResult<T> = ApiResponse<T>;
export type ApiOk<T> = Extract<ApiResponse<T>, { success: true }>;
export type ApiErr = Extract<ApiResponse<unknown>, { success: false }>;

export function ok<T>(data: T): ApiOk<T> {
  return { success: true, ok: true, data };
}

export function err(error: string, status = 400): ApiErr {
  return { success: false, ok: false, error, status };
}
