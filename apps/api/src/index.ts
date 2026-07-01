import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname, join, parse } from "node:path";
import { existsSync } from "node:fs";
import type { Book, ProgressSummary, ReadingProgress, VocabularyEntry } from "@english-study-shelf/shared";
import { explainSchema, cacheKeyFor, explainWithOpenAI, normalizeSelection } from "./ai.js";
import { getDb } from "./db.js";
import { booksDir, ensureRuntimeDirs } from "./paths.js";

ensureRuntimeDirs();

const app = express();
const port = Number(process.env.PORT || 3333);
const db = getDb();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Only local development origins are allowed."));
    }
  })
);
app.use(express.json({ limit: "64kb" }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, booksDir),
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase() || ".pdf";
      callback(null, `${randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === "application/pdf" || extname(file.originalname).toLowerCase() === ".pdf";
    if (!isPdf) {
      callback(new Error("Only PDF uploads are accepted."));
      return;
    }
    callback(null, true);
  }
});

type BookRow = {
  id: string;
  title: string;
  file_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  page_number?: number | null;
  total_pages?: number | null;
  progress_updated_at?: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function bookFromRow(row: BookRow): Book {
  const progress =
    row.page_number && row.total_pages
      ? {
          bookId: row.id,
          pageNumber: row.page_number,
          totalPages: row.total_pages,
          updatedAt: row.progress_updated_at ?? row.created_at
        }
      : null;

  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    progress
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "EnglishStudyShelf API" });
});

app.get("/api/books", (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT
        b.*,
        p.page_number,
        p.total_pages,
        p.updated_at as progress_updated_at
      FROM books b
      LEFT JOIN reading_progress p ON p.book_id = b.id
      ORDER BY b.created_at DESC
    `
    )
    .all() as BookRow[];

  res.json(rows.map(bookFromRow));
});

app.post("/api/books/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing PDF file." });
    return;
  }

  const id = randomUUID();
  const title = String(req.body.title || parse(req.file.originalname).name || "Untitled PDF").trim();
  const createdAt = nowIso();

  db.prepare(
    `
    INSERT INTO books (id, title, file_name, stored_name, mime_type, size_bytes, created_at)
    VALUES (@id, @title, @fileName, @storedName, @mimeType, @sizeBytes, @createdAt)
  `
  ).run({
    id,
    title,
    fileName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype || "application/pdf",
    sizeBytes: req.file.size,
    createdAt
  });

  res.status(201).json({
    id,
    title,
    fileName: req.file.originalname,
    sizeBytes: req.file.size,
    createdAt,
    progress: null
  } satisfies Book);
});

app.get("/api/books/:id/file", (req, res) => {
  const row = db.prepare("SELECT stored_name, file_name FROM books WHERE id = ?").get(req.params.id) as
    | { stored_name: string; file_name: string }
    | undefined;

  if (!row) {
    res.status(404).json({ error: "Book not found." });
    return;
  }

  const filePath = join(booksDir, row.stored_name);
  if (!existsSync(filePath)) {
    res.status(404).json({ error: "Local PDF file is missing." });
    return;
  }

  res.type("application/pdf");
  res.sendFile(filePath);
});

app.put("/api/books/:id/progress", (req, res) => {
  const pageNumber = Number(req.body.pageNumber);
  const totalPages = Number(req.body.totalPages);

  if (!Number.isInteger(pageNumber) || !Number.isInteger(totalPages) || pageNumber < 1 || totalPages < 1) {
    res.status(400).json({ error: "pageNumber and totalPages must be positive integers." });
    return;
  }

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) {
    res.status(404).json({ error: "Book not found." });
    return;
  }

  const updatedAt = nowIso();
  db.prepare(
    `
    INSERT INTO reading_progress (book_id, page_number, total_pages, updated_at)
    VALUES (@bookId, @pageNumber, @totalPages, @updatedAt)
    ON CONFLICT(book_id) DO UPDATE SET
      page_number = excluded.page_number,
      total_pages = excluded.total_pages,
      updated_at = excluded.updated_at
  `
  ).run({ bookId: req.params.id, pageNumber, totalPages, updatedAt });

  res.json({ bookId: req.params.id, pageNumber, totalPages, updatedAt } satisfies ReadingProgress);
});

