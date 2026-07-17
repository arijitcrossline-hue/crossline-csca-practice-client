# Results System

Results are marks-based and released immediately on submission. Email delivery is asynchronous and does not control visibility.

## Answer Persistence

During the exam, selection and flag changes call:

```http
POST /sessions/:sessionId/answers
```

```json
{
  "answers": { "question-uuid": 2 },
  "flags": ["question-uuid"],
  "submitted": false
}
```

`answers` are keyed by backend question UUID. Values are option indexes 0-3. Autosave updates JSON and timestamp without scoring.

## Submission

`submitExamAndExit()` shows a confirmation dialog. On confirmation it submits current answers and records `exam_submitted`.

The Worker:

1. sets `submitted_at` once
2. sets `result_released_at` to submission time
3. sets `result_email_after` to submission time
4. calculates earned and total marks
5. stores score columns
6. starts an asynchronous email sweep

The client then leaves kiosk and returns to the dashboard. It does not reopen a review screen automatically.

## Scoring

For every question:

- total += normalized marks
- earned += marks only when selected index equals `correct_index`
- `null` and missing answers never count as option index `0`

Scores are rounded to two decimal places. Skipped answers earn zero.

## Result List and Detail

`GET /results` returns up to 50 submitted attempts. `ready` is true when `result_released_at` or the older compatibility `result_emailed_at` is present.

`GET /results/:id` verifies ownership and returns:

- exam/result metadata and score
- every question and all four options
- selected option/index
- correct option/index
- correct/wrong/skipped state
- marks earned and available
- explanation and explanation image
- question image
- subject, chapter, and topic

The frontend renders this with `showStudentResultDetail()` and `resultQuestionHtml()`.

## Dashboard Analytics

`loadStudentResultData()` loads the result list and full details for up to ten ready results. Renderer helpers derive:

- latest and average score percentage
- score improvement
- number of attempts
- subject trend graphs
- weakness bars
- subject/chapter/topic correct and total counts
- last skipped question
- last wrong question

These values are derived from result details rather than stored as separate analytics tables.

## Weakness Analysis

`topicPerformance()` groups all reviewed questions by taxonomy. A topic records total, correct, wrong, skipped, and related question references. `showWeaknessTopic()` can open mistakes/skips for one topic.

Taxonomy quality therefore depends on accurate question authoring/import classification.

## Leaderboards

### Exam mode

Uses each student's latest submitted attempt for the selected exam, converts earned/total to a percentage, ranks ties together, and returns up to 50 entries plus the current user's row.

### Average mode

Uses each student's latest five submitted attempts. With a subject filter, the Worker recalculates earned/total from only questions in that subject. Without a filter, it uses stored whole-exam scores.

Names are shortened by `leaderboardName()` before leaving the Worker. Raw emails are not returned.

## Result Email

The Worker sends a branded, responsive HTML email with a plain-text fallback. It contains the exam title, marks and percentage, position against the other students' best attempts for that exam, and subject-level personal-best progress. Rank and progress are calculated when the email is sent; they do not add persisted analytics columns.

Resend uses `VERIFY_FROM`. On success the Worker sets `result_emailed_at`; on failure it leaves the timestamp empty so a later sweep can retry.

Email sweeps run immediately after submit, opportunistically during API requests, and through the Worker's scheduled handler. Result visibility remains immediate even if Resend is unavailable.

## Admin Review

Admin submission detail reuses `buildResultDetail()` and adds student identity plus session events. This keeps student and admin scoring logic consistent.

## Local Mode

`saveLocalExamResult()` calculates a result in the renderer and stores it under a per-user localStorage key. It is for UI development only.
