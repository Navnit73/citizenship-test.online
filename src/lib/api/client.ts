import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  baseURL?: string;
  adapter?: AxiosAdapter;
  retries?: number;
  retryDelayMs?: number;
};
type RetryConfig = InternalAxiosRequestConfig & { __retry?: number };

/** Single typed client: normalises errors and retries network/5xx failures. */
export function createApiClient({
  baseURL = "/api",
  adapter,
  retries = 2,
  retryDelayMs = 300,
}: Options = {}): AxiosInstance {
  const client = axios.create({ baseURL, adapter, timeout: 15_000 });

  client.interceptors.response.use(undefined, async (error) => {
    if (error instanceof ApiError) throw error;
    const config = error.config as RetryConfig | undefined;
    const status: number = error.response?.status ?? 0;
    const retryable = status === 0 || status >= 500;
    if (config && retryable && (config.__retry ?? 0) < retries) {
      config.__retry = (config.__retry ?? 0) + 1;
      await new Promise((r) => setTimeout(r, retryDelayMs * config.__retry!));
      return client.request(config);
    }
    throw new ApiError(error.response?.data?.error ?? error.message ?? "Request failed", status);
  });

  return client;
}

export const apiClient = createApiClient();
