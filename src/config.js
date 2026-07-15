// Production API. Override with localStorage only when testing another backend.
window.CROSSLINE_API_BASE = window.CROSSLINE_API_BASE || localStorage.getItem("crossline-api-base") || "https://api.crosslinecscatest.com";
