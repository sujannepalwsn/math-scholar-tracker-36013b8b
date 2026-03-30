import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Always log method and URL for troubleshooting
  console.log(`[OCR] ${req.method} request received`);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      throw new Error("No image data provided in request body");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error(JSON.stringify({ event: 'error', message: '[OCR] LOVABLE_API_KEY is not configured' }));
      return new Response(
        JSON.stringify({ error: 'OCR service is not properly configured on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
- learning_activities: Section 3. Teaching Learning Activities (Extract as an array of exactly 4 strings for slots a, b, c, d. If fewer, pad with empty strings)
- evaluation_activities: Section 4. Class Review / Evaluation (Extract as an array of exactly 4 strings for slots a, b, c, d. If fewer, pad with empty strings)
- class_work: Section 5. Class Work
- home_assignment: Section 5. Home Assignment
- notes: Any additional notes or teaching aids mentioned.

Guidelines:
- Return ONLY the structured JSON object. No other text or markdown formatting.
- If a field is empty or unreadable, return an empty string.
- For activities, always provide an array of exactly 4 strings.
- Standardize the date to YYYY-MM-DD.`;

    console.log("[OCR] Calling AI Gateway...");
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract lesson plan data from this image.' },
              {
                type: 'image_url',
                image_url: { url: image },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OCR] AI Gateway Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `AI Processing failed: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("[OCR] Successfully received AI response.");

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch (parseErr) {
      console.error(JSON.stringify({ event: 'error', message: '[OCR] Failed to parse AI content:', details: data.choices[0].message.content }));
      throw new Error("The AI service returned an invalid data format.");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'error', message: '[OCR] Internal Error:', details: error }));
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred during OCR processing.',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
