# EnglishStudyShelf Progress

## 2026-07-01

### Session Start
- Started greenfield project planning for a local English PDF study tool.
- Confirmed empty workspace.
- Created planning files before implementation.

### Scaffold Progress
- Added repository safety files: `.gitignore`, `.env.example`, and `README.md`.
- Added npm workspace metadata and shared TypeScript types.
- Added the local API app with PDF upload, book listing, PDF serving, progress, vocabulary, and selected-text AI explanation cache endpoints.
- Added the React frontend with book shelf, upload UI, PDF reader, selected-text explanation panel, vocabulary view, and progress metrics.
- Installed dependencies after switching from `npm` to `npm.cmd` on Windows.
- First type check found targeted TypeScript issues in upload filtering, Vite env types, and PDF text item narrowing.
- Type check and production build passed after fixes.
- Direct Vite start initially failed because it tried to create a temp directory under the workspace package `node_modules`; updated Vite cache location to root `node_modules`.
- Updated README commands for Windows `npm.cmd`.
- Replaced deprecated root npm workspace flags with `--workspaces`.
- Final `npm.cmd run check` passed.
- Final `npm.cmd run build` passed; Vite only reported the expected PDF.js chunk-size warning.
- Short foreground `npm.cmd run dev` verification started API on `http://localhost:3333` and web on `http://127.0.0.1:5174/` because `5173` was already occupied.
- File audit found no committed `.env` and no PDF files; local runtime `data/` was created and is ignored by `.gitignore`.

### One-Click Launcher
- Added `start-english-study-shelf.cmd` for Windows double-click startup.
- The launcher checks Node/npm, creates `.env` from `.env.example` when missing, installs dependencies when `node_modules` is missing, and runs the local dev server.
- Updated the web dev script to open the browser automatically.
- Documented the one-click launcher in README.
- Verified `npm.cmd run check` and `npm.cmd run build` after adding the launcher.

### GitHub Upload Prep
- Confirmed GitHub connector login: `a13622349460-png`.
- Searched installed GitHub repositories for `EnglishStudyShelf`; none were found.
- Tightened `.gitignore` to exclude TypeScript build info and runtime logs before preparing upload.
- Initialized the local Git repository and created the initial commit `0a19de0`.
- Added remote `https://github.com/a13622349460-png/EnglishStudyShelf.git`.
- Pushed local `main` to GitHub and verified `README.md` plus `start-english-study-shelf.cmd` through the GitHub connector.
