# Admin Dashboard and Exam Creation

The administrator UI lives in `src/app.js`; all production writes are authenticated Worker routes.

## Navigation

`adminShell()` provides:

- Overview
- GLM assistant
- Exam library
- Import questions
- Student attempts
- Notifications

`bindAdminShell()` owns navigation and logout. Admin logout clears the admin token.

## Exam Library

`showAdminDashboard()` renders every exam from `GET /admin/exams`. Cards show title, description, duration, question count, total marks, and free access.

`showCreateExam()` collects title, description, and duration. `POST /admin/exams` creates a published exam with zero price.

`deleteExam()` requires confirmation and calls `DELETE /admin/exams/:id`. This permanently removes the exam, questions, linked attempts, and attempt events.

## Question Editor

`showQuestionEditor(examId)` displays existing questions and a form for a new one. `showQuestionEdit(examId, index)` loads one question into an edit form. After saving, the app reloads the admin exam library from the API.

Question fields:

- type and instruction
- subject, chapter, and topic
- question text
- exactly four options
- explicit correct option
- decimal marks
- optional question image
- explanation text
- optional explanation image/graph
- built-in diagram flag

The editor uses `FileReader` for manually selected images. `bindImageInput()` updates the preview and stores a data URL in renderer state.

API methods:

- `createQuestion()`
- `updateQuestion()`
- `deleteQuestion()`
- `importQuestions()`

The Worker validates and normalizes every saved question. Deleting a question does not renumber the remaining `position` values, but fetch order remains by position.

## Math and LaTeX

MathJax is loaded by `src/index.html`. Question text, options, and explanations may contain inline or display LaTeX, for example `\(x^2 + y^2\)`. Screens call `renderMath()` after inserting content.

## Import Workspace

`showQuestionImport()` supports file picker, drag/drop, direct text paste, local JSON/text parsing, and OpenCode structuring. A step indicator (Add sources → Structure with GLM → Review drafts → Deploy exams) tracks progress through the screen.

Admin chooses either:

- create a new exam from source metadata
- append questions to an existing exam

### Exam auto-builder

The auto-builder on the same screen handles bulk dumps. Extraction keeps one source group per dropped file. `runAutoExamBuild()` splits each group into batches under the Worker's 220,000-character import limit at question boundaries (`splitSourceIntoChunks()`), calls `POST /admin/ai/import` once per batch with a progress bar, rebinds local images (`bindDraftImages()`), and de-duplicates repeated questions (`dedupeDraftQuestions()`). Grouping is selectable: one exam per source file, or everything combined into one exam. Each resulting exam draft card has an editable title, duration, and description plus an expandable question review. **Deploy all reviewed exams** iterates `POST /admin/ai/deploy` per group; each deployment stays atomic and per-exam status chips report ready/deploying/deployed/failed.

Draft cards show question text, optional image, options, correct answer, marks, taxonomy, and image-to-question mapping. The admin must click **Save reviewed drafts** before any write occurs.

The complete extraction/model/image flow is documented in [AI Assistant and File Import](ai-assistant-and-file-import.md).

## AI Assistant

`showAdminAssistant()` keeps a bounded in-memory conversation and one locally extracted attachment. The assistant can discuss or draft, but cannot save. **Prepare questions from files** transfers the existing attachment object into the structured import screen without rereading the file.

## Marks and Free Access

Scoring uses each question's real-number `marks`. Exactly 48 imported questions receive the fixed schedule described in the API guide. All exam create/import/deploy paths set price to zero, and every authenticated student can start every published exam.

## Notifications

`showAdminNotifications()` lists broadcasts and creates a new one through `/admin/notifications`. Notifications have title, body, kind, audience, creator, and timestamp. Student read receipts are separate rows.

## Student Attempts

`showAdminSubmissions()` loads recent attempts. `showAdminSubmissionDetail()` shows:

- student and exam
- submission/release/email timestamps
- marks-based score
- answer review with selected/correct option and explanation
- phone pairing/setup/integrity event log

No webcam, microphone, phone-camera, room-scan, screen recording, or video player exists because media is not captured.

## Current Image Storage Constraint

Manual and imported images are saved directly in question rows as data URLs. Local import compresses images; backend validation limits each encoded image. This works for small diagrams but should eventually move to R2 with signed admin uploads and stored object URLs.
