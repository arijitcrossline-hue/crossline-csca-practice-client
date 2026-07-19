const DEFAULT_APP_URL = "https://exam.crosslinecscatest.com";

export function buildVerificationEmail({ code, appUrl } = {}) {
  return buildCodeEmail({
    code,
    appUrl,
    subject: "Verify your Crossline Education account",
    preheader: "Your Crossline Education verification code is ready.",
    label: "EMAIL VERIFICATION",
    eyebrow: "Welcome to Crossline",
    heading: "Verify your email",
    copy: "Use this code to finish creating your Crossline Education account.",
    codeLabel: "Verification code",
    note: "This code expires in 15 minutes. Do not share it with anyone.",
    textAction: "finish creating your account"
  });
}

export function buildPasswordResetEmail({ code, appUrl } = {}) {
  return buildCodeEmail({
    code,
    appUrl,
    subject: "Reset your Crossline Education password",
    preheader: "Use this secure code to reset your Crossline Education password.",
    label: "PASSWORD RESET",
    eyebrow: "Account security",
    heading: "Reset your password",
    copy: "Enter this code in the Crossline app to choose a new password.",
    codeLabel: "Password reset code",
    note: "This code expires in 15 minutes. If you did not request a reset, you can safely ignore this email.",
    textAction: "reset your password"
  });
}

function buildCodeEmail({ code, appUrl, subject, preheader, label, eyebrow, heading, copy, codeLabel, note, textAction }) {
  const safeCode = String(code || "").replace(/\D/g, "").slice(0, 6);
  const baseUrl = safeHttpUrl(appUrl) || DEFAULT_APP_URL;
  const logoUrl = `${baseUrl}/assets/crossline-icon.png`;
  const text = [
    heading,
    "",
    `Use this code to ${textAction}: ${safeCode}`,
    "",
    note,
    "",
    "Sent securely by Crossline Education."
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .security-code { font-size: 32px !important; letter-spacing: 7px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f1ed;color:#211d1b;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f1ed;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#fffdfa;border:1px solid #d8d0ca;border-radius:8px;overflow:hidden;">
          <tr>
            <td class="email-pad" style="padding:24px 34px 18px;border-bottom:1px solid #eee5df;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="48" valign="middle"><img src="${escapeHtml(logoUrl)}" width="42" height="42" alt="Crossline Education" style="display:block;width:42px;height:42px;border:0;border-radius:8px;"></td>
                  <td valign="middle" style="padding-left:10px;"><strong style="display:block;color:#251e1b;font-size:17px;line-height:1.2;">Crossline Education</strong><span style="display:block;margin-top:3px;color:#7c6e68;font-size:11px;line-height:1.2;">CSCA Practice</span></td>
                  <td align="right" valign="middle"><span style="display:inline-block;padding:6px 9px;border:1px solid #eed4cf;border-radius:6px;color:#a71921;background:#fff1ed;font-size:11px;font-weight:bold;">${escapeHtml(label)}</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:30px 34px 8px;">
              <p style="margin:0 0 8px;color:#bd2029;font-size:12px;font-weight:bold;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0;color:#211d1b;font-size:25px;line-height:1.25;">${escapeHtml(heading)}</h1>
              <p style="margin:10px 0 0;color:#695c56;font-size:14px;line-height:1.6;">${escapeHtml(copy)}</p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:18px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff3ee;border:1px solid #ead8d0;border-radius:8px;">
                <tr>
                  <td align="center" style="padding:22px 18px;">
                    <span style="display:block;color:#7e6e67;font-size:10px;font-weight:bold;text-transform:uppercase;">${escapeHtml(codeLabel)}</span>
                    <strong class="security-code" style="display:block;margin-top:9px;color:#9f161e;font-size:38px;line-height:1;font-family:Montserrat,Arial,Helvetica,sans-serif;letter-spacing:9px;">${escapeHtml(safeCode)}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:2px 34px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #eee5df;">
                <tr><td style="padding:17px 0 0;color:#756761;font-size:12px;line-height:1.55;">${escapeHtml(note)}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:18px 34px;background:#f8f4f0;color:#857670;font-size:11px;line-height:1.5;">Sent securely by Crossline Education. Please do not reply with your verification code.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString().replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
