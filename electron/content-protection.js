const DEFAULT_CAPTURE_WINDOW_MS = 30 * 60 * 1000;

function createContentProtectionController({
  getWindow,
  authorizeAdmin,
  onChange = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  maximumCaptureWindowMs = DEFAULT_CAPTURE_WINDOW_MS
}) {
  let screenCaptureAllowed = false;
  let expiresAt = null;
  let resetTimer = null;

  function status() {
    return {
      contentProtection: !screenCaptureAllowed,
      screenCaptureAllowed,
      expiresAt
    };
  }

  function applyProtection(protectedContent) {
    const window = getWindow();
    if (window && !window.isDestroyed()) window.setContentProtection(Boolean(protectedContent));
  }

  function protect() {
    if (resetTimer) clearTimer(resetTimer);
    resetTimer = null;
    screenCaptureAllowed = false;
    expiresAt = null;
    applyProtection(true);
    const next = status();
    onChange(next);
    return next;
  }

  async function setAllowed(allowed, adminToken = "") {
    if (!allowed) return protect();
    if (!adminToken) throw new Error("An active administrator session is required.");
    const authorization = await authorizeAdmin(adminToken);
    if (!authorization?.authorized) throw new Error("Administrator authorization was denied.");
    const requestedDuration = Number(authorization.allowMs || maximumCaptureWindowMs);
    const duration = Math.max(1000, Math.min(requestedDuration, maximumCaptureWindowMs));
    if (resetTimer) clearTimer(resetTimer);
    screenCaptureAllowed = true;
    expiresAt = new Date(Date.now() + duration).toISOString();
    applyProtection(false);
    resetTimer = setTimer(protect, duration);
    resetTimer?.unref?.();
    const next = status();
    onChange(next);
    return next;
  }

  return { protect, setAllowed, status };
}

module.exports = { DEFAULT_CAPTURE_WINDOW_MS, createContentProtectionController };
