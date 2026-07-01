export type Book = {
  id: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  progress?: ReadingProgress | null;
};

export type ReadingProgress = {
  bookId: string;
  pageNumber: number;
  totalPages: number;
  updatedAt: string;
};

export type VocabularyEntry = {
  id: string;
  bookId: string | null;
  text: string;
  note: string | null;
  explanation: string | null;
  createdAt: string;
};

export type ExplainMode = "word" | "sentence" | "grammar";

export type ExplainRequest = {
  bookId?: string;
  selection: string;
  pageNumber?: number;
  mode: ExplainMode;
};

export type ExplainResponse = {
  explanation: string;
  cached: boolean;
  cacheKey: string;
};

export type ProgressSummary = {
  totalBooks: number;
  startedBooks: number;
  completedBooks: number;
  averagePercent: number;
};

