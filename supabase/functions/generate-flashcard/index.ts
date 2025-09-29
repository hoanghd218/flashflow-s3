import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sentence, vocab } = await req.json();

    if (!vocab) {
      return new Response(JSON.stringify({ error: 'Vocab is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are an assistant that generates English learning flashcards for Vietnamese learners.

The input will include:
A single English word or phrase (vocab): ${vocab}
${sentence ? `Optionally, a full English sentence where the vocab is used: ${sentence}` : ''}

Your task is to return a JSON object with the following structure:

Required fields:
front: (string) The English word/phrase itself.
back: (string) The Vietnamese meaning (short, concise).

Optional fields:
englishDefinition: (string) Clear and simple English definition, always include the part of speech (e.g., "verb", "noun", "adjective").
vietnameseDefinition: (string) Full Vietnamese explanation, also state clearly the part of speech (ví dụ: "Động từ chỉ hành động lau, chùi").
example: (string) An example sentence in English. ${sentence ? `Always use this sentence as the example: ${sentence}` : ''}
exampleTranslation: (string) The Vietnamese translation of the example sentence.
pronunciationText: (string) IPA pronunciation or simplified pronunciation guide.
frontImageUrl: (string) A link to an image from the internet that visually represents the word/phrase.
backImageUrl: (string) Another relevant image (optional).

Constraints:
Always output in valid JSON format.
Always include at least the front and back fields.
If possible, find a relevant image URL online for frontImageUrl (e.g., from Wikimedia or another open source).
Keep definitions simple and understandable for beginner/intermediate English learners in Vietnam.
${sentence ? 'Always use the provided sentence as example.' : ''}
Always specify the part of speech in both englishDefinition and vietnameseDefinition.

Return ONLY the JSON object, no additional text.`;

    console.log('Sending request to OpenRouter with prompt:', prompt);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chlltfkztqvcvsfmjnbl.supabase.co',
        'X-Title': 'Flashcard Generator',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter response:', data);

    const generatedContent = data.choices[0].message.content.trim();
    
    // Try to parse the JSON response
    let flashcardData;
    try {
      flashcardData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', generatedContent);
      throw new Error('AI response is not valid JSON');
    }

    // Validate required fields
    if (!flashcardData.front || !flashcardData.back) {
      throw new Error('Generated flashcard missing required fields');
    }

    console.log('Generated flashcard:', flashcardData);

    return new Response(JSON.stringify({ flashcard: flashcardData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-flashcard function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});