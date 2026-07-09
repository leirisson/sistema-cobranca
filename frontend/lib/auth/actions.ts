"use server";

import { redirect } from "next/navigation";

import { CredenciaisInvalidasError, loginApi } from "../api/auth";
import { clearSessionCookie, setSessionCookie } from "./session";

export interface LoginState {
  error?: string;
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const senha = formData.get("senha");

  if (typeof email !== "string" || !email.trim() || typeof senha !== "string" || !senha) {
    return { error: "Informe e-mail e senha." };
  }

  try {
    const token = await loginApi(email.trim(), senha);
    await setSessionCookie(token);
  } catch (error) {
    if (error instanceof CredenciaisInvalidasError) {
      return { error: error.message };
    }

    return { error: "Não foi possível entrar. Tente novamente em instantes." };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
