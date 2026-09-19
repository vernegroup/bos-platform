"use server";

import argon2 from "argon2";
import {
  consumeAuthToken,
  findUserForPasswordReset,
  issueAuthToken,
  setUserPasswordHash,
} from "@/lib/bos/authRepository";
import { sendPasswordResetEmail } from "@/lib/bos/email";

export type ForgotPasswordState = {
  status: "idle" | "success";
  message?: string;
};

export type ResetPasswordState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const GENERIC_MESSAGE =
  "Jeżeli istnieje aktywne konto z tym adresem e-mail, wysłaliśmy instrukcję ustawienia nowego hasła.";

export async function forgotPasswordAction(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { status: "success", message: GENERIC_MESSAGE };
  }

  const user = await findUserForPasswordReset(email);
  if (!user) return { status: "success", message: GENERIC_MESSAGE };

  const token = await issueAuthToken(String(user.id), "RESET_PASSWORD", 60);

  try {
    await sendPasswordResetEmail({
      to: String(user.email),
      displayName: String(user.display_name || "Użytkowniku"),
      token,
    });
  } catch (error) {
    console.error("[password.reset.request] email failed", {
      error: error instanceof Error ? error.message : "UNKNOWN_EMAIL_ERROR",
    });
  }

  return { status: "success", message: GENERIC_MESSAGE };
}

export async function resetPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!token) return { status: "error", message: "Link do zmiany hasła jest nieprawidłowy lub wygasł." };
  if (password.length < 12) return { status: "error", message: "Hasło musi mieć co najmniej 12 znaków." };
  if (password !== passwordConfirm) return { status: "error", message: "Hasła nie są identyczne." };

  const consumed = await consumeAuthToken(token, "RESET_PASSWORD");
  if (!consumed) return { status: "error", message: "Link do zmiany hasła jest nieprawidłowy, wygasł lub został już użyty." };

  const passwordHash = await argon2.hash(password);
  await setUserPasswordHash(consumed.userId, passwordHash);

  return { status: "success", message: "Hasło zostało zmienione. Możesz teraz zalogować się do BOS." };
}
