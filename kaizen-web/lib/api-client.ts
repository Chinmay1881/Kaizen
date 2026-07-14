const API_VERSION_PATH = "/api/v1";

/** `NEXT_PUBLIC_API_URL` is set per-deployment (Railway, Vercel, local `.env`) and is easy to get
 * wrong in exactly one way: pointing it at the backend's bare origin and forgetting the `/api/v1`
 * prefix every route actually lives under (e.g. `https://backend.up.railway.app` instead of
 * `https://backend.up.railway.app/api/v1`). That mistake doesn't error — it just silently sends
 * every request to the wrong path (`/me` instead of `/api/v1/me`), which 404s or gets blocked by
 * CORS with no clear signal why. Normalizing here means the env var works whether or not whoever
 * configured it remembered the suffix. */
function normalizeApiUrl(rawUrl: string): string {
  const withoutTrailingSlash = rawUrl.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith(API_VERSION_PATH)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}${API_VERSION_PATH}`;
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1");

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

  // A `FormData` body must NOT get a manual `Content-Type` — the browser needs to generate its own
  // `multipart/form-data; boundary=...` header, and setting one here (even the default JSON one)
  // corrupts the upload. Every other call site is unaffected since none of them pass FormData.
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
