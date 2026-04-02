import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY"); // Preferred
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY"); // Fallback if available

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { entityType, entityId, centerId, textContent } = await req.json();

    if (!textContent) throw new Error("No text content provided for analysis.");

    // Simple Sentiment Logic if no AI API
    const analyzeSentimentSimple = (text: string) => {
      const positiveWords = ["great", "excellent", "good", "improvement", "active", "happy", "success", "bright"];
      const negativeWords = ["poor", "struggling", "distracted", "behind", "slow", "lazy", "trouble", "fail", "absent", "missed"];

      let score = 0;
      text.toLowerCase().split(/\s+/).forEach(word => {
        if (positiveWords.includes(word)) score += 0.2;
        if (negativeWords.includes(word)) score -= 0.2;
      });
      return Math.max(-1, Math.min(1, score));
    };

    let sentimentScore = analyzeSentimentSimple(textContent);
    let aiInsight = textContent; // Default to original if AI fails

    // 1. AI Integration (OpenAI or Gemini/Lovable Gateway)
    const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an educational psychologist analyzing student notes or teacher logs. Provide a sentiment score between -1 and 1 and a brief summary of the behavior or lesson." },
              { role: "user", content: `Analyze this content for ${entityType} ID ${entityId}: ${textContent}` }
            ],
            response_format: { type: "json_object" }
          }),
        });

        const data = await aiResponse.json();
        const content = JSON.parse(data.choices[0].message.content);
        sentimentScore = content.sentiment_score || sentimentScore;
        aiInsight = content.summary || aiInsight;
      } catch (e) {
        console.error("AI Analysis failed:", e);
      }
    }

    // 2. Save Insight
    await supabase.from("ai_insights").insert({
      center_id: centerId,
      entity_type: entityType,
      entity_id: entityId,
      insight_type: "sentiment",
      content: aiInsight,
      sentiment_score: sentimentScore,
      metadata: { original_text: textContent }
    });

    // 3. Alerts for very negative sentiment
    if (sentimentScore < -0.6) {
      const { data: admins } = await supabase.from("users").select("id").eq("center_id", centerId).in("role", ["admin", "center"]);
      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          center_id: centerId,
          title: "Negative Sentiment Detected",
          message: `Highly negative sentiment or behavior detected for ${entityType} ${entityId}. Intervention may be needed.`,
          type: "warning",
          is_ai_insight: true
        });
      }
    }

    return new Response(JSON.stringify({ success: true, sentimentScore, insight: aiInsight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
