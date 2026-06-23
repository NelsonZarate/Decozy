// Central API client for the Decozy FastAPI backend.
//
// All endpoints live under `${NEXT_PUBLIC_API_URL}` (defaults to the local
// backend). This module also handles the JWT bearer token (persisted in
// localStorage) and exposes `assetUrl()` to turn the backend's relative
// `/static/...` paths into absolute, browser-loadable URLs.

/** Base URL including the `/api/v1` prefix. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

/** Backend origin (without the `/api/v1` prefix), used for static assets. */
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

const TOKEN_KEY = "decozy.auth.token";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

/** Turn a backend-relative asset path (e.g. `/static/...`) into an absolute URL. */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  /** JSON-serialisable body. Mutually exclusive with `formData`. */
  json?: unknown;
  /** Raw body (FormData / URLSearchParams). Sets no JSON content-type. */
  body?: BodyInit;
  /** Attach the bearer token when available. Defaults to true. */
  auth?: boolean;
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, body, auth = true, headers = {} } = options;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined = body;

  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
      else if (Array.isArray(data?.detail)) detail = data.detail[0]?.msg ?? detail;
    } catch {
      // Non-JSON error body; keep statusText.
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
}

export interface UserInfo {
  id: number;
  email: string;
  plan: string;
  daily_generations_count: number;
  last_generation_date: string | null;
  created_at: string | null;
}

export interface ProjectSummary {
  id: number;
  title: string;
  is_favorite: boolean;
  created_at: string;
}

export interface ProjectImage {
  id: number;
  type: string; // "original" | "generated"
  url: string;
}

export interface ProjectDetails {
  id: number;
  title: string;
  is_favorite: boolean;
  created_at: string | null;
  generation_status: string; // "processing" | "completed" | "failed" | "unknown"
  generation_error: string | null;
  images: ProjectImage[];
}

export interface ProjectItem {
  id: number;
  name: string;
  category: string | null;
  price: string | null;
  image_url: string | null;
  buy_url: string | null;
}

export interface UploadResponse {
  message: string;
  project_id: number;
  status: string;
  user_prompt: string;
}

export interface SavedItem {
  id: number;
  user_id: number;
  item_id: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function registerLocal(email: string, password: string): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/register", {
    method: "POST",
    json: { email, password },
    auth: false,
  });
}

export function loginLocal(email: string, password: string): Promise<AuthTokenResponse> {
  // The backend uses OAuth2PasswordRequestForm: x-www-form-urlencoded with
  // `username` + `password` fields.
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return request<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: form,
    auth: false,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export function loginGoogle(idToken: string): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/google", {
    method: "POST",
    json: { id_token: idToken },
    auth: false,
  });
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export function getUserInfo(): Promise<UserInfo> {
  return request<UserInfo>("/User/get_user_info");
}

export function listSavedItems(): Promise<SavedItem[]> {
  return request<SavedItem[]>("/User/list_saved_items");
}

export function saveItem(itemId: number): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/User/save_item/${itemId}`, { method: "POST" });
}

export function deleteSavedItem(itemId: number): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/User/delete_saved_item/${itemId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>("/projects/list_projects");
}

export function getProject(projectId: number): Promise<ProjectDetails> {
  return request<ProjectDetails>(`/projects/get_project/${projectId}`);
}

export function createProject(title: string): Promise<ProjectSummary> {
  return request<ProjectSummary>(`/projects/create_project?title=${encodeURIComponent(title)}`, {
    method: "POST",
  });
}

export function getProjectItems(projectId: number): Promise<ProjectItem[]> {
  return request<ProjectItem[]>(`/projects/get_project_items/${projectId}`);
}

export function changeProjectTitle(projectId: number, newTitle: string): Promise<ProjectSummary> {
  return request<ProjectSummary>(
    `/projects/change_project_title/${projectId}?new_title=${encodeURIComponent(newTitle)}`,
    { method: "PUT" },
  );
}

export function deleteProject(projectId: number): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/projects/delete_project/${projectId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Uploads / generation
// ---------------------------------------------------------------------------

export function uploadImage(file: Blob, userPrompt: string): Promise<UploadResponse> {
  const form = new FormData();
  const fileToSend =
    file instanceof File ? file : new File([file], "upload.png", { type: file.type || "image/png" });
  form.append("file", fileToSend);
  form.append("user_prompt", userPrompt);
  return request<UploadResponse>("/uploads/", { method: "POST", body: form });
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export function createCheckoutSession(
  projectId: number,
  itemIds: number[],
): Promise<{ checkout_url: string }> {
  return request<{ checkout_url: string }>("/payments/create-checkout-session", {
    method: "POST",
    json: { project_id: projectId, item_ids: itemIds },
  });
}

// ---------------------------------------------------------------------------
// Tokens / credits
// ---------------------------------------------------------------------------

export interface TokenBalance {
  tokens: number;
  email: string;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  price_eur: number;
}

export interface VerifyTokenSessionResponse {
  status: string; // "paid" | "unpaid"
  tokens_credited: number;
  balance?: number;
}

/** Current authenticated user's token (credit) balance. */
export function getTokenBalance(): Promise<TokenBalance> {
  return request<TokenBalance>("/tokens/balance");
}

/** Token packages offered by the backend (source of truth for pricing). */
export function listTokenPackages(): Promise<TokenPackage[]> {
  return request<TokenPackage[]>("/tokens/packages", { auth: false });
}

/**
 * Start a token purchase. Returns the Stripe Checkout URL to redirect to.
 * Requires authentication (the backend ties the purchase to the user).
 */
export function purchaseTokens(packageId: string): Promise<{ checkout_url: string }> {
  return request<{ checkout_url: string }>("/tokens/purchase", {
    method: "POST",
    json: { package_id: packageId },
  });
}

/**
 * Verify a completed Checkout Session and credit the tokens to the user.
 * Idempotent on the backend (a session is only credited once).
 */
export function verifyTokenSession(sessionId: string): Promise<VerifyTokenSessionResponse> {
  return request<VerifyTokenSessionResponse>(
    `/tokens/verify-session/${encodeURIComponent(sessionId)}`,
  );
}
