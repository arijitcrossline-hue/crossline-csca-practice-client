const baseUrl = String(process.env.CROSSLINE_API_BASE || "https://api.crosslinecscatest.com").replace(/\/$/, "");
const secret = String(process.env.MAINTENANCE_SECRET || "");

if (secret.length < 32) throw new Error("MAINTENANCE_SECRET is not configured.");

const response = await fetch(`${baseUrl}/internal/maintenance`, {
  method: "POST",
  headers: { "x-crossline-maintenance-secret": secret }
});
const payload = await response.json().catch(() => ({}));
if (!response.ok || payload.ok !== true) throw new Error(`Crossline maintenance failed with status ${response.status}.`);

console.log(`Crossline maintenance complete; ${Number(payload.assets?.remaining || 0)} embedded images remain.`);
