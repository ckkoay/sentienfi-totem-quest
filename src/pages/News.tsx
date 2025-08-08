import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NewsPanel } from "@/components/NewsPanel";

const useSEO = (title: string, desc: string) => {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
  }, [title, desc]);
};

const News = () => {
  const [params] = useSearchParams();
  const archetype = params.get("archetype") || "";
  useSEO(
    archetype ? `News Summary for ${archetype} – SentienFi` : "Crypto News Scanner – SentienFi",
    "Tailored crypto news summaries and links based on your archetype."
  );

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-primary">News</h1>
        <Button asChild variant="secondary">
          <Link to="/">Back to quiz</Link>
        </Button>
      </header>
      <main className="flex-1 px-4 pb-24 max-w-md w-full mx-auto">
        {!archetype ? (
          <p className="text-sm text-muted-foreground mt-4">Add ?archetype=Catalyst to the URL or return to the quiz to get your tailored feed.</p>
        ) : (
          <NewsPanel archetype={archetype} showFilters={false} />
        )}
      </main>
    </div>
  );
};

export default News;
