export type TimeRange = "24h" | "72h" | "week" | "month";

export interface ArticleItem {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string; // ISO
}

export interface NewsResult {
  summary: string;
  articles: ArticleItem[];
  raw?: string;
}

const API_URL = "https://llisxehwxhrqdqxhwbbb.functions.supabase.co/perplexity";
const LS_KEY = "perplexity_api_key";

export const getPerplexityApiKey = (): string | null => {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
};

export const setPerplexityApiKey = (key: string) => {
  try {
    if (key) localStorage.setItem(LS_KEY, key);
  } catch {}
};

export const clearPerplexityApiKey = () => {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
};

const mapRecency = (range: TimeRange): "day" | "week" | "month" => {
  switch (range) {
    case "24h":
      return "day";
    case "72h":
      return "week"; // closest available
    case "week":
      return "week";
    case "month":
    default:
      return "month";
  }
};

function extractJson(content: string): any {
  // Sanitize common model quirks first
  const sanitize = (s: string) =>
    s
      // replace smart quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // remove zero-width / non-breaking spaces
      .replace(/[\u200B\u00A0]/g, ' ')
      // remove trailing commas before closing braces/brackets
      .replace(/,(\s*[}\]])/g, '$1');

  let trimmed = sanitize(content.trim());

  // 1) If it's already a bare JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }

  // 2) Any fenced code block (with or without a language tag)
  const anyFence = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/m;
  const fm = trimmed.match(anyFence);
  let rawFromFence = fm ? sanitize(fm[1]) : trimmed;

  // 3) Try direct JSON parse
  try {
    return JSON.parse(rawFromFence);
  } catch {}

  // 4) Extract the first outer object by braces
  const start = rawFromFence.indexOf('{');
  const end = rawFromFence.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const slice = sanitize(rawFromFence.slice(start, end + 1));
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // 5) Heuristic: repair common JSON5-like output (single quotes, unquoted keys)
  try {
    let repaired = rawFromFence
      // Quote unquoted keys
      .replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
      // Replace single quotes with double quotes for values
      .replace(/'([^']*)'/g, '"$1"');

    const s2 = repaired.indexOf('{');
    const e2 = repaired.lastIndexOf('}');
    if (s2 !== -1 && e2 !== -1 && e2 > s2) {
      repaired = repaired.slice(s2, e2 + 1);
    }
    repaired = sanitize(repaired);
    return JSON.parse(repaired);
  } catch {}

  throw new Error('Failed to parse JSON from model response');
}

export async function fetchNews(params: {
  archetype: string;
  timeRange: TimeRange;
  topics: string[];
  apiKey?: string;
}): Promise<NewsResult> {
  const topicsLine = params.topics.length ? `Focus on these topics when relevant: ${params.topics.join(", ")}.` : "";

  const body = {
    model: "sonar-pro",
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 1200,
    return_images: false,
    return_related_questions: false,
    search_recency_filter: mapRecency(params.timeRange),
    frequency_penalty: 1,
    presence_penalty: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a precise crypto news analyst. Return a single strict JSON object with keys: summary (string), articles (array of {title, url, source, publishedAt}). Do NOT use code fences. No markdown or commentary.",
      },
      {
        role: "user",
        content:
          `Scan the web for the most important cryptocurrency and blockchain headlines from the last ${params.timeRange}. ${topicsLine} Tailor the summary for the ${params.archetype} archetype — emphasize what they care about. Output concise, neutral language. Include 6–10 diverse, credible sources with canonical URLs and ISO dates. Return JSON only.`,
      },
    ],
  } as const;

  const res = await fetch(API_URL, {
    method: "POST",
  headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Perplexity error: ${res.status} ${t}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = extractJson(content) as any;
    const articles = Array.isArray(parsed?.articles)
      ? parsed.articles
          .filter((a: any) => a && typeof a.title === "string" && typeof a.url === "string")
          .map((a: any) => ({
            title: String(a.title).trim(),
            url: String(a.url).trim(),
            source: a.source ? String(a.source).trim() : undefined,
            publishedAt:
              typeof a.publishedAt === "string" && !Number.isNaN(Date.parse(a.publishedAt))
                ? a.publishedAt
                : undefined,
          }))
      : [];
    return {
      summary: parsed?.summary ?? "",
      articles,
      raw: content,
    };
  } catch {
    return { summary: content || "No summary returned.", articles: [], raw: content };
  }
}

export async function summarizeUrl(params: {
  archetype: string;
  url: string;
  apiKey?: string;
}): Promise<{ summary: string; raw?: string }> {
  const body = {
    model: "sonar-pro",
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 900,
    return_images: false,
    return_related_questions: false,
    search_recency_filter: "month",
    frequency_penalty: 1,
    presence_penalty: 0,
    messages: [
      {
        role: "system",
        content:
          "Summarize for a crypto investor. Return strict JSON with keys: summary (string), key_points (string[]). No text outside JSON.",
      },
      {
        role: "user",
        content: `Read and summarize this URL for the ${params.archetype} archetype: ${params.url}. Return JSON only.`,
      },
    ],
  } as const;

  const res = await fetch(API_URL, {
    method: "POST",
  headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Perplexity error: ${res.status} ${t}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = extractJson(content) as { summary: string; key_points?: string[] };
    const text = parsed.summary + (parsed.key_points?.length ? "\n\n• " + parsed.key_points.join("\n• ") : "");
    return { summary: text, raw: content };
  } catch {
    return { summary: content || "No summary returned.", raw: content };
  }
}
