# Results System

The result system saves answers during the exam, scores and releases the result on submit, queues a result email, and opens the full answer breakdown immediately.

## Main Frontend Functions

- `saveSessionAnswers(submitted = false)`
- `submitExamAndExit()`
- `saveLocalExamResult()`
- `showStudentDashboard()`
- `showStudentResults()`
- `showStudentResultDetail(resultId)`
- `resultQuestionHtml(question)`

## Main Backend Functions

- `saveAnswers()`
- `listResults()`
- `resultDetail()`
- `sendDueResultEmails()`
- `scoreExamSession()`
- `buildResultDetail()`
- `sendResultEmail()`

## During the Exam

When a student selects an answer or flags a question, the frontend calls:

```js
saveSessionAnswers(false)
```

In API mode this sends:

```http
POST /sessions/:sessionId/answers
```

Payload shape:

```json
{
  "answers": {
    "question-id-1": 0,
    "question-id-2": 3
  },
  "flags": ["question-id-2"],
  "submitted": false
}
```

The backend stores:

- `answers_json`
- `flags_json`
- `updated_at`

## On Submit

The submit button opens a confirmation dialog:

```text
Are you sure you want to submit your answers?
```

If confirmed, `submitExamAndExit()` calls:

```js
saveSessionAnswers(true)
recordSessionEvent("exam_submitted", ...)
showStudentDashboard()
```

When `submitted` is true, the backend sets:

- `submitted_at`
- `result_email_after`
- `score_earned`
- `score_total`

`result_released_at` and `result_email_after` are set at submission. The API response is immediately ready while email delivery continues asynchronously.

## Dashboard Analytics

The dashboard loads up to ten released result details. It renders a large score graph only for subjects the student has attempted. Weakness analysis groups every answer by subject, chapter, and topic, reports values such as “5 correct out of 10,” and lets the student open all mistakes and skips for one topic.

The leaderboard has two real modes:

- latest attempt for a selected exam
- last-five average, optionally recalculated for one selected subject

Only shortened student display names are returned.

## Delayed Result Release

The Worker releases due results in two ways:

1. A scheduled Worker handler calls `sendDueResultEmails(env)`.
2. Normal API requests call `queueResultEmailSweep()`, which runs a background sweep at most once per minute.

When a result is due:

1. Worker calculates the score.
2. Worker sends a result email through Resend if `RESEND_API_KEY` exists.
3. Worker sets `result_emailed_at`.

Before `result_emailed_at` is set, students see the result as pending.

## Scoring

Scoring is marks-based.

For each question:

- add `question.marks` to total
- if selected answer equals `correct_index`, add marks to earned score

The result is rounded to two decimal places.

Example:

```text
Question 1 = 1 mark, correct
Question 2 = 2.5 marks, wrong
Question 3 = 3 marks, correct
Score = 4 / 6.5
```

## Student Results Page

`showStudentResults()` displays:

- exam title
- submitted time
- pending/released status
- score if released

Pending results cannot be opened.

Released result details show:

- all questions
- all answer options
- selected option
- correct option
- marks earned/available
- explanation
- explanation image if present

This is rendered by `resultQuestionHtml(question)`.

## Local Mode Results

If the API is disabled, `saveLocalExamResult()` calculates and stores results in localStorage immediately for development and testing.

## Admin Submission Review

Admins can review attempts in:

```js
showAdminSubmissions()
showAdminSubmissionDetail(submissionId)
```

Backend endpoints:

```http
GET /admin/submissions
GET /admin/submissions/:sessionId
```

Admin detail returns the same marks-based answer review plus event logs.
