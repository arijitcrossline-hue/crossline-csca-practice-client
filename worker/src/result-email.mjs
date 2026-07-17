const DEFAULT_APP_URL = "https://exam.crosslinecscatest.com";

export function buildResultEmail(result = {}) {
  const earned = formatScore(result.earned);
  const total = formatScore(result.total);
  const scoreLabel = `${earned} / ${total}`;
  const subject = cleanText(result.subject) || "your exam";
  const examTitle = cleanText(result.examTitle) || "Crossline CSCA mock exam";
  const studentName = cleanText(result.studentName) || "Student";
  const appUrl = safeHttpUrl(result.appUrl) || DEFAULT_APP_URL;
  const logoUrl = `${appUrl.replace(/\/$/, "")}/assets/crossline-icon.png`;
  const rankLabel = Number.isFinite(Number(result.rank))
    ? `#${Math.max(1, Math.round(Number(result.rank)))}${Number.isFinite(Number(result.participants)) ? ` of ${Math.max(1, Math.round(Number(result.participants)))}` : ""}`
    : "Not ranked";
  const achievement = achievementCopy(result, subject, scoreLabel);
  const subjectLine = result.isPersonalBest
    ? `New ${subject} personal best: ${earned}/${total}`
    : `Your ${subject} result: ${earned}/${total}`;
  const submitted = formatEmailDate(result.submittedAt);

  const text = [
    `Hi ${studentName},`,
    "",
    `Your result for ${examTitle} is ready.`,
    `Score: ${scoreLabel}`,
    `Position: ${rankLabel}`,
    `${achievement.label}: ${achievement.value}`,
    `Submitted: ${submitted}`,
    "",
    "Keep practising with Crossline Education."
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(subjectLine)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .metric-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f1ed;color:#211d1b;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your ${escapeHtml(subject)} score, position, and progress are ready.</div>
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
                  <td align="right" valign="middle"><span style="display:inline-block;padding:6px 9px;border:1px solid #d7e8df;border-radius:6px;color:#176641;background:#f0faf5;font-size:11px;font-weight:bold;">RESULT READY</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:30px 34px 10px;">
              <p style="margin:0 0 8px;color:#bd2029;font-size:12px;font-weight:bold;text-transform:uppercase;">${escapeHtml(subject)} result</p>
              <h1 style="margin:0;color:#211d1b;font-size:25px;line-height:1.25;">Nice work, ${escapeHtml(studentName)}.</h1>
              <p style="margin:10px 0 0;color:#695c56;font-size:14px;line-height:1.6;">Your result for <strong style="color:#332a26;">${escapeHtml(examTitle)}</strong> is ready.</p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:16px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#25201e;border-radius:8px;">
                <tr>
                  <td style="padding:24px 26px;">
                    <span style="display:block;color:#d9cdc7;font-size:11px;font-weight:bold;text-transform:uppercase;">Final score</span>
                    <strong style="display:block;margin-top:5px;color:#ffffff;font-size:36px;line-height:1;">${escapeHtml(earned)} <span style="color:#ab9d97;font-size:21px;font-weight:normal;">/ ${escapeHtml(total)}</span></strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:2px 34px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="metric-cell" width="50%" valign="top" style="padding-right:6px;">
                    ${metricCard("Position", rankLabel, "Against this exam's participants", "#fff5ed", "#9a4b16")}
                  </td>
                  <td class="metric-cell" width="50%" valign="top" style="padding-left:6px;">
                    ${metricCard(achievement.label, achievement.value, achievement.detail, achievement.background, achievement.color)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:0 34px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #eee5df;">
                <tr><td style="padding:17px 0 0;color:#7a6d67;font-size:12px;line-height:1.5;">Submitted ${escapeHtml(submitted)}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:18px 34px;background:#f8f4f0;color:#857670;font-size:11px;line-height:1.5;">Keep building your score with focused practice. This result email was sent by Crossline Education.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: subjectLine, text, html };
}

function achievementCopy(result, subject, scoreLabel) {
  const previousBest = result.previousBest === null || result.previousBest === undefined ? Number.NaN : Number(result.previousBest);
  const improvement = Number(result.improvement);
  if (result.isPersonalBest && Number.isFinite(improvement) && improvement > 0) {
    return {
      label: `New ${subject} best`,
      value: `+${formatScore(improvement)} pts`,
      detail: `Your highest ${subject} result so far`,
      background: "#eef8f2",
      color: "#176641"
    };
  }
  if (!Number.isFinite(previousBest)) {
    return {
      label: `First ${subject} score`,
      value: scoreLabel,
      detail: "Your new starting point",
      background: "#f1f5fb",
      color: "#315b89"
    };
  }
  return {
    label: `${subject} progress`,
    value: "Keep going",
    detail: "Your previous personal best still stands",
    background: "#f1f5fb",
    color: "#315b89"
  };
}

function metricCard(label, value, detail, background, color) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${background};border:1px solid #e6ddd7;border-radius:8px;"><tr><td style="padding:16px;"><span style="display:block;color:#786a64;font-size:10px;font-weight:bold;text-transform:uppercase;">${escapeHtml(label)}</span><strong style="display:block;margin-top:5px;color:${color};font-size:19px;line-height:1.2;">${escapeHtml(value)}</strong><span style="display:block;margin-top:5px;color:#7b6d67;font-size:11px;line-height:1.35;">${escapeHtml(detail)}</span></td></tr></table>`;
}

function formatScore(value) {
  const score = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatEmailDate(value) {
  if (!value) return "Unknown time";
  try {
    return `${new Date(value).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`;
  } catch {
    return cleanText(value) || "Unknown time";
  }
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString().replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
