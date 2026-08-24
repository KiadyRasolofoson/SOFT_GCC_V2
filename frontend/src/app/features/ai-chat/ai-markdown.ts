export type AiInlinePart = { text: string; bold: boolean };

export type AiMarkdownBlock =
  | { type: 'h2' | 'h3' | 'p'; parts: AiInlinePart[] }
  | { type: 'ul' | 'ol'; items: AiInlinePart[][] };

export function parseInline(text: string): AiInlinePart[] {
  const parts: AiInlinePart[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), bold: false });
  }
  return parts.length ? parts : [{ text: '', bold: false }];
}

const UL_ITEM = /^[-*+]\s+/;
const OL_ITEM = /^\d+[.)]\s+/;

function stripToolMarkup(source: string): string {
  if (!source) return '';
  return source
    .replace(/<[^>]*DSML[^>]*tool_calls[^>]*>[\s\S]*?<\/[^>]*DSML[^>]*tool_calls[^>]*>/gi, '')
    .replace(/<tool_calls>[\s\S]*?<\/tool_calls>/gi, '')
    .replace(/<[^>]*DSML[^>]*>/gi, '')
    .replace(/<\|?｜tool[\s▁][^>]*>/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function nextNonEmpty(lines: string[], from: number): string {
  for (let i = from; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (t) return t;
  }
  return '';
}

function consumeList(
  lines: string[],
  start: number,
  itemRe: RegExp,
): { items: AiInlinePart[][]; next: number } {
  const items: AiInlinePart[][] = [];
  let i = start;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (!itemRe.test(nextNonEmpty(lines, i + 1))) break;
      i += 1;
      continue;
    }
    if (!itemRe.test(trimmed)) break;
    items.push(parseInline(trimmed.replace(itemRe, '')));
    i += 1;
  }

  return { items, next: i };
}

export function parseMarkdown(source: string): AiMarkdownBlock[] {
  const lines = stripToolMarkup(source).replace(/\r\n/g, '\n').split('\n');
  const blocks: AiMarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', parts: parseInline(trimmed.slice(4)) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', parts: parseInline(trimmed.slice(3)) });
      i += 1;
      continue;
    }

    if (UL_ITEM.test(trimmed)) {
      const { items, next } = consumeList(lines, i, UL_ITEM);
      blocks.push({ type: 'ul', items });
      i = next;
      continue;
    }

    if (OL_ITEM.test(trimmed)) {
      const { items, next } = consumeList(lines, i, OL_ITEM);
      blocks.push({ type: 'ol', items });
      i = next;
      continue;
    }

    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || next.startsWith('##') || UL_ITEM.test(next) || OL_ITEM.test(next)) {
        break;
      }
      para.push(next);
      i += 1;
    }
    blocks.push({ type: 'p', parts: parseInline(para.join(' ')) });
  }

  return blocks;
}
