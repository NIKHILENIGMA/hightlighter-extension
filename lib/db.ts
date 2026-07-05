import fs from 'fs';
import path from 'path';

export interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string;
  timestamp: string;
  summary?: string;
}

const dbPath = path.join(process.cwd(), 'data', 'highlights.json');

function initDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
}

export function getHighlights(): Highlight[] {
  initDb();
  const data = fs.readFileSync(dbPath, 'utf8');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveHighlight(highlight: Highlight): void {
  initDb();
  const highlights = getHighlights();
  const exists = highlights.some(hl => hl.text === highlight.text && hl.url === highlight.url);
  if (!exists) {
    highlights.push(highlight);
    fs.writeFileSync(dbPath, JSON.stringify(highlights, null, 2));
  }
}

export function updateHighlight(id: string, updated: Partial<Highlight>): boolean {
  initDb();
  const highlights = getHighlights();
  const index = highlights.findIndex(hl => hl.id === id);
  if (index !== -1) {
    highlights[index] = { ...highlights[index], ...updated };
    fs.writeFileSync(dbPath, JSON.stringify(highlights, null, 2));
    return true;
  }
  return false;
}

export function deleteHighlight(id: string): boolean {
  initDb();
  const highlights = getHighlights();
  const initialLength = highlights.length;
  const filtered = highlights.filter(hl => hl.id !== id);
  if (filtered.length !== initialLength) {
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
    return true;
  }
  return false;
}

export function clearAllHighlights(): void {
  initDb();
  fs.writeFileSync(dbPath, JSON.stringify([]));
}
