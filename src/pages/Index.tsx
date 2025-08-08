import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// SEO
const useSEO = () => {
  useEffect(() => {
    document.title = "SentienFi Totem – Crypto Archetype Quiz";
    const descText =
      "Discover your crypto-investor archetype with a fast, fun 8‑question quiz.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", descText);
  }, []);
};

type TraitKey =
  | "risk"
  | "calm"
  | "analytical"
  | "explorative"
  | "horizon"
  | "safety";

type TraitVector = Record<TraitKey, number>;

type Option = {
  label: string;
  impact: Partial<TraitVector>;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
};

const TOTAL_QUESTIONS = 8;

const QUESTIONS: Question[] = [
  {
    id: "goal",
    text: "What’s your main goal with crypto right now?",
    options: [
      { label: "Quick gains", impact: { risk: 20, calm: -10, horizon: -15 } },
      { label: "Long‑term wealth", impact: { horizon: 25, calm: 10, risk: -5 } },
      { label: "Learn & experiment", impact: { explorative: 20, analytical: -5 } },
      { label: "Protect capital", impact: { safety: 25, risk: -20, calm: 10 } },
    ],
  },
  {
    id: "dip",
    text: "Your portfolio drops 20% in a week. You…",
    options: [
      { label: "Buy more (discount!)", impact: { risk: 20, calm: 10 } },
      { label: "Hold steady", impact: { calm: 20, risk: -5 } },
      { label: "Rebalance slowly", impact: { analytical: 15, calm: 10 } },
      { label: "Panic sell", impact: { calm: -25, safety: 10, risk: -15 } },
    ],
  },
  {
    id: "horizon",
    text: "How long do you plan to keep most positions?",
    options: [
      { label: "Weeks", impact: { horizon: -20, risk: 10 } },
      { label: "Months", impact: { horizon: 5 } },
      { label: "Years", impact: { horizon: 25, calm: 10 } },
      { label: "Not sure", impact: { explorative: 5 } },
    ],
  },
  {
    id: "decisions",
    text: "How do you usually decide on a trade?",
    options: [
      { label: "Run the numbers", impact: { analytical: 25, calm: 5 } },
      { label: "Gut feel", impact: { analytical: -10, explorative: 10, risk: 10 } },
      { label: "Ask the community", impact: { explorative: 10 } },
      { label: "Move fast, adjust later", impact: { risk: 15, calm: -10 } },
    ],
  },
  {
    id: "learning",
    text: "Best way you learn?",
    options: [
      { label: "Step‑by‑step guides", impact: { analytical: 10, calm: 5 } },
      { label: "Tinker with small amounts", impact: { explorative: 20 } },
      { label: "Context from news/threads", impact: { explorative: 10 } },
      { label: "Set‑and‑forget", impact: { calm: 10, horizon: 10 } },
    ],
  },
  {
    id: "frequency",
    text: "How often do you trade?",
    options: [
      { label: "Many times a week", impact: { risk: 15, calm: -5 } },
      { label: "A few times a month", impact: { calm: 5 } },
      { label: "Rarely", impact: { horizon: 10, calm: 10 } },
      { label: "When something’s trending", impact: { risk: 10, calm: -10 } },
    ],
  },
  {
    id: "sizing",
    text: "Position sizing you’re most comfortable with?",
    options: [
      { label: "Small test → scale up", impact: { analytical: 10, explorative: 10 } },
      { label: "Go big on conviction", impact: { risk: 20 } },
      { label: "Fixed small amounts regularly", impact: { calm: 10, horizon: 10 } },
      { label: "Only tiny amounts", impact: { safety: 20, risk: -10 } },
    ],
  },
  {
    id: "resonate",
    text: "Pick the one that resonates most:",
    options: [
      { label: "Stability > big wins", impact: { safety: 20, risk: -15, calm: 10 } },
      { label: "Love bold moves", impact: { risk: 25, calm: -10 } },
      { label: "Curious early‑adopter", impact: { explorative: 20, risk: 10 } },
      { label: "Patient systems builder", impact: { analytical: 20, horizon: 15, calm: 10 } },
    ],
  },
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

const initialTraits: TraitVector = {
  risk: 50,
  calm: 50,
  analytical: 50,
  explorative: 50,
  horizon: 50,
  safety: 50,
};

const ARCHETYPES: Record<
  string,
  { ideal: TraitVector; blurb: string; strengths: string[]; watch: string[]; suggestions: string[] }
> = {
  Catalyst: {
    ideal: { risk: 80, calm: 45, analytical: 45, explorative: 60, horizon: 50, safety: 30 },
    blurb:
      "Ambitious, bold, and action‑oriented — you like moving fast when the reward looks right.",
    strengths: [
      "Spots momentum early",
      "Acts decisively",
      "Comfortable taking calculated risks",
    ],
    watch: [
      "Avoid over‑trading",
      "Set clear risk limits",
      "Don’t let FOMO drive entries",
    ],
    suggestions: [
      "People with this sort of archetype generally like momentum coins, strong narratives, and trend plays.",
      "Consider a core spot position with a small satellite for swing trades; use stop‑losses.",
      "Options or perps in small size can work once rules are defined.",
    ],
  },
  Builder: {
    ideal: { risk: 45, calm: 80, analytical: 80, explorative: 40, horizon: 80, safety: 60 },
    blurb:
      "Disciplined and forward‑thinking — you favor strategies, systems, and steady progress.",
    strengths: ["Great planner", "Risk aware", "Consistent compounding mindset"],
    watch: ["Don’t miss asymmetric opportunities", "Review bias toward over‑caution"],
    suggestions: [
      "People with this sort of archetype generally prefer blue‑chip crypto, L2 infrastructure, and index‑like baskets.",
      "DCA into spot, stake where possible, and rebalance by rules.",
      "Light covered‑call strategies may suit advanced users.",
    ],
  },
  Explorer: {
    ideal: { risk: 60, calm: 55, analytical: 50, explorative: 85, horizon: 55, safety: 40 },
    blurb:
      "Curious and independent — you learn best by trying, tinkering, and seeing what happens.",
    strengths: ["Finds emerging tech early", "Learns fast by doing"],
    watch: ["Beware shiny‑object syndrome", "Diversify experiments"],
    suggestions: [
      "People with this sort of archetype generally like new ecosystems, testnets/airdrops, and early‑stage projects.",
      "Keep experiments small and documented; use a sandbox wallet.",
      "Spot and staking are primary; use perps only for hedging in tiny size.",
    ],
  },
  Guardian: {
    ideal: { risk: 25, calm: 80, analytical: 70, explorative: 30, horizon: 70, safety: 85 },
    blurb:
      "You care about protecting what you have. You plan ahead and prefer stability over chaos.",
    strengths: ["Capital preservation", "Clear risk controls"],
    watch: ["Inflation/drag from staying too defensive", "Missing cycles"],
    suggestions: [
      "People with this sort of archetype generally focus on BTC/ETH spot, stables, and high‑quality yield.",
      "Use cold storage and multi‑sig where possible.",
      "Avoid leverage; rebalance quarterly.",
    ],
  },
  Dreamer: {
    ideal: { risk: 55, calm: 45, analytical: 45, explorative: 60, horizon: 70, safety: 45 },
    blurb:
      "Driven by big goals — freedom, purpose, and hope. You learn as you go and think long‑term.",
    strengths: ["Vision‑driven", "Stays through cycles"],
    watch: ["Confirmation bias", "Emotional entries"],
    suggestions: [
      "People with this sort of archetype generally like thematic baskets (AI, DePIN, SocialFi).",
      "Prefer spot with DCA and staking; write theses and review quarterly.",
      "Use alerts instead of checking charts constantly.",
    ],
  },
  Gambler: {
    ideal: { risk: 90, calm: 30, analytical: 30, explorative: 65, horizon: 35, safety: 15 },
    blurb:
      "Drawn to high‑risk, high‑thrill moves and big swings. Fun — but manage it carefully.",
    strengths: ["Bold conviction", "Comfort with volatility"],
    watch: ["Blow‑up risk", "Emotional trading"],
    suggestions: [
      "People with this sort of archetype generally chase momentum and micro‑caps — keep sizes tiny.",
      "Set hard daily loss limits and cool‑off rules.",
      "Prefer spot for riskier coins; avoid heavy leverage.",
    ],
  },
};

function closestArchetype(traits: TraitVector) {
  // cosine‑like similarity using simple inverse distance
  const scoreEntries = Object.entries(ARCHETYPES).map(([name, { ideal }]) => {
    const dist = (Object.keys(ideal) as TraitKey[]).reduce((acc, k) => {
      return acc + Math.abs(ideal[k] - traits[k]);
    }, 0);
    return [name, 1 / (1 + dist)] as const;
  });
  scoreEntries.sort((a, b) => b[1] - a[1]);
  return scoreEntries[0]![0] as keyof typeof ARCHETYPES;
}

const playHooray = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = now + i * 0.05;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.2, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.start(t0);
      o.stop(t0 + 0.45);
    });
  } catch {}
};

