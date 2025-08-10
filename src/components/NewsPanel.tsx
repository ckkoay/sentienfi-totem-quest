import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

import { fetchNews, summarizeUrl, type TimeRange, type NewsResult } from "@/services/perplexity";
import { format } from "date-fns";
const CACHE_PREFIX = "news_cache_v1:";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCache(key: string): NewsResult | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { ts: number; value: NewsResult };
    if (Date.now() - data.ts > TTL_MS) return null;
    return data.value;
  } catch {
    return null;
  }
}

function setCache(key: string, value: NewsResult) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), value }));
  } catch {}
}

export const NewsPanel: React.FC<{ archetype: string; showFilters?: boolean }> = ({ archetype, showFilters = true }) => {
  
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [topicsText, setTopicsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsResult | null>(null);
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  

  const normalizeUrl = (u: string) => {
    if (!u) return "#";
    const hasProtocol = /^https?:\/\//i.test(u);
    return hasProtocol ? u : `https://${u}`;
  };

  const safeHostname = (u: string) => {
    try {
      return new URL(normalizeUrl(u)).hostname;
    } catch {
      return "";
    }
  };

  const curatedAt = useMemo(() => format(new Date(), "HH:mm dd-MMM-yy"), []);

  const cacheKey = useMemo(() => {
    const topics = topicsText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .join("|");
    return `${archetype}:${timeRange}:${topics}`;
  }, [archetype, timeRange, topicsText]);

  const topicsArr = useMemo(
    () =>
      topicsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [topicsText]
  );

  const onScan = async () => {
    const cached = getCache(cacheKey);
    if (cached) {
      setResult(cached);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNews({ archetype, timeRange, topics: topicsArr });
      setResult(data);
      setCache(cacheKey, data);
    } catch (e: any) {
      toast({ title: "Scan failed", description: e?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const onSummarizeUrl = async () => {
    if (!url) return;
    setUrlLoading(true);
    try {
      const res = await summarizeUrl({ archetype, url });
      setResult({ summary: res.summary, articles: result?.articles ?? [] });
    } catch (e: any) {
      toast({ title: "Could not summarize URL", description: e?.message ?? "Unknown error" });
    } finally {
      setUrlLoading(false);
    }
  };

  useEffect(() => {
    // Auto-scan on mount
    if (!result) {
      onScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section aria-labelledby="news-heading" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle id="news-heading">News Summary for {archetype}</CardTitle>
          <p className="text-sm text-muted-foreground">Curated at {curatedAt}</p>
        </CardHeader>
        <CardContent className="grid gap-4">

          {showFilters && (
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-sm" htmlFor="time-range">Time range</label>
                <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                  <SelectTrigger id="time-range" className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="72h">Last 72 hours</SelectItem>
                    <SelectItem value="week">Last week</SelectItem>
                    <SelectItem value="month">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm" htmlFor="topics">Focus topics (comma separated)</label>
                <Input id="topics" className="mt-1" placeholder="BTC, ETH, AI, DePIN" value={topicsText} onChange={(e) => setTopicsText(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onScan} disabled={loading}>{loading ? "Scanning..." : "Scan news"}</Button>
          </div>

          {loading && (
            <div className="grid gap-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {result && (
            <div className="grid gap-4">
              <div className="text-sm leading-relaxed text-foreground space-y-2">
                {result.summary.split(/\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {result.articles?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Articles</h3>
                  <div className="grid gap-3">
                    {result.articles.map((a, i) => (
                      <a
                        key={i}
                        href={normalizeUrl(a.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border p-3 hover:bg-accent/50 transition-colors"
                        aria-label={`Open article: ${a.title}`}
                      >
                        <div className="font-medium line-clamp-2">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {a.source ? a.source : safeHostname(a.url)}
                          {a.publishedAt && !Number.isNaN(Date.parse(a.publishedAt)) ? ` · ${new Date(a.publishedAt).toLocaleString()}` : null}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <h3 className="font-semibold">Summarize a URL</h3>
                <div className="flex gap-2">
                  <Input placeholder="Paste an article URL" value={url} onChange={(e) => setUrl(e.target.value)} />
                  <Button onClick={onSummarizeUrl} disabled={!url || urlLoading}>{urlLoading ? "Summarizing..." : "Summarize"}</Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Information is for educational purposes and not financial advice.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </section>
  );
};
