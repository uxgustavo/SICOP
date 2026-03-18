export interface Result<T> {
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

export function fail<T = any>(error: string): Result<T> {
  return { data: null, error };
}
