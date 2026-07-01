import type {
  Book,
  ExplainMode,
  ExplainResponse,
  ProgressSummary,
  ReadingProgress,
  VocabularyEntry
} from "@english-study-shelf/shared";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const details = (await response.json().catch(() => null)) as { error?: unknown } | null;
    const message =
      typeof details?.error === "string" ? details.error : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function listBooks() {
  return request<Book[]>("/api/books");
}

export function uploadBook(file: File, title: string) {
  const body = new FormData();
  body.append("pdf", file);
  body.append("title", title);
  return request<Book>("/api/books/upload", {
    method: "POST",
    body
  });
}

export function pdfUrl(bookId: string) {
  return `${API_BASE}/api/books/${bookId}/file`;
}

export function saveProgress(bookId: string, pageNumber: number, totalPages: number) {
  return request<ReadingProgress>(`/api/books/${bookId}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageNumber, totalPages })
  });
}

export function progressSummary() {
  return request<ProgressSummary>("/api/progress/summary");
}

export function listVocabulary() {
  return request<VocabularyEntry[]>("/api/vocabulary");
}

export function addVocabulary(input: {
  bookId?: string;
  text: string;
  explanation?: string;
  note?: string;
}) {
  return request<VocabularyEntry>("/api/vocabulary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function explainSelection(input: {
  bookId?: string;
  selection: string;
  pageNumber?: number;
  mode: ExplainMode;
}) {
  return request<ExplainResponse>("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

