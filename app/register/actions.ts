"use server";

import { registerCompanyAccount } from "@/lib/bos/registrationRepository";

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
    firstName,
    lastName,
    email,
    password,
    companyName,
    taxId,
    country,
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

  // LOGIN-08 will send this token by e-mail. Never expose it in the browser.
  return {
    status: "success",
    message: "Konto firmowe zostało utworzone. W kolejnym etapie podłączymy weryfikację adresu e-mail.",
  };
}
