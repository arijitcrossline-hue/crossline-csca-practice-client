# OpenCode Exam Deployment

The administrator assistant uses OpenCode with GLM 5.2 through the private relay. It never receives database credentials. The Windows client extracts the source locally, the Worker validates every draft, and only an authenticated administrator can deploy an exam.

## Supported Sources

Administrators can attach ZIP banks, HTML, PDF, Markdown, text, JSON, CSV, PNG, JPG, WebP, BMP, and TIFF files. Multiple files can be selected together, although one ZIP is faster for a large image set. HTML structure, PDF text, and OCR are extracted on the administrator's computer. Images are represented by `CROSSLINE_IMAGE_n` markers and restored to their matching questions after GLM structures the text.

Loose question images should use a question-number filename such as `Q19.png`, `Question-19.png`, or `19.png`. The importer extracts `questionNumber: 19` from that name. This filename mapping is deterministic and is used even if GLM accidentally omits the image marker. Files without an identifiable question number remain visible for review but are not silently attached to an arbitrary question.

## Import Flow

1. Open **Administration > GLM assistant** or **Import questions**.
2. Attach a source. The Windows client extracts it locally.
3. Ask GLM about the source or choose **Structure with OpenCode**.
4. GLM returns structured question drafts. It must not invent a missing correct answer.
5. Review wording, four options, correct answer, marks, explanation, chapter, and images.
6. Choose **Save reviewed drafts**. For a new exam, the client calls `POST /admin/ai/deploy`; the Worker creates the exam and questions in one D1 batch.

The deploy endpoint accepts:

```json
{
  "exam": {
    "title": "CSCA Full Mock 2",
    "description": "Full-length practice paper.",
    "duration": 60
  },
  "questions": [
    {
      "questionNumber": 19,
      "subject": "Physics",
      "chapter": "Kinematics",
      "topic": "Projectile motion",
      "text": "Question text",
      "answers": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "marks": 1.5,
      "explanation": "Explanation",
      "imageRef": "CROSSLINE_IMAGE_7",
      "imageFilename": "Q19.png",
      "image": {
        "filename": "Q19.png",
        "mimeType": "image/png",
        "dataUrl": "data:image/png;base64,iVBORw0KGgo..."
      }
    }
  ]
}
```

GLM returns `imageRef` and `imageFilename`; it does not receive the binary PNG. Before deployment, the Windows client resolves the reference against the locally extracted files and adds the `image` object shown above. `dataUrl` contains the actual PNG bytes encoded as Base64, so a temporary Mac or Windows filesystem path is never stored. The Worker validates the image, stores the data URL in `questions.image_url`, and returns it with the exam. Student clients render that value directly in an `<img>` element.

For a 48-question paper with `Q2.png`, `Q19.png`, and `Q48.png`, those assets bind to questions 2, 19, and 48 respectively. The administrator preview displays `Q19.png → Question 19` before deployment.

The browser never calls this endpoint without an administrator bearer token. The Worker validates the question count, exam metadata, every option, and every correct index before writing anything.

## Defaults and Classification

The normal full mock defaults to 60 minutes and 48 questions. For exactly 48 questions, the backend enforces this mark schedule:

- Questions 1-12: 1.5 marks each
- Questions 13-38: 2 marks each
- Questions 39-48: 3 marks each

Physics, Chemistry, and Mathematics questions are normalized into the fixed chapter catalogs in `worker/src/index.js`. An exact supplied chapter wins. Otherwise, keyword matching chooses the closest allowed chapter. Administrators should review ambiguous classifications before deployment.

## Safety Rules

- Do not give OpenCode a D1 token, Cloudflare token, VPS key, or administrator password.
- Do not bypass the Worker and write directly to D1.
- Do not deploy questions without explicit correct answers.
- Keep source wording unchanged for imported papers.
- Use the authenticated deploy endpoint so validation and atomic writes remain in force.
