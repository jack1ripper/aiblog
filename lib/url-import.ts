import { lookup } from "node:dns/promises";
import net from "node:net";
import { generateSlug } from "./slug";

const FETCH_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; AIBlogImporter/1.0; +https://example.com/bot)";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "spm",
  "from",
  "fbclid",
  "gclid",
  "igshid",
];

export interface ImportQuality {
  score: number;
  level: "high" | "medium" | "low";
  issues: string[];
  wordCount: number;
  hasCoverImage: boolean;
}

export interface ImportedPostDraft {
  sourceUrl: string;
  sourceHost: string;
  title: string;
  slugBase: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tagNames: string[];
  quality: ImportQuality;
}

export interface ImportedPostPreview {
  sourceUrl: string;
  sourceHost: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tagNames: string[];
  quality: ImportQuality;
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "[::1]"
  );
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

function isPrivateIp(ip: string): boolean {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 4) return isPrivateIpv4(ip);
  if (ipVersion === 6) return isPrivateIpv6(ip);
  return true;
}

async function assertPublicTarget(rawUrl: string) {
  const url = new URL(rawUrl);
  const hostname = url.hostname;

  if (isLocalHostname(hostname)) {
    throw new Error("不允许抓取本机或内网地址");
  }

  const directIpVersion = net.isIP(hostname);
  if (directIpVersion) {
    if (isPrivateIp(hostname)) {
      throw new Error("不允许抓取本机或内网地址");
    }
    return;
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0) {
    throw new Error("目标域名解析失败");
  }

  if (records.some((record) => isPrivateIp(record.address))) {
    throw new Error("不允许抓取本机或内网地址");
  }
}

async function fetchImportTarget(initialUrl: string): Promise<{ html: string; sourceUrl: string }> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    await assertPublicTarget(currentUrl);

    const response = await fetch(currentUrl, {
      headers: {
        "user-agent": DEFAULT_USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("目标站点返回了无效重定向");
      }

      currentUrl = normalizeSourceUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`抓取失败（HTTP ${response.status}）`);
    }

    const html = await response.text();
    return { html, sourceUrl: currentUrl };
  }

  throw new Error("重定向次数过多，请检查目标链接");
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

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (raw, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : raw;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : raw;
    }
    return namedEntities[entity] ?? raw;
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
    return normalizeSourceUrl(new URL(normalized, baseUrl).toString());
  } catch {
    return "";
  }
}

export function normalizeSourceUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  parsed.hash = "";
  TRACKING_PARAMS.forEach((key) => parsed.searchParams.delete(key));

  const searchKeys = Array.from(parsed.searchParams.keys()).sort();
  const reordered = new URLSearchParams();
  searchKeys.forEach((key) => {
    const value = parsed.searchParams.get(key);
    if (value !== null) reordered.set(key, value);
  });
  parsed.search = reordered.toString();

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
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
      new RegExp(
        `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=([^\\s>]+)[^>]*>`,
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
  return html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_raw, preInner: string) => {
    const codeMatch = preInner.match(/<code\b([^>]*)>([\s\S]*?)<\/code>/i);
    const attrs = codeMatch?.[1] || "";
    const codeRaw = codeMatch?.[2] || preInner;
    const langMatch = attrs.match(/language-([a-zA-Z0-9_-]+)/i);
    const lang = langMatch?.[1] || "";
    const code = decodeHtmlEntities(codeRaw.replace(/<[^>]+>/g, "")).replace(/\r/g, "").trim();
    return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
  });
}

function htmlToMarkdown(html: string, baseUrl: string): string {
  let output = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe)[\s\S]*?<\/\1>/gi, " ");

  output = extractPreCodeBlocks(output);
  output = output.replace(/<br\s*\/?>/gi, "\n");

  output = output.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level: string, inner: string) => {
    const text = stripTags(inner);
    return text ? `\n\n${"#".repeat(Number(level))} ${text}\n\n` : "\n\n";
  });

  output = output.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) => {
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

  output = output.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, inner: string) => {
    const text = stripTags(inner);
    const resolved = resolveUrl(href, baseUrl);
    if (!text) return resolved || "";
    if (!resolved) return text;
    return `[${text}](${resolved})`;
  });

  output = output
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, inner: string) => `**${stripTags(inner)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _tag, inner: string) => `*${stripTags(inner)}*`);

  output = output.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner: string) => {
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

  const articleTags = [
    ...html.matchAll(/<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["'][^>]*>/gi),
  ]
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

function evaluateImportQuality(input: {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
}): ImportQuality {
  const issues: string[] = [];
  const wordCount = input.content.replace(/[#*_`\-\[\]()!>]/g, "").replace(/\s+/g, "").length;

  let score = 100;
  if (input.title.trim().length < 8) {
    score -= 12;
    issues.push("标题过短，建议手动优化标题");
  }
  if (input.excerpt.trim().length < 30) {
    score -= 10;
    issues.push("摘要偏短，建议补充摘要");
  }
  if (wordCount < 800) {
    score -= 30;
    issues.push("正文较短，可能抓取不完整");
  }
  if (wordCount < 1500) {
    score -= 10;
  }
  if (!input.coverImage) {
    score -= 8;
    issues.push("未检测到封面图");
  }
  if ((input.content.match(/\n```/g) || []).length % 2 !== 0) {
    score -= 10;
    issues.push("代码块可能不完整");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const level: ImportQuality["level"] =
    normalizedScore >= 80 ? "high" : normalizedScore >= 60 ? "medium" : "low";

  return {
    score: normalizedScore,
    level,
    issues,
    wordCount,
    hasCoverImage: Boolean(input.coverImage),
  };
}

export async function importPostFromUrl(rawUrl: string): Promise<ImportedPostDraft> {
  let sourceUrl = "";
  try {
    const url = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("仅支持 http/https 链接");
    }
    sourceUrl = normalizeSourceUrl(url.toString());
  } catch {
    throw new Error("请输入有效的博客链接");
  }

  const fetched = await fetchImportTarget(sourceUrl);
  const html = fetched.html;
  sourceUrl = fetched.sourceUrl;
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
  const quality = evaluateImportQuality({ title, excerpt, content, coverImage });

  return {
    sourceUrl,
    sourceHost,
    title,
    slugBase: generateSlug(title),
    excerpt,
    coverImage,
    content,
    tagNames: extractTagNames(html),
    quality,
  };
}
