(function () {
  const TOKEN_KEY = "crossline-api-token";
  const ADMIN_TOKEN_KEY = "crossline-admin-api-token";

  function baseUrl() {
    return (window.CROSSLINE_API_BASE || "").replace(/\/$/, "");
  }

  function enabled() {
    return Boolean(baseUrl());
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
    const token = options.admin ? localStorage.getItem(ADMIN_TOKEN_KEY) : localStorage.getItem(TOKEN_KEY);
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
    getStudentToken() { return localStorage.getItem(TOKEN_KEY) || ""; },
    setStudentToken(token) { localStorage.setItem(TOKEN_KEY, token); },
    setAdminToken(token) { localStorage.setItem(ADMIN_TOKEN_KEY, token); },
    clearStudentToken() { localStorage.removeItem(TOKEN_KEY); },
    clearAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); },
    register(email, password, username, profile = {}) { return request("/auth/register", { method: "POST", body: { email, password, username, ...profile } }); },
    verify(email, code) { return request("/auth/verify", { method: "POST", body: { email, code } }); },
    login(email, password) { return request("/auth/login", { method: "POST", body: { email, password } }); },
    requestPasswordReset(email) { return request("/auth/password-reset/request", { method: "POST", body: { email } }); },
    confirmPasswordReset(email, code, password) { return request("/auth/password-reset/confirm", { method: "POST", body: { email, code, password } }); },
    me() { return request("/auth/me"); },
    updateProfile(profile) { return request("/auth/profile", { method: "PATCH", body: profile }); },
    notifications() { return request("/notifications"); },
    markNotificationRead(id) { return request(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }); },
    adminLogin(email, password) { return request("/admin/login", { method: "POST", body: { email, password } }); },
    exams() { return request("/exams"); },
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
    createNotification(notification) { return request("/admin/notifications", { method: "POST", admin: true, body: notification }); },
    aiImport(source) { return request("/admin/ai/import", { method: "POST", admin: true, body: source }); },
    aiChat(messages, attachment = null) { return request("/admin/ai/chat", { method: "POST", admin: true, body: { messages, attachment } }); },
    deployExam(exam, questions) { return request("/admin/ai/deploy", { method: "POST", admin: true, body: { exam, questions: questions.map(questionWithImageAsset) } }); },
    createExam(exam) { return request("/admin/exams", { method: "POST", admin: true, body: exam }); },
    updateExam(examId, exam) { return request(`/admin/exams/${encodeURIComponent(examId)}`, { method: "PATCH", admin: true, body: exam }); },
    deleteExam(examId) { return request(`/admin/exams/${encodeURIComponent(examId)}`, { method: "DELETE", admin: true }); },
    createQuestion(examId, question) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions`, { method: "POST", admin: true, body: question }); },
    importQuestions(examId, questions) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/import`, { method: "POST", admin: true, body: { questions: questions.map(questionWithImageAsset) } }); },
    updateQuestion(examId, questionId, question) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`, { method: "PUT", admin: true, body: question }); },
    deleteQuestion(examId, questionId) { return request(`/admin/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(questionId)}`, { method: "DELETE", admin: true }); },
    createSession(examId) { return request("/sessions", { method: "POST", body: { examId } }); },
    sessionStatus(sessionId) { return request(`/sessions/${encodeURIComponent(sessionId)}/status`); },
    event(sessionId, type, payload = {}) { return request(`/sessions/${encodeURIComponent(sessionId)}/events`, { method: "POST", body: { type, payload } }); },
    saveAnswers(sessionId, answers, flags, submitted = false) {
      return request(`/sessions/${encodeURIComponent(sessionId)}/answers`, { method: "POST", body: { answers, flags, submitted } });
    }
  };
})();
