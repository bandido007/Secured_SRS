import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (isAxiosError(error)) {
    const data = error.response?.data as { response?: { message?: string }; detail?: string; message?: string } | undefined;
    return (
      data?.response?.message ??
      data?.detail ??
      data?.message ??
      error.response?.statusText ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