const Index = () => {
  useSEO();
  const [step, setStep] = useState(0);
  const [traits, setTraits] = useState<TraitVector>(initialTraits);
  const [finished, setFinished] = useState(false);

  const percent = (step / TOTAL_QUESTIONS) * 100;

  const radarData = useMemo(
    () =>
      (Object.keys(traits) as TraitKey[]).map((k) => ({
        trait: k,
        score: traits[k],
      })),
    [traits]
  );

  const onSelect = (opt: Option) => {
    const next = { ...traits };
    Object.entries(opt.impact).forEach(([k, v]) => {
      const key = k as TraitKey;
      next[key] = clamp((next[key] ?? 50) + (v as number));
    });
    setTraits(next);

    if (step + 1 >= TOTAL_QUESTIONS) {
      setFinished(true);
      // Confetti & sound
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (!m.matches) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
      playHooray();
    } else {
      setStep(step + 1);
    }
  };

  const currentQ = QUESTIONS[step];

  const archetype = finished ? closestArchetype(traits) : null;

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col">
      <header className="px-4 pt-6 pb-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
          <img
            src="/lovable-uploads/6bf1d443-4b7b-4bdb-87ad-38e244fa032a.png"
            alt="SentienFi Totem logo - crypto archetype quiz"
            className="h-7 w-7"
            loading="lazy"
            decoding="async"
          />
          <span>SentienFi Totem</span>
        </h1>
        <p className="text-sm text-muted-foreground">Find your crypto‑investor archetype in 8 quick taps.</p>
      </header>

      <main className="flex-1 px-4 pb-24 max-w-md w-full mx-auto">
        {!finished ? (
          <Card className="mt-4 animate-enter">
            <CardHeader>
              <CardTitle className="text-base">{currentQ.text}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {currentQ.options.map((opt, idx) => (
                <Button key={idx} className="w-full hover-scale" onClick={() => onSelect(opt)}>
                  {opt.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4 animate-enter">
            <CardHeader>
              <CardTitle className="text-xl">
                You are... {archetype}!
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">{archetype && ARCHETYPES[archetype].blurb}</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius={90}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {archetype && (
                <div className="space-y-3 text-sm">
                  <div>
                    <h3 className="font-semibold">Strengths</h3>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {ARCHETYPES[archetype].strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">Be mindful of</h3>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {ARCHETYPES[archetype].watch.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">What to consider</h3>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {ARCHETYPES[archetype].suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => {
                  setStep(0);
                  setTraits(initialTraits);
                  setFinished(false);
                }}>Take it again</Button>
                <a className="story-link text-primary" href="#top">Share your result</a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Progress */}
      {!finished && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur px-4 py-3 border-t">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>
                Question {step + 1} of {TOTAL_QUESTIONS}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