app.get("/api/progress/summary", (_req, res) => {
  const rows = db
    .prepare("SELECT page_number, total_pages FROM reading_progress WHERE total_pages > 0")
    .all() as Array<{ page_number: number; total_pages: number }>;
  const totalBooks = (db.prepare("SELECT COUNT(*) as count FROM books").get() as { count: number }).count;
  const startedBooks = rows.length;
  const completedBooks = rows.filter((row) => row.page_number >= row.total_pages).length;
  const averagePercent = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.page_number / row.total_pages, 0) * 100 / rows.length)
    : 0;

  res.json({ totalBooks, startedBooks, completedBooks, averagePercent } satisfies ProgressSummary);
});

app.get("/api/vocabulary", (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT id, book_id, text, note, explanation, created_at
      FROM vocabulary
      ORDER BY created_at DESC
    `
    )
    .all() as Array<{
    id: string;
    book_id: string | null;
    text: string;
    note: string | null;
    explanation: string | null;
    created_at: string;
  }>;

  const entries: VocabularyEntry[] = rows.map((row) => ({
    id: row.id,
    bookId: row.book_id,
    text: row.text,
    note: row.note,
    explanation: row.explanation,
    createdAt: row.created_at
  }));
  res.json(entries);
});

app.post("/api/vocabulary", (req, res) => {
  const text = normalizeSelection(String(req.body.text || ""));
  if (!text) {
    res.status(400).json({ error: "Vocabulary text is required." });
    return;
  }

  const id = randomUUID();
  const createdAt = nowIso();
  const entry: VocabularyEntry = {
    id,
    bookId: req.body.bookId || null,
    text,
    note: req.body.note || null,
    explanation: req.body.explanation || null,
    createdAt
  };

  db.prepare(
    `
    INSERT INTO vocabulary (id, book_id, text, note, explanation, created_at)
    VALUES (@id, @bookId, @text, @note, @explanation, @createdAt)
  `
  ).run(entry);

  res.status(201).json(entry);
});

app.post("/api/explain", async (req, res) => {
  const parsed = explainSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const selection = normalizeSelection(parsed.data.selection);
  const cacheKey = cacheKeyFor(selection, parsed.data.mode);
  const cached = db
    .prepare("SELECT explanation FROM explanation_cache WHERE cache_key = ?")
    .get(cacheKey) as { explanation: string } | undefined;

  if (cached) {
    db.prepare(
      "UPDATE explanation_cache SET last_used_at = ?, hit_count = hit_count + 1 WHERE cache_key = ?"
    ).run(nowIso(), cacheKey);
    res.json({ explanation: cached.explanation, cached: true, cacheKey });
    return;
  }

  try {
    const explanation = await explainWithOpenAI(selection, parsed.data.mode);
    const createdAt = nowIso();
    db.prepare(
      `
      INSERT INTO explanation_cache
        (cache_key, book_id, selection, mode, explanation, created_at, last_used_at, hit_count)
      VALUES
        (@cacheKey, @bookId, @selection, @mode, @explanation, @createdAt, @createdAt, 0)
    `
    ).run({
      cacheKey,
      bookId: parsed.data.bookId || null,
      selection,
      mode: parsed.data.mode,
      explanation,
      createdAt
    });

    res.json({ explanation, cached: false, cacheKey });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "AI explanation failed." });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: error instanceof Error ? error.message : "Request failed." });
});

app.listen(port, () => {
  console.log(`EnglishStudyShelf API listening on http://localhost:${port}`);
});
