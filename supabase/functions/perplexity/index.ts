// Supabase Edge Function: Perplexity proxy
// Reads PERPLEXITY_API_KEY from Supabase Secrets and forwards chat/completions requests.
// Endpoint: /functions/v1/perplexity

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "*",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY secret" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Forward the request body to Perplexity's Chat Completions endpoint
  const upstream = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  return new Response(text, {
    status: upstream.status,
    headers: { ...corsHeaders, "Content-Type": contentType },
  });
});
