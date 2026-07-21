(function () {
  "use strict";

  const page = document.body.dataset.authPage || "";
  const api = window.CrosslineApi;
  const apiBase = String(window.CROSSLINE_API_BASE || "https://api.crosslinecscatest.com").replace(/\/$/, "");
  const windowsDownload = "https://media.crosslinecscatest.com/downloads/Crossline-CSCA-Practice-Setup.exe";
  let registration = null;
  let avatarUrl = "";

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function messageFor(error, fallback) {
    return String(error?.message || fallback || "Something went wrong. Please try again.");
  }

  function showStatus(message = "", kind = "") {
    const status = byId("auth-status");
    if (!status) return;
    status.textContent = message;
    status.className = `form-status${kind ? ` ${kind}` : ""}`;
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = busy;
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.innerHTML = busy ? label : button.dataset.originalHtml;
  }

  function ensureApi() {
    if (api?.enabled?.()) return true;
    showStatus("Account service is temporarily unavailable. Please try again shortly.", "error");
    return false;
  }

  function redirectToDashboard() {
    const target = "/?auth=complete";
    if (window.__CROSSLINE_AUTH_TEST__) {
      window.__crosslineAuthRedirect = target;
      return;
    }
    window.location.assign(target);
  }

  function togglePassword(input, button) {
    if (!input || !button) return;
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "Show" : "Hide";
  }

  function startGoogleSignIn() {
    if (!ensureApi()) return;
    showStatus("Opening Google sign-in...");
    const popup = window.open(
      `${apiBase}/auth/oauth/google/start`,
      "crossline-google-sign-in",
      "popup=yes,width=520,height=720,resizable=yes,scrollbars=yes"
    );
    if (!popup) {
      showStatus("Your browser blocked the Google sign-in window. Allow pop-ups and try again.", "error");
      return;
    }

    const expectedOrigin = new URL(apiBase).origin;
    let settled = false;
    let closedCheck = 0;
    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      if (closedCheck) window.clearInterval(closedCheck);
    };
    const onMessage = (event) => {
      if (event.origin !== expectedOrigin || event.data?.type !== "crossline-oauth-complete") return;
      if (event.source && event.source !== popup) return;
      if (!event.data.token || !event.data.user) {
        showStatus("Google sign-in could not be completed.", "error");
        cleanup();
        return;
      }
      api.setStudentToken(event.data.token, true);
      cleanup();
      try { popup.close(); } catch {}
      redirectToDashboard();
    };
    window.addEventListener("message", onMessage);
    closedCheck = window.setInterval(() => {
      if (!settled && popup.closed) {
        cleanup();
        showStatus("Google sign-in was closed before it finished.", "error");
      }
    }, 500);
  }

  function renderResetRequest(prefill = "", message = "") {
    document.querySelector(".form-wrap").innerHTML = `
      <span class="eyebrow">Account recovery</span>
      <h1>Reset your password</h1>
      <p class="sub">Enter your verified email address and we will send a six-digit recovery code.</p>
      <form id="reset-request-form" novalidate>
        <div class="field"><label for="reset-email">Email address</label><div class="input-wrap"><input id="reset-email" type="email" autocomplete="email" value="${escapeHtml(prefill)}" placeholder="you@example.com" required /></div></div>
        <p class="form-status${message ? " success" : ""}" id="auth-status" role="status" aria-live="polite">${escapeHtml(message)}</p>
        <button class="submit-btn" type="submit">Send reset code</button>
        <button class="text-btn" id="back-to-login" type="button">Back to sign in</button>
      </form>`;
    byId("back-to-login").addEventListener("click", () => window.location.assign("/login"));
    byId("reset-request-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity() || !ensureApi()) return;
      const email = byId("reset-email").value.trim().toLowerCase();
      const button = event.currentTarget.querySelector(".submit-btn");
      setBusy(button, true, "Sending code...");
      showStatus("");
      try {
        await api.requestPasswordReset(email);
        renderResetConfirm(email);
      } catch (error) {
        showStatus(messageFor(error), "error");
        setBusy(button, false);
      }
    });
  }

  function renderResetConfirm(email, message = "Check your inbox for the six-digit code.") {
    document.querySelector(".form-wrap").innerHTML = `
      <span class="eyebrow">Account recovery</span>
      <h1>Choose a new password</h1>
      <p class="sub">Enter the code sent to <strong>${escapeHtml(email)}</strong>.</p>
      <form id="reset-confirm-form" novalidate>
        <div class="field"><label for="reset-code">Six-digit code</label><div class="input-wrap"><input class="verification-code" id="reset-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required /></div></div>
        <div class="field"><label for="reset-password">New password</label><div class="input-wrap"><input id="reset-password" type="password" autocomplete="new-password" minlength="6" required /></div></div>
        <div class="field"><label for="reset-confirm-password">Confirm new password</label><div class="input-wrap"><input id="reset-confirm-password" type="password" autocomplete="new-password" minlength="6" required /></div></div>
        <p class="form-status success" id="auth-status" role="status" aria-live="polite">${escapeHtml(message)}</p>
        <button class="submit-btn" type="submit">Update password</button>
        <button class="text-btn" id="request-another-code" type="button">Use another email</button>
      </form>`;
    byId("request-another-code").addEventListener("click", () => renderResetRequest(email));
    byId("reset-confirm-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity() || !ensureApi()) return;
      const code = byId("reset-code").value.trim();
      const password = byId("reset-password").value;
      const confirmation = byId("reset-confirm-password").value;
      if (password !== confirmation) {
        showStatus("The two passwords do not match.", "error");
        return;
      }
      const button = event.currentTarget.querySelector(".submit-btn");
      setBusy(button, true, "Updating password...");
      try {
        await api.confirmPasswordReset(email, code, password);
        renderResetRequest(email, "Password updated. Return to sign in with your new password.");
      } catch (error) {
        showStatus(messageFor(error), "error");
        setBusy(button, false);
      }
    });
  }

  function bindLogin() {
    const form = byId("login-form");
    byId("toggle-pw")?.addEventListener("click", () => togglePassword(byId("password"), byId("toggle-pw")));
    byId("forgot")?.addEventListener("click", (event) => {
      event.preventDefault();
      renderResetRequest(byId("email")?.value.trim().toLowerCase() || "");
    });
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity() || !ensureApi()) return;
      const email = byId("email").value.trim().toLowerCase();
      const password = byId("password").value;
      const persistent = Boolean(byId("remember-session")?.checked);
      const button = form.querySelector(".submit-btn");
      setBusy(button, true, "Signing in...");
      showStatus("");
      try {
        const payload = await api.login(email, password);
        api.setStudentToken(payload.token, persistent);
        redirectToDashboard();
      } catch (error) {
        showStatus(messageFor(error, "Check your credentials or finish email verification."), "error");
        setBusy(button, false);
      }
    });
  }

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  function bindPasswordStrength() {
    const input = byId("password");
    const strength = byId("pw-strength");
    const bars = strength?.querySelector(".pw-bars");
    const label = strength?.querySelector(".pw-label");
    input?.addEventListener("input", () => {
      if (!input.value) {
        strength.style.display = "none";
        return;
      }
      strength.style.display = "flex";
      const score = passwordStrength(input.value);
      bars.className = `pw-bars s${score}`;
      label.className = `pw-label ${score <= 1 ? "weak" : score <= 3 ? "medium" : "strong"}`;
      label.textContent = score <= 1 ? "Weak" : score <= 3 ? "Medium" : "Strong";
    });
  }

  function resizeAvatar(file) {
    if (!file) return Promise.resolve("");
    if (!file.type.startsWith("image/")) return Promise.reject(new Error("Choose a valid image file."));
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error("Profile pictures must be smaller than 8 MB."));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The profile picture could not be read."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("The profile picture could not be opened."));
        image.onload = () => {
          const scale = Math.min(1, 256 / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(image, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", .78);
          if (dataUrl.length > 100000) return reject(new Error("Use a smaller profile picture."));
          resolve(dataUrl);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function registrationSteps(active) {
    const labels = ["Details", "Verify email", "Practice"];
    return `<div class="steps">${labels.map((label, index) => `${index ? '<span class="step-bar"></span>' : ""}<div class="step-dot ${index + 1 === active ? "active" : index + 1 < active ? "done" : ""}"><span class="num">${index + 1 < active ? "&#10003;" : index + 1}</span><span class="label">${label}</span></div>`).join("")}</div>`;
  }

  function renderVerification(message = "Check your inbox for the six-digit verification code.") {
    document.querySelector(".form-wrap").innerHTML = `
      <span class="eyebrow">Step 2 of 3</span>
      <h1>Verify your email</h1>
      <p class="sub">Enter the code sent to <strong>${escapeHtml(registration.email)}</strong>.</p>
      ${registrationSteps(2)}
      <form id="verification-form" novalidate>
        <div class="field"><label for="verification-code">Verification code</label><div class="input-wrap"><input class="verification-code" id="verification-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required autofocus /></div></div>
        <p class="form-status success" id="auth-status" role="status" aria-live="polite">${escapeHtml(message)}</p>
        <button class="submit-btn" type="submit">Verify email</button>
        <button class="text-btn" id="resend-verification" type="button">Resend code</button>
      </form>`;
    byId("resend-verification").addEventListener("click", async () => {
      if (!ensureApi()) return;
      const button = byId("resend-verification");
      button.disabled = true;
      showStatus("Sending a new code...");
      try {
        await api.register(registration.email, registration.password, registration.username, registration);
        showStatus("A new verification code was sent.", "success");
      } catch (error) {
        showStatus(messageFor(error), "error");
      } finally {
        button.disabled = false;
      }
    });
    byId("verification-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity() || !ensureApi()) return;
      const button = event.currentTarget.querySelector(".submit-btn");
      setBusy(button, true, "Verifying...");
      try {
        const payload = await api.verify(registration.email, byId("verification-code").value.trim());
        api.setStudentToken(payload.token, true);
        renderAccountReady();
      } catch (error) {
        showStatus(messageFor(error), "error");
        setBusy(button, false);
      }
    });
  }

  function renderAccountReady() {
    registration.password = "";
    document.querySelector(".form-wrap").innerHTML = `
      <span class="eyebrow">Step 3 of 3</span>
      <h1>Your account is ready</h1>
      <p class="sub">Your email is verified. Continue to your dashboard or install the Windows app.</p>
      ${registrationSteps(3)}
      <div class="account-actions">
        <button class="submit-btn" id="continue-dashboard" type="button">Continue to dashboard</button>
        <a class="secondary-action" href="${windowsDownload}" download>Download Windows app</a>
      </div>`;
    byId("continue-dashboard").addEventListener("click", redirectToDashboard);
  }

  function bindRegister() {
    const form = byId("register-form");
    byId("toggle-pw")?.addEventListener("click", () => togglePassword(byId("password"), byId("toggle-pw")));
    bindPasswordStrength();
    byId("avatar")?.addEventListener("change", async (event) => {
      showStatus("");
      try {
        avatarUrl = await resizeAvatar(event.target.files?.[0]);
        if (avatarUrl) byId("avatar-preview").innerHTML = `<img src="${avatarUrl}" alt="Profile preview" />`;
      } catch (error) {
        avatarUrl = "";
        event.target.value = "";
        showStatus(messageFor(error), "error");
      }
    });
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity() || !ensureApi()) return;
      registration = {
        firstName: byId("first-name").value.trim(),
        lastName: byId("last-name").value.trim(),
        username: byId("username").value.trim(),
        email: byId("email").value.trim().toLowerCase(),
        password: byId("password").value,
        avatarUrl
      };
      const button = form.querySelector(".submit-btn");
      setBusy(button, true, "Creating account...");
      showStatus("");
      try {
        await api.register(registration.email, registration.password, registration.username, registration);
        renderVerification();
      } catch (error) {
        showStatus(messageFor(error), "error");
        setBusy(button, false);
      }
    });
  }

  byId("google-auth")?.addEventListener("click", startGoogleSignIn);
  if (page === "login") bindLogin();
  if (page === "register") bindRegister();
})();
