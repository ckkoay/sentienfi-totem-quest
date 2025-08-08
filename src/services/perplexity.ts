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

const API_URL = "https://api.perplexity.ai/chat/completions";
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
  const trimmed = content.trim();
  const fence = /```\s*json([\s\S]*?)```/i;
  const m = trimmed.match(fence);
  const raw = m ? m[1] : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    // try to find first { ... }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const maybe = raw.slice(start, end + 1);
      try {
        return JSON.parse(maybe);
      } catch {}
    }
    throw new Error("Failed to parse JSON from model response");
  }
}

export async function fetchNews(params: {
  archetype: string;
  timeRange: TimeRange;
  topics: string[];
  apiKey?: string;
}): Promise<NewsResult> {
  const apiKey = params.apiKey ?? getPerplexityApiKey();
  if (!apiKey) throw new Error("Missing Perplexity API key");

  const topicsLine = params.topics.length ? `Focus on these topics when relevant: ${params.topics.join(", ")}.` : "";

  const body = {
    model: "sonar-small-online",
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
          "You are a precise crypto news analyst. Only return strict JSON with keys: summary (string), articles (array of {title, url, source, publishedAt}). No markdown, no commentary outside JSON.",
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
      Authorization: `Bearer ${apiKey}`,
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
    const parsed = extractJson(content) as NewsResult;
    return {
      summary: parsed.summary ?? "",
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
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
  const apiKey = params.apiKey ?? getPerplexityApiKey();
  if (!apiKey) throw new Error("Missing Perplexity API key");

  const body = {
    model: "sonar-small-online",
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
      Authorization: `Bearer ${apiKey}`,
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
