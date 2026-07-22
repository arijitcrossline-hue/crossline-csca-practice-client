// Local API overrides are deliberately unavailable in production and in the desktop app.
const crosslineDevelopmentHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const crosslineDevelopmentApi = crosslineDevelopmentHost ? localStorage.getItem("crossline-api-base") : "";
window.CROSSLINE_API_BASE = window.CROSSLINE_API_BASE || crosslineDevelopmentApi || "https://api.crosslinecscatest.com";
