import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(here, "../../..");
export const dataDir = join(projectRoot, "data");
export const booksDir = join(dataDir, "books");
export const databasePath = join(dataDir, "english-study-shelf.sqlite");

export function ensureRuntimeDirs() {
  mkdirSync(booksDir, { recursive: true });
}

