# EnglishStudyShelf Findings

## Initial Workspace
- The project directory started empty.
- No existing application conventions were present, so v1 used a conventional TypeScript monorepo layout.

## Product Constraints
- The repository must contain code only, not textbook PDFs or book assets.
- User PDFs and study records should live in local ignored runtime storage.
- AI calls must be narrowly scoped to selected text and cached locally.

## Architecture Notes
- A local API process is appropriate for v1 because it can hold the OpenAI API key in local environment variables and avoid exposing it to browser code.
- The PDF file itself should be served only to the local reader route and never used as AI request input.

## Publishing And Copy Notes
- The GitHub repository is public at `https://github.com/a13622349460-png/EnglishStudyShelf`.
- The local `main` branch tracks `origin/main`.
- User-facing documentation and app UI should use Chinese-English mixed copy rather than English-only copy.
- Generated local files remain ignored: `.env`, `data/`, `node_modules/`, build output, logs, and TypeScript build info.
