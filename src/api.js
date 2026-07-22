(function () {
  const TOKEN_KEY = "crossline-api-token";
  const ADMIN_TOKEN_KEY = "crossline-admin-api-token";
  const tokenCache = new Map();

  function secureSlot(key) {
    return key === ADMIN_TOKEN_KEY ? "admin" : "student";
  }

  function usesSecureStorage() {
    return Boolean(window.examRuntime?.secureTokenGet && window.examRuntime?.secureTokenSet);
  }

  function baseUrl() {
    return (window.CROSSLINE_API_BASE || "").replace(/\/$/, "");
  }

  function enabled() {
    return Boolean(baseUrl());
  }

  function storedToken(key) {
    return tokenCache.get(key) || sessionStorage.getItem(key) || localStorage.getItem(key) || "";
  }

  async function storedTokenAsync(key) {
    const cached = tokenCache.get(key);
    if (cached) return cached;
    if (usesSecureStorage()) {
      const token = await window.examRuntime.secureTokenGet(secureSlot(key));
      if (token) tokenCache.set(key, token);
      return token || "";
    }
    return storedToken(key);
  }

  function setStoredToken(key, token, persistent = true) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    tokenCache.set(key, token);
    if (usesSecureStorage()) {
      void window.examRuntime.secureTokenSet(secureSlot(key), persistent ? token : "").catch(() => {});
    }
    else (persistent ? localStorage : sessionStorage).setItem(key, token);
  }

  function clearStoredToken(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    tokenCache.delete(key);
    if (usesSecureStorage()) void window.examRuntime.secureTokenSet(secureSlot(key), "").catch(() => {});
  }

  function questionWithImageAsset(question = {}) {
    const image = typeof question.image === "string" && question.image
      ? { filename: question.imageFilename || "question-image.png", mimeType: question.imageMimeType || (question.image.match(/^data:([^;]+)/)?.[1] || "image/png"), dataUrl: question.image }
      : question.image;
    return { ...question, image };
  }

  async function request(path, options = {}) {
    if (!enabled()) throw new Error("Backend API is not configured.");
    const headers = { "content-type": "application/json", ...(options.headers || {}) };
    const token = await storedTokenAsync(options.admin ? ADMIN_TOKEN_KEY : TOKEN_KEY);
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl()}${path}`, {
      ...options,
      headers,
      body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  }

  window.CrosslineApi = {
    enabled,
    get baseUrl() { return baseUrl(); },
    getStudentToken() { return storedToken(TOKEN_KEY); },
    getAdminToken() { return storedToken(ADMIN_TOKEN_KEY); },
    getStudentTokenAsync() { return storedTokenAsync(TOKEN_KEY); },
    getAdminTokenAsync() { return storedTokenAsync(ADMIN_TOKEN_KEY); },
    async hydrateTokens() { await Promise.all([storedTokenAsync(TOKEN_KEY), storedTokenAsync(ADMIN_TOKEN_KEY)]); },
    setStudentToken(token, persistent = true) { setStoredToken(TOKEN_KEY, token, persistent); },
    setAdminToken(token, persistent = true) { setStoredToken(ADMIN_TOKEN_KEY, token, persistent); },
    clearStudentToken() { clearStoredToken(TOKEN_KEY); },
    clearAdminToken() { clearStoredToken(ADMIN_TOKEN_KEY); },
    register(email, password, username, profile = {}) { return request("/auth/register", { method: "POST", body: { email, password, username, ...profile } }); },
    requestVerification(email) { return request("/auth/verification/request", { method: "POST", body: { email } }); },
    verify(email, code) { return request("/auth/verify", { method: "POST", body: { email, code } }); },
    login(email, password) { return request("/auth/login", { method: "POST", body: { email, password } }); },
    logout() { return request("/auth/logout", { method: "POST" }); },
    requestPasswordReset(email) { return request("/auth/password-reset/request", { method: "POST", body: { email } }); },
    confirmPasswordReset(email, code, password) { return request("/auth/password-reset/confirm", { method: "POST", body: { email, code, password } }); },
    me() { return request("/auth/me"); },
    updateProfile(profile) { return request("/auth/profile", { method: "PATCH", body: profile }); },
    acceptLegal(version) { return request("/legal/accept", { method: "POST", body: { version } }); },
    deletionStatus() { return request("/auth/deletion"); },
    requestDeletion(confirmation) { return request("/auth/deletion", { method: "POST", body: { confirmation } }); },
    cancelDeletion() { return request("/auth/deletion", { method: "DELETE" }); },
    notifications() { return request("/notifications"); },
    markNotificationRead(id) { return request(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }); },
    markAllNotificationsRead() { return request("/notifications/read", { method: "POST" }); },
    archiveNotification(id) { return request(`/notifications/${encodeURIComponent(id)}/archive`, { method: "POST" }); },
    unarchiveNotification(id) { return request(`/notifications/${encodeURIComponent(id)}/unarchive`, { method: "POST" }); },
    reportBug(report) { return request("/support/bug-reports", { method: "POST", body: report }); },
    adminMfaStatus() { return request("/admin/mfa/status"); },
    setupAdminMfa() { return request("/admin/mfa/setup", { method: "POST" }); },
    enableAdminMfa(code) { return request("/admin/mfa/enable", { method: "POST", body: { code } }); },
    createAdminSession(code) { return request("/admin/session", { method: "POST", body: { code } }); },
    exams() { return request("/exams"); },
    plans() { return request("/plans"); },
    results() { return request("/results"); },
    result(id) { return request(`/results/${encodeURIComponent(id)}`); },
    leaderboard(filters = {}) {
      const query = new URLSearchParams();
      if (filters.mode) query.set("mode", filters.mode);
      if (filters.examId) query.set("examId", filters.examId);
      if (filters.subject) query.set("subject", filters.subject);
      return request(`/leaderboard${query.size ? `?${query.toString()}` : ""}`);
    },
    adminExams() { return request("/admin/exams", { admin: true }); },
    adminSubmissions() { return request("/admin/submissions", { admin: true }); },
    adminSubmission(id) { return request(`/admin/submissions/${encodeURIComponent(id)}`, { admin: true }); },
    adminNotifications() { return request("/admin/notifications", { admin: true }); },
    adminBugReports() { return request("/admin/bug-reports", { admin: true }); },
    updateBugReport(id, status) { return request(`/admin/bug-reports/${encodeURIComponent(id)}`, { method: "PATCH", admin: true, body: { status } }); },
    adminAccess() { return request("/admin/access", { admin: true }); },
    adminAuditLog() { return request("/admin/audit-log", { admin: true }); },
    grantAdminAccess(email, code) { return request("/admin/access", { method: "POST", admin: true, body: { email, code } }); },
    revokeAdminAccess(email, code) { return request(`/admin/access/${encodeURIComponent(email)}`, { method: "DELETE", admin: true, body: { code } }); },
    adminStudentPlans() { return request("/admin/student-plans", { admin: true }); },
    grantStudentPlan(email, planId) { return request("/admin/student-plans", { method: "POST", admin: true, body: { email, planId } }); },
    revokeStudentPlan(email) { return request(`/admin/student-plans/${encodeURIComponent(email)}`, { method: "DELETE", admin: true }); },
    createNotification(notification) { return request("/admin/notifications", { method: "POST", admin: true, body: notification }); },
    aiImport(source) { return request("/admin/ai/import", { method: "POST", admin: true, body: source }); },
    aiChat(messages, attachment = null) { return request("/admin/ai/chat", { method: "POST", admin: true, body: { messages, attachment } }); },
    deployExam(exam, questions) { return request("/admin/ai/deploy", { method: "POST", admin: true, body: { exam, questions: questions.map(questionWithImageAsset) } }); },
    createExam(exam) { return request("/admin/exams", { method: "POST", admin: true, body: exam }); },
    updateExam(examId, exam) { return request(`/admin/exams/${encodeURIComponent(examId)}`, { method: "PATCH", admin: true, body: exam }); },
    deleteExam(examId) { return request(`/admin/exams/${encodeURIComponent(examId)}`, { method: "DELETE", admin: true }); },
    publishExam(examId) { return request(`/admin/exams/${encodeURIComponent(examId)}/publish`, { method: "POST", admin: true }); },
    unpublishExam(examId) { return request(`/admin/exams/${encodeURIComponent(examId)}/unpublish`, { method: "POST", admin: true }); },
    restoreExam(examId) { return request(`/admin/exams/${encodeURIComponent(examId)}/restore`, { method: "POST", admin: true }); },
    createQuestion(examId, question) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions`, { method: "POST", admin: true, body: question }); },
    importQuestions(examId, questions) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/import`, { method: "POST", admin: true, body: { questions: questions.map(questionWithImageAsset) } }); },
    updateQuestion(examId, questionId, question) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`, { method: "PUT", admin: true, body: question }); },
    deleteQuestion(examId, questionId) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`, { method: "DELETE", admin: true }); },
    createSession(examId) { return request("/sessions", { method: "POST", body: { examId } }); },
    activeSession() { return request("/sessions/active"); },
    sessionStatus(sessionId) { return request(`/sessions/${encodeURIComponent(sessionId)}/status`); },
    startSession(sessionId) { return request(`/sessions/${encodeURIComponent(sessionId)}/start`, { method: "POST" }); },
    event(sessionId, type, payload = {}) { return request(`/sessions/${encodeURIComponent(sessionId)}/events`, { method: "POST", body: { type, payload } }); },
    saveAnswers(sessionId, answers, flags, submitted = false) {
      return request(`/sessions/${encodeURIComponent(sessionId)}/answers`, { method: "POST", body: { answers, flags, submitted } });
    }
  };
})();
