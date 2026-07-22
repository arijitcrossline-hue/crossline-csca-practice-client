const checks = [
  {
    name: "api",
    url: "https://api.crosslinecscatest.com/health",
    validate: (payload) => payload.ok === true && payload.database === "ready" && payload.service === "crossline-mocks-api"
  },
  {
    name: "media",
    url: "https://media.crosslinecscatest.com/health",
    validate: (payload) => payload.ok === true && payload.questionImages === "ready" && payload.service === "crossline-media-server"
  }
];

for (const check of checks) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(check.url, { cache: "no-store", signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !check.validate(payload)) throw new Error(`${check.name} returned an unhealthy response.`);
  } finally {
    clearTimeout(timeout);
  }
}

console.log(`Crossline production health passed at ${new Date().toISOString()}.`);
