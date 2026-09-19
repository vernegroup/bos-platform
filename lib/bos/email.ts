import "server-only";

type VerificationEmailInput = {
  to: string;
  displayName: string;
  token: string;
};

function appUrl() {
  return (process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendVerificationEmail(input: VerificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOS_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const verifyUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(input.token)}`;
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

  if (!response.ok) {
    throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}
