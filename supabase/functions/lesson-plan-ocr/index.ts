import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a highly capable OCR and data extraction assistant specialized in handwritten lesson plans.
You will be provided with an image of a handwritten "Daily Lesson Plan" in a specific printed format.
Your task is to extract the text from the image and format it into a structured JSON object.

The fields to extract are:
- subject: The subject name
- class: The class/grade
- unit: The unit or chapter
- period: The period number
- topic: The lesson topic
- date: The date (format as YYYY-MM-DD if possible)
- objectives: Section 1. Learning Outcomes
- warm_up_review: Section 2. Warm up & Review
- learning_activities: Section 3. Teaching Learning Activities (Extract as an array of 4 strings for slots a, b, c, d)
- evaluation_activities: Section 4. Class Review / Evaluation (Extract as an array of 4 strings for slots a, b, c, d)
- class_work: Section 5. Class Work
- home_assignment: Section 5. Home Assignment
- notes: Any additional notes or teaching aids mentioned.

If a field is empty, return an empty string (or empty array for activities).
Only return the structured JSON object. No other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract data from this handwritten lesson plan image." },
              {
                type: "image_url",
                image_url: {
                  url: image, // Data URL or public URL
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway Error:", errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lesson-plan-ocr:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
