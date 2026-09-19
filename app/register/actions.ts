"use server";

import { registerCompanyAccount } from "@/lib/bos/registrationRepository";
import { sendVerificationEmail } from "@/lib/bos/email";

export type RegisterState = {
  status: "idle" | "error" | "success";
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
  } catch {
    return {
      status: "success",
      message: "Konto zostało utworzone, ale wiadomość weryfikacyjna nie mogła zostać wysłana. Po skonfigurowaniu poczty będzie można ponowić wysyłkę.",
    };
  }

  return {
    status: "success",
    message: "Konto firmowe zostało utworzone. Sprawdź pocztę i potwierdź adres e-mail, aby aktywować konto.",
  };
}
