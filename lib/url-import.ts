import { generateSlug } from "./slug";

const FETCH_TIMEOUT_MS = 15000;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; AIBlogImporter/1.0; +https://example.com/bot)";

export interface ImportedPostDraft {
  sourceUrl: string;
  sourceHost: string;
  title: string;
  slugBase: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tagNames: string[];
}

function decodeHtmlEntities(input: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    mdash: "-",
    ndash: "-",
    hellip: "...",
  };

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    return namedEntities[entity] ?? _;
  });
}

function collapseWhitespace(input: string): string {
  return input.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function resolveUrl(raw: string | undefined, baseUrl: string): string {
  if (!raw) return "";
  const normalized = raw.trim();
  if (!normalized) return "";
  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return "";
  }
}

function extractMeta(html: string, keys: string[]): string {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`,
        "i"
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return decodeHtmlEntities(match[1]).trim();
      }
    }
  }
  return "";
}

function extractTitle(html: string): string {
  const ogTitle = extractMeta(html, ["og:title", "twitter:title"]);
  if (ogTitle) return ogTitle;

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const h1 = stripTags(h1Match[1]);
    if (h1) return h1;
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const title = decodeHtmlEntities(titleMatch[1]).replace(/\s*[-|–—].*$/, "").trim();
    if (title) return title;
  }

  return "未命名文章";
}

function pickLargestBlock(candidates: string[]): string {
  let best = "";
  let bestLen = 0;

  for (const candidate of candidates) {
    const textLen = stripTags(candidate).length;
    if (textLen > bestLen) {
      bestLen = textLen;
      best = candidate;
    }
  }

  return best;
}

function extractMainHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch?.[1] || html;

  const articleMatches = [...body.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => m[0]);
  const mainMatches = [...body.matchAll(/<main\b[\s\S]*?<\/main>/gi)].map((m) => m[0]);
  const contentClassMatches = [
    ...body.matchAll(
      /<(section|div)\b[^>]*(?:id|class)=["'][^"']*(content|article|post|entry|markdown|prose|main-body)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi
    ),
  ].map((m) => m[0]);

  const candidate = pickLargestBlock([...articleMatches, ...mainMatches, ...contentClassMatches]);
  if (candidate && stripTags(candidate).length >= 280) {
    return candidate;
  }

  return body;
}

function extractPreCodeBlocks(html: string): string {
  return html.replace(
    /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, preInner: string) => {
      const codeMatch = preInner.match(/<code\b([^>]*)>([\s\S]*?)<\/code>/i);
      const attrs = codeMatch?.[1] || "";
      const codeRaw = codeMatch?.[2] || preInner;
      const langMatch = attrs.match(/language-([a-zA-Z0-9_-]+)/i);
      const lang = langMatch?.[1] || "";
      const code = decodeHtmlEntities(codeRaw.replace(/<[^>]+>/g, "")).replace(/\r/g, "").trim();
      return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
  );
}

function htmlToMarkdown(html: string, baseUrl: string): string {
  let output = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe)[\s\S]*?<\/\1>/gi, " ");

  output = extractPreCodeBlocks(output);

  output = output.replace(/<br\s*\/?>/gi, "\n");

  output = output.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, inner: string) => {
    const text = stripTags(inner);
    return text ? `\n\n${"#".repeat(Number(level))} ${text}\n\n` : "\n\n";
  });

  output = output.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner: string) => {
    const lines = stripTags(inner)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `> ${line}`)
      .join("\n");
    return lines ? `\n\n${lines}\n\n` : "\n\n";
  });

  output = output.replace(/<img\b[^>]*>/gi, (imgTag: string) => {
    const src = imgTag.match(/src=["']([^"']+)["']/i)?.[1];
    const alt = decodeHtmlEntities(imgTag.match(/alt=["']([^"']*)["']/i)?.[1] || "").trim();
    const resolved = resolveUrl(src, baseUrl);
    if (!resolved) return "";
    return `\n\n![${alt}](${resolved})\n\n`;
  });

  output = output.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, inner: string) => {
    const text = stripTags(inner);
    const resolved = resolveUrl(href, baseUrl);
    if (!text) return resolved || "";
    if (!resolved) return text;
    return `[${text}](${resolved})`;
  });

  output = output
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m: string, _tag: string, inner: string) => `**${stripTags(inner)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m: string, _tag: string, inner: string) => `*${stripTags(inner)}*`);

  output = output.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner: string) => {
    const text = stripTags(inner);
    return text ? `\n- ${text}` : "";
  });

  output = output.replace(/<\/(p|div|section|article|ul|ol|figure|table|tr|td|th)>/gi, "\n\n");

  output = decodeHtmlEntities(output.replace(/<[^>]+>/g, " "));

  output = output
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\s*-\s+/g, "\n- ");

  return collapseWhitespace(output);
}

function extractTagNames(html: string): string[] {
  const keywords = extractMeta(html, ["keywords"])
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const articleTags = [...html.matchAll(/<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
    .map((m) => decodeHtmlEntities(m[1]).trim())
    .filter(Boolean);

  return Array.from(new Set([...keywords, ...articleTags])).slice(0, 8);
}

function extractExcerpt(html: string): string {
  const metaExcerpt = extractMeta(html, ["description", "og:description", "twitter:description"]);
  if (metaExcerpt) return metaExcerpt.slice(0, 220);

  const main = stripTags(extractMainHtml(html));
  if (!main) return "";
  return main.slice(0, 220);
}

export async function importPostFromUrl(rawUrl: string): Promise<ImportedPostDraft> {
  let sourceUrl = "";
  try {
    const url = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("仅支持 http/https 链接");
    }
    sourceUrl = url.toString();
  } catch {
    throw new Error("请输入有效的博客链接");
  }

  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": DEFAULT_USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`抓取失败（HTTP ${response.status}）`);
  }

  const html = await response.text();
  if (!html || !/<html/i.test(html)) {
    throw new Error("目标页面不是可解析的 HTML");
  }

  const mainHtml = extractMainHtml(html);
  const content = htmlToMarkdown(mainHtml, sourceUrl);

  if (content.length < 180) {
    throw new Error("未能识别有效正文，请尝试手动导入");
  }

  const parsedUrl = new URL(sourceUrl);
  const title = extractTitle(html);
  const excerpt = extractExcerpt(html);
  const coverImage = resolveUrl(extractMeta(html, ["og:image", "twitter:image"]), sourceUrl);
  const sourceHost = parsedUrl.hostname.replace(/^www\./, "");

  return {
    sourceUrl,
    sourceHost,
    title,
    slugBase: generateSlug(title),
    excerpt,
    coverImage,
    content,
    tagNames: extractTagNames(html),
  };
}
