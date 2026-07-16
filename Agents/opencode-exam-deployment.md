# OpenCode Exam Deployment

The complete current description now lives in [AI Assistant and File Import](ai-assistant-and-file-import.md).

The short rule is:

```text
local extraction/OCR -> authenticated Worker -> restricted OpenCode/GLM -> editable draft -> validated D1 batch
```

OpenCode cannot read project files, use shell/web tools, or access D1. The model never deploys directly. Only the separate administrator save action can call the validated deployment endpoint.
