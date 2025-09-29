import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'flux', width = 1024, height = 1024 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Generating image with prompt:', prompt);

    // Generate image using Pollinations AI API
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=${width}&height=${height}`;
    
    console.log('Fetching image from:', imageUrl);
    
    // Fetch the generated image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Image generated, size:', imageBuffer.byteLength, 'bytes');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${timestamp}_${sanitizedPrompt}.webp`;

    console.log('Uploading image to storage with filename:', filename);

    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    console.log('Image uploaded successfully:', uploadData);

    // Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;
    console.log('Image public URL:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        filename: filename,
        prompt: prompt,
        model: model,
        dimensions: { width, height }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate and save image';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});