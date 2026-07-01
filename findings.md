# EnglishStudyShelf Findings

## Initial Workspace
- The project directory started empty.
- No existing application conventions were present, so v1 can use a conventional TypeScript monorepo layout.

## Product Constraints
- The repository must contain code only, not PDF教材 or book assets.
- User PDFs and study records should live in local ignored runtime storage.
- AI calls must be narrowly scoped to selected text and cached locally.

## Architecture Notes
- A local API process is appropriate for v1 because it can hold the OpenAI API key in local environment variables and avoid exposing it to browser code.
- The PDF file itself should be served only to the local reader route and never used as AI request input.
