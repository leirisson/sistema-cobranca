import "server-only";

import { redirect } from "next/navigation";

import { clearSessionCookie, getSessionToken } from "../auth/session";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Não redireciona em 401 — usado pelo próprio login, que espera 401 como resultado esperado. */
  semSessao?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, semSessao, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (!semSessao) {
    const token = await getSessionToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 401 && !semSessao) {
    await clearSessionCookie();
    redirect("/login");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error ?? "Não foi possível completar a operação.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}
