# Admin Dashboard and Exam Creation

The admin dashboard is built in `src/app.js` and backed by admin endpoints in `worker/src/index.js`.

## Main Frontend Functions

- `showAdminLogin()`
- `showAdminDashboard()`
- `showAdminOverview()`
- `showAdminAssistant()`
- `showQuestionImport()`
- `showAdminNotifications()`
- `showCreateExam()`
- `showQuestionEditor(examId)`
- `showQuestionEdit(examId, questionIndex)`
- `deleteExam(examId)`
- `showAdminSubmissions()`
- `showAdminSubmissionDetail(submissionId)`

## Admin Navigation

After login, `adminShell()` creates the admin layout with these sections:

- Overview
- GLM assistant
- Exam library
- Question import
- Student attempts
- Notifications

The old "view as student" style option has been removed. Admins manage papers and review submissions.

## Creating an Exam

Frontend screen:

```js
showCreateExam()
```

Fields:

- exam title
- description
- duration in minutes

Every published exam is free for every registered student. Pricing, purchase controls, premium limits, and paid analysis gates are not part of the current product.

API call:

```js
window.CrosslineApi.createExam(exam)
```

Backend endpoint:

```http
POST /admin/exams
```

The Worker creates an exam ID using a slug plus timestamp.

## Editing an Exam's Questions

Frontend screen:

```js
showQuestionEditor(examId)
```

This page shows:

- total number of questions
- total marks
- add-question form
- existing question list
- edit button per question
- delete button per question

## Question Fields

Each question supports:

- subject, chapter, and topic
- question text
- four options
- correct answer index
- marks
- optional question image
- answer explanation
- optional explanation image/graph

## Importing Questions

The assistant and import workspace accept files through a normal file picker or drag and drop. Supported sources are ZIP question banks plus HTML, PDF, Markdown, text, JSON, CSV, PNG, JPG, WebP, BMP, and TIFF files. Individual sources may be up to 25 MB; ZIP banks may be up to 100 MB and can contain multiple supported files with companion images. `electron/source-import.js` extracts selectable PDF text directly. If a PDF is scanned, it renders each page and runs Tesseract OCR locally. Images also use local OCR.

HTML uses `node-html-parser` and `node-html-markdown`. Scripts and styles are removed. Images embedded as data URLs or stored beside the HTML are loaded locally, OCRed, resized when needed, and replaced with stable `CROSSLINE_IMAGE_n` markers in the model text. The original image data stays in the client and is restored to the question matching the returned marker. Remote web image URLs are not downloaded; export a self-contained HTML file or keep its image folder beside it.

Loose ZIP or multi-select images named `Q19.png`, `Question-19.jpg`, or `19.webp` are automatically bound to question 19. The structured AI JSON carries `questionNumber`, `imageRef`, and `imageFilename`; immediately before saving, the client adds an image object containing the filename, MIME type, and Base64 data URL. The Worker stores the validated data URL in `questions.image_url`.

The importer detects explicit exam titles and minute-based duration labels. The administrator can create a new exam using those values or select an existing exam. Marks remain per-question and support decimals such as `2.5`.

Only extracted text and optional taxonomy instructions are sent to `POST /admin/ai/import`; source files and images are never sent to the model. The Worker prompt requires lossless transcription, forbids invented questions or answers, and omits questions whose correct answer is not explicit. It sends the request through the private OpenCode relay. AI output remains an editable draft and must be reviewed before adding it to an exam.

After review, drafts added to an existing exam use `window.CrosslineApi.importQuestions(examId, questions)`. A new exam uses `window.CrosslineApi.deployExam(exam, questions)`, which validates and writes the exam plus all questions atomically.

## GLM Assistant

The Overview and **GLM assistant** pages provide a conversational drafting workspace. Administrators can attach HTML, PDF, Markdown, JSON, text, CSV, or image sources; discuss the locally extracted content; then send the same attachment into the structured import workflow. They can also ask for an original four-option MCQ, verify answer logic, plan an exam, improve subject/chapter/topic labels, or format mathematics as LaTeX.

Conversation history stays in the running client and only a bounded copy is sent to the authenticated Worker endpoint for each reply. The Worker forwards it to a private OpenCode 1.17.18 server using GLM 5.2. OpenCode runs with every file, shell, editing, web, and auxiliary tool denied. Replies render as Markdown. Deployment happens only after administrator review through the authenticated deploy action.

## Notifications

`showAdminNotifications()` publishes concise broadcast messages through the Worker. Students see them from the dashboard bell and can mark them as read.

The frontend sends question data to:

```js
window.CrosslineApi.createQuestion(examId, question)
window.CrosslineApi.importQuestions(examId, questions)
window.CrosslineApi.updateQuestion(examId, questionId, question)
window.CrosslineApi.deleteQuestion(examId, questionId)
```

Backend endpoints:

```http
POST /admin/exams/:examId/questions
POST /admin/exams/:examId/questions/import
PUT /admin/exams/:examId/questions/:questionId
DELETE /admin/exams/:examId/questions/:questionId
```

## Marks

Each question has a `marks` value. Results use marks-based scoring, not just "number of correct questions."

Example:

- Question 1: 2 marks
- Question 2: 5 marks
- Student gets Question 2 correct only
- Score: 5 / 7

Frontend helpers:

- `normalizeMarks()`
- `formatScore()`

Backend helpers:

- `normalizeMarks()`
- `roundScore()`
- `formatScore()`

## LaTeX and MathJax

`src/index.html` loads MathJax from jsDelivr. The admin UI tells admins they can write LaTeX in:

- question text
- options
- explanations

Example:

```text
\(x^2 + y^2\)
```

The frontend renders text using `mathHtml()` and then calls `renderMath()`.

## Images and Graphs

Current image support is simple:

1. Admin selects an image file.
2. Browser reads it with `FileReader`.
3. The app stores a base64 data URL in the question object.
4. The Worker stores that string in `image_url` or `explanation_image_url`.

This is easy but not ideal for large files. The Worker rejects JSON bodies over 128 KB. For serious content authoring, add a proper upload endpoint and store images in R2 or another object store.

## Deleting Exams

Frontend:

```js
deleteExam(examId)
```

Backend:

```http
DELETE /admin/exams/:examId
```

The backend deletes:

- session events linked to that exam's attempts
- exam sessions
- questions
- the exam itself

This is permanent. Add a soft-delete or archive flag if admins need safer production behavior.

## Student Submissions in Admin

Admin submissions show:

- student email
- exam title
- created/submitted times
- result email status
- event count

Submission detail shows:

- score
- started/submitted timestamps
- phone camera connection time
- result email status
- answer review
- security/event log
