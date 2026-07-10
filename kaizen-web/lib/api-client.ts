const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiClientOptions extends RequestInit {
  token?: string;
}

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  // 204 No Content (e.g. every DELETE in this API) has no body — `.json()` on an empty response
  // throws ("Unexpected end of JSON input"), which would otherwise make a successful delete look
  // like a failure to every caller.
  const rawBody = response.status === 204 ? "" : await response.text();
  const body: unknown = rawBody ? JSON.parse(rawBody) : null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;

    if (errorBody.error) {
      throw new ApiError(
        errorBody.error.code,
        errorBody.error.message,
        response.status,
        errorBody.error.details,
      );
    }

    throw new ApiError("INTERNAL_ERROR", "An unexpected error occurred.", response.status);
  }

  return body as T;
}

export function getApiBaseUrl(): string {
  return API_URL;
}
