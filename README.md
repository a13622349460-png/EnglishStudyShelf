# EnglishStudyShelf

EnglishStudyShelf is a local-first English ebook study web tool. It lets you upload your own PDF files, read them locally, ask AI to explain selected words or sentences, keep a vocabulary notebook, and track reading progress.

## Privacy Model

- The repository contains code only. It does not include textbook PDFs or other book resources.
- Uploaded PDFs are saved under local `data/books/`, which is ignored by Git.
- Study records and AI explanation cache are saved in a local SQLite database under `data/`, which is ignored by Git.
- AI explanation requests send only the selected text and explanation mode.
- The app does not send the whole PDF to AI by default.
- `.env` is ignored. Use `.env.example` as a template for local settings.

## First Version Features

- Book shelf page
- PDF upload
- PDF reading page
- Selected word or sentence explanation
- Vocabulary notebook
- Progress visualization
- Local AI result cache

## Local Setup

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Fill `OPENAI_API_KEY` in `.env` if you want real AI explanations.

Run locally:

```powershell
npm.cmd run dev
```

The API runs on `http://localhost:3333`, and the web app runs on the Vite URL printed in the terminal, usually `http://localhost:5173`.

## One-Click Start On Windows

Double-click `start-english-study-shelf.cmd` in the project folder.

The launcher creates `.env` from `.env.example` if needed, installs dependencies if `node_modules` is missing, starts the local app, and opens the browser. Keep the launcher window open while using the app.

## Important Repository Rules

- Do not commit PDF files.
- Do not commit `.env`.
- Do not commit `data/`.
- Do not add a feature that sends a full book to AI without an explicit user action and a clear warning.
