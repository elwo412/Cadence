import { ParsedTask, Priority } from "../types/composer";

const TAG_RE = /(^|\s)#([\w\-/]+)/g;
const EST_RE = /~(\d+)m\b/i;
const PRI_RE = /!p?([123])\b/i;
const MULT_RE = /x(\d+)\b/i;

interface InternalParsedTask extends ParsedTask {
  count?: number;
}

export function parseLine(s: string): InternalParsedTask | null {
  let title = s.trim();
  if (!title) return null;

  // tags
  const tags: string[] = [];
  title = title.replace(TAG_RE, (_m, _sp, tag) => {
    tags.push(tag.toLowerCase());
    return "";
  });

  // estimate
  let est: number | undefined;
  title = title.replace(EST_RE, (_m, n) => {
    est = Math.max(5, Number(n));
    return "";
  });

  // priority
  let priority: Priority | undefined;
  title = title.replace(PRI_RE, (_m, p) => {
    priority = Number(p) as Priority;
    return "";
  });

  // multiplicity
  let count = 1;
  title = title.replace(MULT_RE, (_m, n) => {
    count = Math.min(10, Math.max(1, Number(n)));
    return "";
  });

  title = title.replace(/\s{2,}/g, " ").trim();
  return { title, est, tags, priority, count };
}

export function parseLines(s: string): InternalParsedTask[] {
  return s
    .split(/\n|[;]+/)
    .map(parseLine)
    .filter(Boolean) as InternalParsedTask[];
}
