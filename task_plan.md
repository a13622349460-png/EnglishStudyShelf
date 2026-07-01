# EnglishStudyShelf Task Plan

## Goal
Build the first local runnable version of EnglishStudyShelf: a local English ebook study web tool where users upload their own PDF files, read them locally, request AI explanations for selected text only, keep a vocabulary notebook, visualize progress, and cache AI explanations to avoid repeated token spend.

## Non-Negotiable Constraints
- Do not include textbook PDFs or any book resources in the repository.
- Do not commit `.env` or secrets.
- Do not send whole books to AI by default.
- AI explanation requests must send only the user-selected word, phrase, or sentence plus minimal optional context.
- No login for v1.
- No public hosting for v1.
- Prioritize a local runnable developer version.

## Proposed Stack
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + Express + TypeScript.
- PDF viewing: browser-side PDF.js via `pdfjs-dist`.
- Local app data: SQLite database under ignored `data/`.
- Uploaded PDFs: local ignored `data/books/`.
- AI: backend proxy endpoint reading `OPENAI_API_KEY` from local environment, with `.env.example` committed and `.env` ignored.

## Planned File Structure
- `apps/web/` - React frontend.
- `apps/api/` - local Express API.
- `packages/shared/` - shared TypeScript types.
- `data/` - local runtime storage, ignored by Git.
- `task_plan.md`, `findings.md`, `progress.md` - planning files.

## Phases

### Phase 1 - Planning And Safety Baseline
Status: complete

Tasks:
- Create persistent planning files.
- Record project constraints and stack choice.
- Add `.gitignore` that protects `.env`, uploaded PDFs, SQLite DBs, caches, and build output.

### Phase 2 - Project Scaffold
Status: complete

Tasks:
- Add workspace `package.json` and TypeScript configs.
- Create frontend, backend, and shared package folders.
- Add README with local setup and privacy model.

### Phase 3 - Local Data And API
Status: complete

Tasks:
- Add SQLite schema and database helper.
- Add endpoints for books, upload, progress, vocabulary, and AI explanation cache.
- Ensure upload accepts PDFs only and stores files under ignored local data directory.

### Phase 4 - Frontend Experience
Status: complete

Tasks:
- Build book shelf page.
- Build upload flow.
- Build PDF reading page.
- Add selected-text explanation UI.
- Add vocabulary notebook view.
- Add learning progress visualization.

### Phase 5 - Verification And Finish
Status: complete

Tasks:
- Run available static checks or syntax checks.
- Confirm no bundled PDFs, no `.env`, and no whole-book AI endpoint.
- Update progress and findings.

### Phase 6 - Publishing And Copy Polish
Status: complete

Tasks:
- Add a Windows one-click launcher for local startup.
- Initialize local Git history and publish the repository to GitHub.
- Change project documentation and visible UI text to Chinese-English mixed copy.
- Verify checks and builds after publishing and copy updates.

## Decisions
- Use a local backend instead of browser-only OpenAI calls so the API key stays out of frontend code.
- Store user uploads and learning data in ignored local runtime files so public source code remains clean.
- Cache AI explanations server-side by hashing the selected text and explanation mode.
- Keep uploaded PDFs and the SQLite database under ignored `data/`.
- Use `npm.cmd` in Windows instructions because direct `npm` can be blocked by PowerShell execution policy.
- Vite may choose `http://127.0.0.1:5174/` when `5173` is already occupied.
- Add a Windows `.cmd` launcher for one-click local startup.
- Keep public-facing copy Chinese-English mixed so the English learning tool stays friendly to Chinese readers.
- GitHub remote is `https://github.com/a13622349460-png/EnglishStudyShelf.git`.

## Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| `npm install` blocked by PowerShell script policy | Ran `npm install` directly | Used `npm.cmd install` instead |
| Initial `npm.cmd install` timed out inside sandbox | Retried once with approval for dependency download | Install completed and audit found 0 vulnerabilities |
| TypeScript errors in API upload filter and web PDF/env types | Ran `npm.cmd run check` | Fixed targeted type issues; check now passes |
| Direct Vite start failed with `EPERM` creating `apps/web/node_modules/.vite-temp` | Ran Vite entry from `apps/web` | Set Vite `cacheDir` to root `node_modules/.vite/apps-web` for workspace layout |
| `git status` failed with `not a git repository` | Tried local Git status | Treating workspace as code folder; used file audit instead |
| Background server launch wrappers exited in this sandbox | Tried multiple hidden process wrappers | Verified foreground `npm.cmd run dev` startup; user can run the command to keep it alive |
| `.git` metadata was read-only in the sandbox | Tried `git init`, `git config`, and `git commit` normally | Used approved escalations only for Git metadata writes and network push |
