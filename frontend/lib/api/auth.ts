import "server-only";

import { ApiError, apiFetch } from "./client";

interface LoginResponse {
  token: string;
}

export async function loginApi(email: string, senha: string): Promise<string> {
  try {
    const { token } = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, senha },
      semSessao: true,
    });

    return token;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new CredenciaisInvalidasError();
    }

    throw error;
  }
}

export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.");
    this.name = "CredenciaisInvalidasError";
  }
}
