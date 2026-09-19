"use server";

import { registerCompanyAccount } from "@/lib/bos/registrationRepository";
import { sendVerificationEmail } from "@/lib/bos/email";
import { findUserForEmailVerification, issueAuthToken } from "@/lib/bos/authRepository";

export type RegisterState = {
  status: "idle" | "error" | "success";
  message?: string;
  email?: string;
  emailSent?: boolean;
};

export type ResendVerificationState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function registerCompanyAction(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  const email = value(formData, "email").toLowerCase();
  const companyName = value(formData, "companyName");
  const taxId = value(formData, "taxId");
  const country = value(formData, "country") || "PL";
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!firstName || !lastName || !email || !companyName || !taxId || !country || !password) {
    return { status: "error", message: "Uzupełnij wszystkie wymagane pola." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { status: "error", message: "Podaj prawidłowy adres e-mail." };
  }
  if (password.length < 12) {
    return { status: "error", message: "Hasło musi mieć co najmniej 12 znaków." };
  }
  if (password !== passwordConfirm) {
    return { status: "error", message: "Hasła nie są identyczne." };
  }

  const result = await registerCompanyAccount({
    firstName, lastName, email, password, companyName, taxId, country,
  });

  if (!result.ok) {
    if (result.reason === "ACCOUNT_EXISTS") {
      return {
        status: "error",
        message: "Nie można utworzyć konta z podanymi danymi. Spróbuj się zalogować lub odzyskać hasło.",
      };
    }
    return { status: "error", message: "Nie udało się utworzyć konta." };
  }

  try {
    await sendVerificationEmail({
      to: email,
      displayName: `${firstName} ${lastName}`,
      token: result.verificationToken,
    });
  } catch (error) {
    console.error("[register] verification email failed", {
      error: error instanceof Error ? error.message : "UNKNOWN_EMAIL_ERROR",
    });
    return {
      status: "success",
      email,
      emailSent: false,
      message: "Konto zostało utworzone, ale wiadomość weryfikacyjna nie została wysłana. Użyj przycisku poniżej, aby spróbować ponownie.",
    };
  }

  return {
    status: "success",
    email,
    emailSent: true,
    message: "Konto firmowe zostało utworzone. Sprawdź pocztę i potwierdź adres e-mail, aby aktywować konto.",
  };
}

export async function resendVerificationAction(
  _previousState: ResendVerificationState,
  formData: FormData,
): Promise<ResendVerificationState> {
  const email = value(formData, "email").toLowerCase();
  const genericMessage = "Jeżeli konto oczekuje na weryfikację, wysłaliśmy nową wiadomość.";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { status: "success", message: genericMessage };
  }

  const user = await findUserForEmailVerification(email);

  if (!user || user.email_verified_at) {
    return { status: "success", message: genericMessage };
  }

  const token = await issueAuthToken(String(user.id), "VERIFY_EMAIL", 1440);

  try {
    await sendVerificationEmail({
      to: String(user.email),
      displayName: String(user.display_name || "Użytkowniku"),
      token,
    });
  } catch (error) {
    console.error("[register.resend] verification email failed", {
      error: error instanceof Error ? error.message : "UNKNOWN_EMAIL_ERROR",
    });
    return {
      status: "error",
      message: "Nie udało się teraz wysłać wiadomości. Spróbuj ponownie za chwilę.",
    };
  }

  return { status: "success", message: genericMessage };
}
