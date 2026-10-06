import "server-only";
import { bosAppUrl } from "@/lib/bos/app-url";

type PasswordResetEmailInput = {
  to: string;
  displayName: string;
  token: string;
};

type PurchaseClaimEmailInput = {
  to: string;
  displayName: string;
  token: string;
};

type VerificationEmailInput = {
  to: string;
  displayName: string;
  token: string;
};

function bosEmailFrom() {
  const raw = process.env.BOS_EMAIL_FROM?.trim();
  if (!raw) return null;

  const unquoted = raw.replace(/^["']|["']$/g, "").trim();
  if (/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(unquoted)) return unquoted;
  if (/^.+\s<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$/.test(unquoted)) return unquoted;

  const email = unquoted.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0];
  return email ? `BOS <${email}>` : null;
}

type NewRegistrationNotificationInput = {
  userEmail: string;
  companyName: string;
};

export async function sendNewRegistrationNotification(input: NewRegistrationNotificationInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bosEmailFrom();
  const notifyTo = process.env.BOS_NEW_USER_NOTIFY_TO?.trim();

  if (!notifyTo) {
    console.info("[email.new-registration] notification recipient not configured");
    return { skipped: true as const };
  }

  if (!apiKey || !from) {
    console.error("[email.new-registration] configuration missing", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const registeredAt = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(new Date());

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      subject: "Nowa rejestracja w BOS",
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#10253c;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px"><div style="font-size:28px;font-weight:700;letter-spacing:.08em">BOS</div><h1 style="font-size:22px">Nowa rejestracja</h1><p><strong>Organizacja:</strong> ${escapeHtml(input.companyName)}</p><p><strong>E-mail:</strong> ${escapeHtml(input.userEmail)}</p><p><strong>Czas:</strong> ${escapeHtml(registeredAt)}</p><p style="font-size:13px;color:#69747d">Status: konto utworzone, oczekuje na potwierdzenie adresu e-mail.</p></div></body></html>`,
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    console.error("[email.new-registration] Resend rejected message", {
      status: response.status,
      response: responseBody.slice(0, 1000),
    });
    throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  }

  let messageId: string | null = null;
  try {
    messageId = (JSON.parse(responseBody) as { id?: string }).id ?? null;
  } catch {}

  console.info("[email.new-registration] accepted by Resend", {
    status: response.status,
    messageId,
  });
  return { skipped: false as const, messageId };
}

export async function sendPurchaseClaimEmail(input: PurchaseClaimEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bosEmailFrom();
  if (!apiKey || !from) {
    console.error("[email.claim] configuration missing", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  const claimUrl = `${bosAppUrl()}/claim-purchase?token=${encodeURIComponent(input.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Aktywuj dostęp do zakupionego produktu — BOS",
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#10253c;line-height:1.6"><div style="max-width:560px;margin:0 auto;padding:32px"><div style="font-size:28px;font-weight:700;letter-spacing:.08em">BOS</div><div style="font-size:10px;letter-spacing:.14em;margin-bottom:30px">BUSINESS OPERATING STANDARDS</div><h1 style="font-size:24px">Aktywuj dostęp do BOS</h1><p>Dzień dobry ${escapeHtml(input.displayName)},</p><p>płatność została potwierdzona. Ustaw hasło, aby przejąć konto organizacji i korzystać z zakupionego produktu.</p><p style="margin:28px 0"><a href="${claimUrl}" style="background:#b98b46;color:#fff;text-decoration:none;padding:14px 22px;display:inline-block">Aktywuj dostęp →</a></p><p style="font-size:13px;color:#69747d">Link jest jednorazowy i wygasa po 24 godzinach.</p></div></body></html>`,
    }),
  });
  const responseBody = await response.text();
  if (!response.ok) {
    console.error("[email.claim] Resend rejected message", {
      status: response.status,
      response: responseBody.slice(0, 1000),
    });
    throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  }

  let messageId: string | null = null;
  try {
    messageId = (JSON.parse(responseBody) as { id?: string }).id ?? null;
  } catch {
    // A successful response without JSON is still a successful delivery request.
  }
  console.info("[email.claim] accepted by Resend", { status: response.status, messageId });
  return { messageId };
}

export async function sendVerificationEmail(input: VerificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bosEmailFrom();

  if (!apiKey || !from) {
    console.error("[email.verify] configuration missing", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const verifyUrl = `${bosAppUrl()}/verify-email?token=${encodeURIComponent(input.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Potwierdź adres e-mail — BOS",
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#10253c;line-height:1.6">
        <div style="max-width:560px;margin:0 auto;padding:32px">
          <div style="font-size:28px;font-weight:700;letter-spacing:.08em">BOS</div>
          <div style="font-size:10px;letter-spacing:.14em;margin-bottom:30px">BUSINESS OPERATING STANDARDS</div>
          <h1 style="font-size:24px">Potwierdź adres e-mail</h1>
          <p>Dzień dobry ${escapeHtml(input.displayName)},</p>
          <p>potwierdź adres e-mail, aby aktywować konto firmowe BOS.</p>
          <p style="margin:28px 0"><a href="${verifyUrl}" style="background:#b98b46;color:#fff;text-decoration:none;padding:14px 22px;display:inline-block">Potwierdź adres e-mail →</a></p>
          <p style="font-size:13px;color:#69747d">Link jest jednorazowy i wygasa po 24 godzinach.</p>
        </div></body></html>`,
    }),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    console.error("[email.verify] Resend rejected message", {
      status: response.status,
      response: responseBody.slice(0, 1000),
    });
    throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  }

  let messageId: string | null = null;
  try {
    messageId = (JSON.parse(responseBody) as { id?: string }).id ?? null;
  } catch {
    // A successful response without JSON is still a successful delivery request.
  }

  console.info("[email.verify] accepted by Resend", {
    status: response.status,
    messageId,
  });

  return { messageId };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bosEmailFrom();

  if (!apiKey || !from) {
    console.error("[email.reset] configuration missing", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const resetUrl = `${bosAppUrl()}/reset-password?token=${encodeURIComponent(input.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Ustaw nowe hasło — BOS",
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#10253c;line-height:1.6">
        <div style="max-width:560px;margin:0 auto;padding:32px">
          <div style="font-size:28px;font-weight:700;letter-spacing:.08em">BOS</div>
          <div style="font-size:10px;letter-spacing:.14em;margin-bottom:30px">BUSINESS OPERATING STANDARDS</div>
          <h1 style="font-size:24px">Ustaw nowe hasło</h1>
          <p>Dzień dobry ${escapeHtml(input.displayName)},</p>
          <p>otrzymaliśmy prośbę o zmianę hasła do Twojego konta BOS.</p>
          <p style="margin:28px 0"><a href="${resetUrl}" style="background:#b98b46;color:#fff;text-decoration:none;padding:14px 22px;display:inline-block">Ustaw nowe hasło →</a></p>
          <p style="font-size:13px;color:#69747d">Link jest jednorazowy i wygasa po 60 minutach. Jeżeli nie prosisz o zmianę hasła, zignoruj tę wiadomość.</p>
        </div></body></html>`,
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    console.error("[email.reset] Resend rejected message", {
      status: response.status,
      response: responseBody.slice(0, 1000),
    });
    throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  }

  let messageId: string | null = null;
  try {
    messageId = (JSON.parse(responseBody) as { id?: string }).id ?? null;
  } catch {
    // A successful response without JSON is still a successful delivery request.
  }

  console.info("[email.reset] accepted by Resend", { status: response.status, messageId });
  return { messageId };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}
