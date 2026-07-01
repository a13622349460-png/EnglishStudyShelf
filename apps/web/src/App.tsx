import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FilePlus2,
  Library,
  Loader2,
  NotebookTabs,
  Sparkles
} from "lucide-react";
import type { Book, ExplainMode, ProgressSummary, VocabularyEntry } from "@english-study-shelf/shared";
import {
  addVocabulary,
  explainSelection,
  listBooks,
  listVocabulary,
  progressSummary,
  uploadBook
} from "./api";
import { PdfReader } from "./PdfReader";

type View = "shelf" | "reader" | "vocabulary";

type SelectionState = {
  text: string;
  pageNumber?: number;
};

const emptySummary: ProgressSummary = {
  totalBooks: 0,
  startedBooks: 0,
  completedBooks: 0,
  averagePercent: 0
};

export function App() {
  const [view, setView] = useState<View>("shelf");
  const [books, setBooks] = useState<Book[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [summary, setSummary] = useState<ProgressSummary>(emptySummary);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionState>({ text: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeBook = useMemo(() => books.find((book) => book.id === activeBookId) ?? null, [activeBookId, books]);

  const refresh = useCallback(async () => {
    const [nextBooks, nextVocabulary, nextSummary] = await Promise.all([
      listBooks(),
      listVocabulary(),
      progressSummary()
    ]);
    setBooks(nextBooks);
    setVocabulary(nextVocabulary);
    setSummary(nextSummary);
  }, []);

  useEffect(() => {
    refresh()
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : "Failed to load app data"))
      .finally(() => setLoading(false));
  }, [refresh]);

  function openBook(bookId: string) {
    setActiveBookId(bookId);
    setSelection({ text: "" });
    setView("reader");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand-button" onClick={() => setView("shelf")}>
          <Library size={22} />
          <span>EnglishStudyShelf</span>
        </button>
        <nav className="nav-tabs" aria-label="Primary">
          <button type="button" className={view === "shelf" ? "active" : ""} onClick={() => setView("shelf")}>
            <BookOpen size={17} />
            <span>Books</span>
          </button>
          <button
            type="button"
            className={view === "vocabulary" ? "active" : ""}
            onClick={() => setView("vocabulary")}
          >
            <NotebookTabs size={17} />
            <span>Words</span>
          </button>
        </nav>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main>
        {loading ? (
          <div className="loading-state page-loading">
            <Loader2 size={22} className="spin" />
            <span>Loading</span>
          </div>
        ) : null}

        {!loading && view === "shelf" ? (
          <ShelfView books={books} summary={summary} onUploadDone={refresh} onOpenBook={openBook} />
        ) : null}

        {!loading && view === "reader" && activeBook ? (
          <ReaderView
            book={activeBook}
            selection={selection}
            onBack={() => setView("shelf")}
            onSelection={(text, pageNumber) => setSelection({ text, pageNumber })}
            onProgressSaved={refresh}
            onVocabularyChanged={async () => {
              await refresh();
              setView("vocabulary");
            }}
          />
        ) : null}

        {!loading && view === "vocabulary" ? <VocabularyView entries={vocabulary} books={books} /> : null}
      </main>
    </div>
  );
}

function ShelfView({
  books,
  summary,
  onUploadDone,
  onOpenBook
}: {
  books: Book[];
  summary: ProgressSummary;
  onUploadDone: () => Promise<void>;
  onOpenBook: (bookId: string) => void;
}) {
  return (
    <div className="workspace">
      <section className="panel shelf-panel">
        <div className="section-head">
          <div>
            <h1>Books</h1>
            <p>{books.length} local PDFs</p>
          </div>
          <UploadBox onUploadDone={onUploadDone} />
        </div>

        <div className="book-grid">
          {books.map((book) => (
            <button key={book.id} type="button" className="book-card" onClick={() => onOpenBook(book.id)}>
              <div className="book-cover">
                <BookOpen size={26} />
              </div>
              <div className="book-info">
                <strong>{book.title}</strong>
                <span>{formatBytes(book.sizeBytes)}</span>
                <ProgressBar percent={progressPercent(book)} />
              </div>
            </button>
          ))}
          {!books.length ? (
            <div className="empty-state">
              <FilePlus2 size={24} />
              <span>No PDFs yet</span>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="panel progress-panel">
        <div className="section-head compact">
          <div>
            <h2>Progress</h2>
            <p>{summary.averagePercent}% average</p>
          </div>
          <Database size={20} />
        </div>
        <div className="metric-row">
          <Metric label="Books" value={summary.totalBooks} />
          <Metric label="Started" value={summary.startedBooks} />
          <Metric label="Done" value={summary.completedBooks} />
        </div>
        <ProgressBar percent={summary.averagePercent} large />
      </aside>
    </div>
  );
}

function UploadBox({ onUploadDone }: { onUploadDone: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    if (!file) {
      setMessage("Choose a PDF");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await uploadBook(file, title || file.name.replace(/\.pdf$/i, ""));
      setFile(null);
      setTitle("");
      await onUploadDone();
      setMessage("Uploaded");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upload-box">
      <label className="file-picker">
        <FilePlus2 size={17} />
        <span>{file ? file.name : "PDF"}</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <input value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value)} />
      <button type="button" className="primary-button" onClick={handleUpload} disabled={busy}>
        {busy ? <Loader2 size={16} className="spin" /> : <FilePlus2 size={16} />}
        <span>Upload</span>
      </button>
      {message ? <span className="inline-message">{message}</span> : null}
    </div>
  );
}

function ReaderView({
  book,
  selection,
  onBack,
  onSelection,
  onProgressSaved,
  onVocabularyChanged
}: {
  book: Book;
  selection: SelectionState;
  onBack: () => void;
  onSelection: (selection: string, pageNumber: number) => void;
  onProgressSaved: () => void;
  onVocabularyChanged: () => Promise<void>;
}) {
  return (
    <div className="reader-layout">
      <div className="reader-titlebar">
        <button type="button" className="ghost-button" onClick={onBack}>
          Books
        </button>
        <div>
          <h1>{book.title}</h1>
          <p>{book.fileName}</p>
        </div>
      </div>
      <PdfReader bookId={book.id} onSelection={onSelection} onProgressSaved={onProgressSaved} />
      <ExplainPanel
        bookId={book.id}
        selection={selection}
        onVocabularyChanged={onVocabularyChanged}
      />
    </div>
  );
}

function ExplainPanel({
  bookId,
  selection,
  onVocabularyChanged
}: {
  bookId: string;
  selection: SelectionState;
  onVocabularyChanged: () => Promise<void>;
}) {
  const [mode, setMode] = useState<ExplainMode>("word");
  const [explanation, setExplanation] = useState("");
  const [cached, setCached] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setExplanation("");
    setCached(null);
    setMessage("");
  }, [selection.text]);

  async function handleExplain() {
    if (!selection.text) {
      setMessage("Select text");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await explainSelection({
        bookId,
        selection: selection.text,
        pageNumber: selection.pageNumber,
        mode
      });
      setExplanation(result.explanation);
      setCached(result.cached);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Explanation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveWord() {
    if (!selection.text) {
      return;
    }
    await addVocabulary({
      bookId,
      text: selection.text,
      explanation: explanation || undefined
    });
    await onVocabularyChanged();
  }

  return (
    <aside className="panel explain-panel">
      <div className="section-head compact">
        <div>
          <h2>Explain</h2>
          <p>{selection.pageNumber ? `Page ${selection.pageNumber}` : "No selection"}</p>
        </div>
        <Sparkles size={20} />
      </div>

      <div className="selection-box">{selection.text || "No selection"}</div>

      <div className="segmented-control">
        {(["word", "sentence", "grammar"] as ExplainMode[]).map((item) => (
          <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </div>

      <button type="button" className="primary-button wide" onClick={handleExplain} disabled={busy || !selection.text}>
        {busy ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
        <span>Explain</span>
      </button>

      {cached !== null ? (
        <div className={cached ? "cache-pill cached" : "cache-pill"}>
          {cached ? "Local cache" : "New result"}
        </div>
      ) : null}

      {message ? <div className="notice">{message}</div> : null}
      {explanation ? <div className="explanation-text">{explanation}</div> : null}

      <button type="button" className="secondary-button wide" onClick={handleSaveWord} disabled={!selection.text}>
        <NotebookTabs size={16} />
        <span>Save</span>
      </button>
    </aside>
  );
}

function VocabularyView({ entries, books }: { entries: VocabularyEntry[]; books: Book[] }) {
  const titleById = new Map(books.map((book) => [book.id, book.title]));

  return (
    <section className="panel vocabulary-panel">
      <div className="section-head">
        <div>
          <h1>Words</h1>
          <p>{entries.length} saved entries</p>
        </div>
        <NotebookTabs size={22} />
      </div>

      <div className="vocab-list">
        {entries.map((entry) => (
          <article key={entry.id} className="vocab-item">
            <div>
              <h2>{entry.text}</h2>
              <p>{entry.bookId ? titleById.get(entry.bookId) ?? "Local book" : "General"}</p>
            </div>
            {entry.explanation ? <pre>{entry.explanation}</pre> : null}
          </article>
        ))}
        {!entries.length ? (
          <div className="empty-state">
            <NotebookTabs size={24} />
            <span>No saved words</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ percent, large = false }: { percent: number; large?: boolean }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div className={large ? "progress-bar large" : "progress-bar"}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

function progressPercent(book: Book) {
  if (!book.progress?.totalPages) {
    return 0;
  }
  return Math.round((book.progress.pageNumber / book.progress.totalPages) * 100);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
