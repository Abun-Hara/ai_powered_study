import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SummarizeRequest {
  fileName: string;
  extractedText: string;
  actionType?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const AI_DAILY_DEFAULT_LIMIT = Number(Deno.env.get("AI_DAILY_DEFAULT_LIMIT") ?? "50000");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  throw new Error("Missing required Edge Function environment variables.");
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    const { data: userRow, error: userError } = await adminClient
      .from("users")
      .select("id, status, daily_ai_token_limit")
      .eq("id", userId)
      .single();

    if (userError || !userRow) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userRow.status !== "active") {
      return new Response(JSON.stringify({ error: "Account suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SummarizeRequest;
    const fileName = body.fileName?.trim();
    const extractedText = body.extractedText?.trim();
    const actionType = (body.actionType?.trim() || "summarize_pdf").slice(0, 100);

    if (!fileName || !extractedText) {
      return new Response(JSON.stringify({ error: "fileName and extractedText are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokensEstimate = estimateTokens(extractedText);
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const { data: usageRows, error: usageReadError } = await adminClient
      .from("ai_usage")
      .select("tokens_used")
      .eq("user_id", userId)
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    if (usageReadError) {
      throw usageReadError;
    }

    const todayUsed = (usageRows ?? []).reduce((acc, row) => acc + Number(row.tokens_used || 0), 0);
    const dailyLimit = Number(userRow.daily_ai_token_limit ?? AI_DAILY_DEFAULT_LIMIT);
    if (todayUsed + tokensEstimate > dailyLimit) {
      return new Response(JSON.stringify({ error: "Daily AI usage limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an academic assistant. Generate a concise, structured study summary with key points and revision bullets.",
          },
          {
            role: "user",
            content: `File: ${fileName}\n\nText:\n${extractedText}`,
          },
        ],
      }),
    });

    if (!openAiResp.ok) {
      const errText = await openAiResp.text();
      return new Response(JSON.stringify({ error: "AI provider failed", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await openAiResp.json();
    const summaryText: string = aiJson?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!summaryText) {
      return new Response(JSON.stringify({ error: "Empty summary returned by AI provider" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: insertedSummary, error: summaryError } = await adminClient
      .from("ai_summaries")
      .insert({
        user_id: userId,
        file_name: fileName,
        summary_text: summaryText,
      })
      .select("id, user_id, file_name, summary_text, created_at")
      .single();

    if (summaryError) {
      throw summaryError;
    }

    const { error: usageWriteError } = await adminClient.from("ai_usage").insert({
      user_id: userId,
      action_type: actionType,
      tokens_used: tokensEstimate,
    });

    if (usageWriteError) {
      throw usageWriteError;
    }

    return new Response(
      JSON.stringify({
        summary: insertedSummary,
        usage: {
          tokens_used: tokensEstimate,
          today_used: todayUsed + tokensEstimate,
          daily_limit: dailyLimit,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected server error",
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

