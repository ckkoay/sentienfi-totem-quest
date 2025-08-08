import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type ArchetypeGuideProps = {
  archetype: string;
};

const RECS: Record<string, { strategies: string[]; resources: { label: string; href: string }[] }> = {
  Catalyst: {
    strategies: [
      "Ride trends: buy strength, use clear stop‑loss and trailing stops.",
      "Keep sizes modest; add only when a move proves itself.",
      "Plan exits before entries (targets + invalidation).",
      "Use a cool‑off rule after losses to avoid tilt trading.",
    ],
    resources: [
      { label: "CoinDesk Learn – Trading Basics", href: "https://www.coindesk.com/learn/" },
      { label: "Investopedia – Technical Analysis", href: "https://www.investopedia.com/technical-analysis-4689657" },
      { label: "Binance Academy – Trading Guides", href: "https://www.binance.com/en/learn" },
    ],
  },
  Builder: {
    strategies: [
      "DCA into quality (e.g., BTC/ETH + top projects).",
      "Rebalance by rules (e.g., quarterly or on 5–10% drift).",
      "Stake where reliable; prefer audited, battle‑tested options.",
      "Keep a stablecoin buffer for life needs and buying dips.",
    ],
    resources: [
      { label: "Coinbase Learn – Dollar‑Cost Averaging", href: "https://www.coinbase.com/learn/crypto-basics/what-is-dollar-cost-averaging" },
      { label: "Investopedia – Portfolio Rebalancing", href: "https://www.investopedia.com/terms/r/rebalancing.asp" },
      { label: "CoinDesk Learn – Crypto Basics", href: "https://www.coindesk.com/learn/" },
    ],
  },
  Explorer: {
    strategies: [
      "Set a small monthly ‘experiment budget’ you can afford to lose.",
      "Use a separate sandbox wallet for early projects/testnets.",
      "Document what you try and the lessons learned.",
      "Diversify experiments across ecosystems and narratives.",
    ],
    resources: [
      { label: "Binance Academy – Blockchain Basics", href: "https://www.binance.com/en/learn" },
      { label: "Ethereum.org – Learn", href: "https://ethereum.org/en/learn/" },
      { label: "Airdrops – Discovery Hub", href: "https://airdrops.io/" },
    ],
  },
  Guardian: {
    strategies: [
      "Focus on BTC/ETH spot, stables, and high‑quality yield.",
      "Prefer hardware wallets and strong security practices.",
      "Avoid leverage; size positions to sleep well at night.",
      "Review allocations a few times per year, not daily.",
    ],
    resources: [
      { label: "Bitcoin.org – Choose Your Wallet", href: "https://bitcoin.org/en/choose-your-wallet" },
      { label: "Ethereum.org – Find a Wallet", href: "https://ethereum.org/en/wallets/find-wallet/" },
      { label: "Investopedia – Risk Management", href: "https://www.investopedia.com/risk-management-4689735" },
    ],
  },
  Dreamer: {
    strategies: [
      "Build simple thematic baskets (AI, DePIN, L2s, etc.).",
      "Write a short thesis; review quarterly and prune weak ideas.",
      "Use DCA + alerts instead of constant chart‑watching.",
      "Keep a core long‑term spot stack; avoid over‑trading.",
    ],
    resources: [
      { label: "CoinGecko Learn – Guides & Walkthroughs", href: "https://www.coingecko.com/learn" },
      { label: "CoinDesk Learn – Investing", href: "https://www.coindesk.com/learn/" },
      { label: "Investopedia – Portfolio Strategies", href: "https://www.investopedia.com/investing-4427685" },
    ],
  },
  Gambler: {
    strategies: [
      "Use tiny sizes for high‑volatility bets (think lottery tickets).",
      "Set hard daily loss limits and stick to them.",
"Take profits in steps; avoid ‘round‑trip’ wins.",
"Favor spot over leverage for riskier coins.",
    ],
    resources: [
      { label: "Investopedia – Risk Management", href: "https://www.investopedia.com/risk-management-4689735" },
      { label: "CoinDesk Learn – Trading Psychology", href: "https://www.coindesk.com/learn/" },
      { label: "Binance Academy – Trading Guides", href: "https://www.binance.com/en/learn" },
    ],
  },
};

export function ArchetypeGuide({ archetype }: ArchetypeGuideProps) {
  const rec = RECS[archetype];
  if (!rec) return null;

  return (
    <section aria-labelledby="strategy-heading" className="rounded-lg border p-4 bg-card">
      <h2 id="strategy-heading" className="text-base font-semibold text-foreground">
        Personalized strategies & resources
      </h2>
      <p className="text-sm text-muted-foreground">
        Based on your archetype, here’s a simple starting point.
      </p>

      <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value="strategies">
          <AccordionTrigger className="text-left">Trading strategies for {archetype}</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-muted-foreground">
              {rec.strategies.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="resources">
          <AccordionTrigger className="text-left">Helpful resources</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-muted-foreground">
              {rec.resources.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline underline-offset-4 text-primary"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-3 text-xs text-muted-foreground">
        Not financial advice. Do your own research and consider your risk tolerance.
      </p>
    </section>
  );
}
